// app/api/manufacturing/production-orders/route.ts - AN-Industory Atomic Production API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const orders = await prisma.productionOrder.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                product: true,
                billOfMaterials: true
            }
        });
        return NextResponse.json({ orders });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, companyId } = await requireManufacturingAccess();
        const body = await request.json();
        const { productId, quantity, productName, priority, startDate, notes } = body;

        if (!productId || !quantity) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch the Recipe (BOM) for this product
        const recipe = await prisma.billOfMaterial.findMany({
            where: { companyId, productId, productionOrderId: null }
        });

        // 2. Perform Atomic Transaction for Production + Stock Adjustment
        const result = await prisma.$transaction(async (tx) => {
            // A. Create the Production Order
            const order = await tx.productionOrder.create({
                data: {
                    companyId,
                    productId,
                    productName,
                    quantity: parseInt(quantity),
                    status: 'COMPLETED', // Automated instant finish
                    priority: priority || 'MEDIUM',
                    startDate: startDate ? new Date(startDate) : new Date(),
                    completedDate: new Date(),
                    orderNumber: `PO-${Date.now()}`,
                    notes: notes || 'Automatic production run'
                }
            });

            // B. Increase Finished Goods Stock (The Caagad)
            // We search for a FactoryMaterial entry with the same name as the product
            let finishedGood = await tx.factoryMaterial.findFirst({
                where: { companyId, name: productName }
            });

            if (finishedGood) {
                // If it already exists in inventory, increment stock
                finishedGood = await tx.factoryMaterial.update({
                    where: { id: finishedGood.id },
                    data: { inStock: { increment: parseFloat(quantity) } }
                });
            } else {
                // Fetch the product catalog details to populate cost and selling price
                const catalogItem = await tx.productCatalog.findUnique({
                    where: { id: productId }
                });

                // Auto-create the finished good in the inventory system!
                finishedGood = await tx.factoryMaterial.create({
                    data: {
                        companyId,
                        userId,
                        name: productName,
                        sku: `FG-${Math.random().toString(36).substring(7).toUpperCase()}`,
                        category: 'Finished Goods',
                        unit: catalogItem?.unit || 'pcs',
                        inStock: parseFloat(quantity),
                        minStock: 5,
                        purchasePrice: Number(catalogItem?.standardCost) || 0,
                        sellingPrice: Number(catalogItem?.sellingPrice) || 0,
                        location: 'Warehouse'
                    }
                });
            }

            // C. Decrease Raw Material Stocks based on BOM
            let totalMaterialCost = 0;
            for (const item of recipe) {
                const material = await tx.factoryMaterial.findFirst({
                    where: { companyId, name: item.materialName }
                });

                if (material) {
                    const totalNeeded = item.quantity * quantity;
                    const costPerUnit = Number(material.purchasePrice) || 0;
                    const totalCost = totalNeeded * costPerUnit;
                    totalMaterialCost += totalCost;

                    await tx.factoryMaterial.update({
                        where: { id: material.id },
                        data: { inStock: { decrement: totalNeeded } }
                    });

                    // Record the raw material consumed
                    await tx.manufacturingUsed.create({
                        data: {
                            companyId,
                            productionOrderId: order.id,
                            materialName: item.materialName,
                            quantityUsed: totalNeeded,
                            unit: material.unit || 'pcs',
                            costPerUnit: costPerUnit,
                            totalCost: totalCost,
                            usedDate: new Date()
                        }
                    });
                }
            }

            // Create CostTracking record for the Production Order
            await tx.costTracking.create({
                data: {
                    companyId,
                    productionOrderId: order.id,
                    actualMaterialCost: totalMaterialCost,
                    actualLaborCost: 0,
                    overheadCost: 0,
                    notes: 'Auto-calculated cost from raw materials consumption'
                }
            });

            // Create Work Orders (daily production run percentage) for assigned employees
            if (body.workers && Array.isArray(body.workers)) {
                for (const w of body.workers) {
                    await tx.workOrder.create({
                        data: {
                            companyId,
                            stage: 'Production',
                            description: `Production Run Assignment: ${productName}`,
                            estimatedHours: 8.0,
                            actualHours: 8.0,
                            status: 'COMPLETED',
                            startTime: startDate ? new Date(startDate) : new Date(),
                            endTime: new Date(),
                            notes: `Daily production run percentage assignment (${w.rate}%)`,
                            assignedToId: w.employeeId,
                            productionOrderId: order.id,
                            productionRate: parseFloat(w.rate) || 0.0
                        }
                    });
                }
            }

            return order;
        });

        return NextResponse.json({ order: result, message: 'Production completed and stock updated!' });
    } catch (error: any) {
        console.error('Production Error:', error);
        return NextResponse.json({ message: 'Error processing production', error: error.message }, { status: 500 });
    }
}

