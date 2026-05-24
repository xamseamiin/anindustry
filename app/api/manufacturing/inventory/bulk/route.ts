import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();

        const body = await req.json();
        const { products } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        for (const item of products) {
            try {
                // Check if SKU exists within this company
                const existing = await prisma.factoryMaterial.findFirst({
                    where: {
                        sku: item.sku,
                        companyId: companyId
                    }
                });

                if (existing) {
                    await prisma.factoryMaterial.update({
                        where: { id: existing.id },
                        data: {
                            name: item.name,
                            inStock: existing.inStock + (parseFloat(item.stock) || 0),
                            purchasePrice: parseFloat(item.costPrice || item.purchasePrice) || 0,
                            sellingPrice: parseFloat(item.sellingPrice) || 0,
                            category: item.category,
                            minStock: parseFloat(item.minStock) || 10,
                            description: item.description,
                            location: item.location
                        }
                    });
                } else {
                    await prisma.factoryMaterial.create({
                        data: {
                            name: item.name,
                            sku: item.sku || `FAC-${Math.floor(Math.random() * 100000)}`,
                            category: item.category || 'Raw Materials',
                            unit: item.unit || 'pcs',
                            inStock: parseFloat(item.stock) || 0,
                            minStock: parseFloat(item.minStock) || 10,
                            purchasePrice: parseFloat(item.costPrice || item.purchasePrice) || 0,
                            sellingPrice: parseFloat(item.sellingPrice) || 0,
                            location: item.location,
                            companyId: companyId,
                            userId: userId
                        }
                    });
                }
                successCount++;
            } catch (err: any) {
                console.error(`Failed to import factory material ${item.name}:`, err);
                failedCount++;
                errors.push({ sku: item.sku, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            successCount,
            failedCount,
            errors
        });

    } catch (error: any) {
        console.error('Factory Bulk Import Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
