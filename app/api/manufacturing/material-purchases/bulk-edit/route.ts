import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';
import { syncProductCostsForMaterial } from '@/lib/manufacturing/cost-sync';

// PUT /api/manufacturing/material-purchases/bulk-edit
export async function PUT(request: Request) {
  try {
    const { companyId, userId } = await requireManufacturingAccess();
    const body = await request.json();
    
    const purchaseIds: string[] = body.purchaseIds || [];
    const excludedIds: string[] = body.excludedIds || [];
    
    if (purchaseIds.length === 0) {
        return NextResponse.json({ message: 'No purchases selected' }, { status: 400 });
    }

    const newTransport = parseFloat(body.transportCost || '0');
    const newTax = parseFloat(body.taxAmount || '0');
    const newOther = parseFloat(body.otherCosts || '0');
    const totalNewExtraCosts = newTransport + newTax + newOther;

    if (totalNewExtraCosts <= 0) {
        return NextResponse.json({ message: 'No new extra costs provided' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        // Fetch the selected purchases
        const purchases = await tx.materialPurchase.findMany({
            where: { id: { in: purchaseIds }, companyId }
        });

        if (purchases.length === 0) {
            throw new Error('Purchases not found');
        }

        // We distribute the NEW extra costs based on the original base price (totalPrice - previous extra costs)
        // Since we don't have basePrice stored separately, we can calculate it:
        // basePrice = totalPrice - transportCost - taxAmount - otherCosts
        let eligibleCost = 0;
        const purchaseData = purchases.map(p => {
            const baseTotal = p.totalPrice - (p.transportCost + p.taxAmount + p.otherCosts);
            const isExcluded = excludedIds.includes(p.id);
            if (!isExcluded) {
                eligibleCost += baseTotal;
            }
            return { ...p, baseTotal, isExcluded };
        });

        if (eligibleCost <= 0) {
            throw new Error('All selected purchases are excluded or have 0 value. Cannot distribute costs.');
        }

        for (const item of purchaseData) {
            let addTransport = 0;
            let addTax = 0;
            let addOther = 0;

            if (!item.isExcluded) {
                const proportion = item.baseTotal / eligibleCost;
                addTransport = newTransport * proportion;
                addTax = newTax * proportion;
                addOther = newOther * proportion;
            }

            const itemNewTransport = item.transportCost + addTransport;
            const itemNewTax = item.taxAmount + addTax;
            const itemNewOther = item.otherCosts + addOther;
            
            const newTotalExtra = itemNewTransport + itemNewTax + itemNewOther;
            const itemNewLandedTotal = item.baseTotal + newTotalExtra;
            const itemNewLandedUnitPrice = item.quantity > 0 ? (itemNewLandedTotal / item.quantity) : 0;

            // Update the purchase record
            await tx.materialPurchase.update({
                where: { id: item.id },
                data: {
                    unitPrice: itemNewLandedUnitPrice,
                    totalPrice: itemNewLandedTotal,
                    transportCost: itemNewTransport,
                    taxAmount: itemNewTax,
                    otherCosts: itemNewOther,
                    landedCostApplied: item.isExcluded ? false : true,
                    // Note: we do NOT change paidAmount or paymentStatus directly here, 
                    // because the original payment was for the original total.
                    // The new debt will be recorded as a transaction.
                }
            });

            // Update FactoryMaterial
            const material = await tx.factoryMaterial.findFirst({
                where: { name: item.materialName, companyId }
            });

            if (material) {
                await tx.factoryMaterial.update({
                    where: { id: material.id },
                    data: {
                        purchasePrice: itemNewLandedUnitPrice
                    }
                });
                await syncProductCostsForMaterial(companyId, item.materialName, itemNewLandedUnitPrice, tx);
            }
        }

        // Record the new extra costs as Debt (Payable)
        const vendorId = purchases[0].vendorId; // Assuming all selected purchases are from the same vendor usually, or we just pick the first.
        // Or better, we can record it against a generic 'Logistics/Tax' vendor if specified, but user said "iguso dalacada" (charge me), so we'll use the original vendor.
        await tx.transaction.create({
            data: {
                companyId,
                userId,
                amount: totalNewExtraCosts,
                type: 'DEBT_TAKEN',
                category: 'Landed Costs Update',
                description: `Additional Landed Costs (Transport/Tax) applied to past purchases.`,
                transactionDate: new Date(),
                vendorId: vendorId
            }
        });

        return { message: 'Purchases updated successfully' };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating purchases:', error);
    return NextResponse.json({ message: 'Error updating purchases', details: error.message }, { status: 500 });
  }
}
