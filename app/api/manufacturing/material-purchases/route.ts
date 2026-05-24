import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';
import { syncProductCostsForMaterial } from '@/lib/manufacturing/cost-sync';

// GET /api/manufacturing/material-purchases

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { materialName: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const purchases = await prisma.materialPurchase.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      include: {
        vendor: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ message: 'Error fetching purchases' }, { status: 500 });
  }
}

// POST /api/manufacturing/material-purchases
export async function POST(request: Request) {
  try {
    const { companyId, userId } = await requireManufacturingAccess();
    const body = await request.json();
    
    const items = body.items || [];
    if (items.length === 0) {
        return NextResponse.json({ message: 'Items are required' }, { status: 400 });
    }

    const globalTransport = parseFloat(body.transportCost || '0');
    const globalTax = parseFloat(body.taxAmount || '0');
    const globalOther = parseFloat(body.otherCosts || '0');
    const totalExtraCosts = globalTransport + globalTax + globalOther;

    const baseTotalCost = items.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice), 0);
    const eligibleCost = items.reduce((sum: number, item: any) => sum + (item.excludeLandedCost ? 0 : parseFloat(item.totalPrice)), 0);
    const grandTotalCost = baseTotalCost + totalExtraCosts;

    const paidAmount = parseFloat(body.paidAmount || '0');
    const accountId = body.accountId;
    
    let paymentStatus = 'UNPAID';
    if (paidAmount >= grandTotalCost) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIAL';

    const result = await prisma.$transaction(async (tx) => {
        const createdPurchases = [];
        
        // 1. Create Purchase Records
        for (const item of items) {
            const itemBaseTotal = parseFloat(item.totalPrice);
            const itemQty = parseFloat(item.quantity);
            
            // Calculate landed cost for this item
            let itemTransport = 0;
            let itemTax = 0;
            let itemOther = 0;

            if (!item.excludeLandedCost && eligibleCost > 0) {
                const proportion = itemBaseTotal / eligibleCost;
                itemTransport = globalTransport * proportion;
                itemTax = globalTax * proportion;
                itemOther = globalOther * proportion;
            }

            const itemExtraTotal = itemTransport + itemTax + itemOther;
            const itemLandedTotal = itemBaseTotal + itemExtraTotal;
            const itemLandedUnitPrice = itemQty > 0 ? (itemLandedTotal / itemQty) : 0;

            // Distribute paidAmount proportionally for record keeping based on grand total
            const paymentProportion = grandTotalCost > 0 ? (itemLandedTotal / grandTotalCost) : 0;
            const itemPaid = paidAmount * paymentProportion;

            const purchase = await tx.materialPurchase.create({
                data: {
                    companyId,
                    materialName: item.materialName,
                    quantity: itemQty,
                    unit: item.unit,
                    unitPrice: itemLandedUnitPrice, // Store the final landed unit cost
                    totalPrice: itemLandedTotal,    // Store the final landed total cost
                    transportCost: itemTransport,
                    taxAmount: itemTax,
                    otherCosts: itemOther,
                    landedCostApplied: !item.excludeLandedCost,
                    paidAmount: itemPaid,
                    paymentStatus: paymentStatus,
                    vendorId: body.vendorId,
                    purchaseDate: new Date(body.purchaseDate),
                    invoiceNumber: body.invoiceNumber,
                    notes: body.notes
                }
            });
            createdPurchases.push(purchase);

            // Automate Factory Material Stock Update
            if (body.updateInventory !== false) {
                const material = await tx.factoryMaterial.findFirst({
                    where: { name: item.materialName, companyId }
                });

                if (material) {
                    await tx.factoryMaterial.update({
                        where: { id: material.id },
                        data: {
                            inStock: { increment: itemQty },
                            // Update purchase price to the new landed unit price
                            purchasePrice: itemLandedUnitPrice
                        }
                    });
                    await syncProductCostsForMaterial(companyId, item.materialName, itemLandedUnitPrice, tx);
                } else {
                    await tx.factoryMaterial.create({
                        data: {
                            companyId,
                            userId: userId || 'SYSTEM',
                            name: item.materialName,
                            sku: `RAW-${Math.random().toString(36).substring(7).toUpperCase()}`,
                            category: 'Raw Material',
                            unit: item.unit,
                            inStock: itemQty,
                            minStock: 10,
                            purchasePrice: itemLandedUnitPrice, // Set initial landed cost
                            sellingPrice: 0,
                            location: 'Warehouse'
                        }
                    });
                    await syncProductCostsForMaterial(companyId, item.materialName, itemLandedUnitPrice, tx);
                }
            }
        }

        // 2. Handle Financial Transaction
        if (paidAmount > 0 && accountId) {
            // Record Expense
            await tx.transaction.create({
                data: {
                    companyId,
                    userId,
                    amount: paidAmount,
                    type: 'EXPENSE',
                    category: 'Material Purchase',
                    description: `Material Purchase Payment - Inv: ${body.invoiceNumber || 'N/A'}`,
                    transactionDate: new Date(body.purchaseDate),
                    accountId: accountId,
                    vendorId: body.vendorId
                }
            });
            // Deduct balance
            await tx.account.update({
                where: { id: accountId },
                data: { balance: { decrement: paidAmount } }
            });
        }
        
        const debt = grandTotalCost - paidAmount;
        if (debt > 0) {
            // Record Debt (Payable) including the extra costs
            await tx.transaction.create({
                data: {
                    companyId,
                    userId,
                    amount: debt,
                    type: 'DEBT_TAKEN',
                    category: 'Material Purchase Debt',
                    description: `Unpaid Material Purchase (Includes transport/tax) - Inv: ${body.invoiceNumber || 'N/A'}`,
                    transactionDate: new Date(body.purchaseDate),
                    vendorId: body.vendorId
                }
            });
        }

        return createdPurchases;
    }, {
        maxWait: 10000, // 10 seconds max wait to connect to DB
        timeout: 30000  // 30 seconds timeout for the transaction to complete
    });

    return NextResponse.json({ purchases: result, message: 'Purchase recorded successfully' });
  } catch (error: any) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ message: 'Error creating purchase', details: error.message }, { status: 500 });
  }
}
