import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';
import { syncProductCostsForMaterial } from '@/lib/manufacturing/cost-sync';

export async function PUT(request: Request) {
  try {
    const { companyId, userId } = await requireManufacturingAccess();
    const body = await request.json();

    const { 
        oldPurchaseIds, 
        vendorId, 
        purchaseDate, 
        invoiceNumber, 
        notes, 
        updateInventory, 
        items, 
        paidAmount, 
        accountId,
        transportCost,
        taxAmount,
        otherCosts
    } = body;

    if (!oldPurchaseIds || oldPurchaseIds.length === 0 || !items || items.length === 0 || !vendorId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (paidAmount > 0 && !accountId) {
      return NextResponse.json({ message: 'Fadlan dooro koontada lacagta laga bixinayo' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        // ==========================================
        // 1. DELETE & ROLLBACK OLD BATCH
        // ==========================================
        const oldPurchases = await tx.materialPurchase.findMany({
            where: { id: { in: oldPurchaseIds }, companyId }
        });

        if (oldPurchases.length > 0) {
            const oldVendorId = oldPurchases[0].vendorId;
            const oldInvoiceNumber = oldPurchases[0].invoiceNumber;

            // Revert Inventory
            for (const p of oldPurchases) {
                const material = await tx.factoryMaterial.findFirst({
                    where: { name: p.materialName, companyId }
                });
                if (material) {
                    await tx.factoryMaterial.update({
                        where: { id: material.id },
                        data: { inStock: { decrement: p.quantity } } // Reverse the purchase
                    });
                }
            }

            // Refund Old Paid Amount
            let oldTotalPaid = 0;
            for (const p of oldPurchases) {
                oldTotalPaid += (p.paidAmount || 0);
            }

            if (oldTotalPaid > 0) {
                // Find original account
                let originalAccountId = accountId; // Default to the newly selected one
                const txLog = await tx.transaction.findFirst({
                    where: {
                        companyId,
                        vendorId: oldVendorId,
                        type: 'EXPENSE',
                        OR: [
                            { description: { contains: oldInvoiceNumber ? `Inv: ${oldInvoiceNumber}` : 'Material Purchase' } },
                            { description: { contains: oldInvoiceNumber ? `Invoice: ${oldInvoiceNumber}` : 'Material Purchase' } }
                        ]
                    },
                    orderBy: { transactionDate: 'asc' }
                });

                if (txLog && txLog.accountId) {
                    originalAccountId = txLog.accountId;
                }

                if (originalAccountId) {
                    await tx.account.update({
                        where: { id: originalAccountId },
                        data: { balance: { increment: oldTotalPaid } }
                    });
                    
                    // Add refund log
                    await tx.transaction.create({
                        data: {
                            companyId,
                            userId,
                            accountId: originalAccountId,
                            amount: oldTotalPaid,
                            type: 'INCOME',
                            category: 'Refund',
                            description: `Refund for edited purchase (Inv: ${oldInvoiceNumber || 'N/A'})`,
                            transactionDate: new Date(),
                            vendorId: oldVendorId
                        }
                    });
                }
            }

            // Cleanup old transaction logs
            if (oldInvoiceNumber) {
                await tx.transaction.deleteMany({
                    where: {
                        companyId,
                        vendorId: oldVendorId,
                        OR: [
                            { description: { contains: `Inv: ${oldInvoiceNumber}` } },
                            { description: { contains: `Invoice: ${oldInvoiceNumber}` } },
                            { description: { contains: `PAY-${oldInvoiceNumber}` } },
                            { description: { contains: `Deynbixinta: ${oldInvoiceNumber}` } }
                        ]
                    }
                });
            } else {
                const startOfDay = new Date(oldPurchases[0].purchaseDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(oldPurchases[0].purchaseDate);
                endOfDay.setHours(23, 59, 59, 999);
                
                await tx.transaction.deleteMany({
                    where: {
                        companyId,
                        vendorId: oldVendorId,
                        transactionDate: { gte: startOfDay, lte: endOfDay },
                        description: { contains: 'Material Purchase' }
                    }
                });
            }

            // Delete old MaterialPurchase records
            await tx.materialPurchase.deleteMany({
                where: { id: { in: oldPurchaseIds } }
            });
        }

        // ==========================================
        // 2. CREATE NEW BATCH
        // ==========================================
        let grandTotal = 0;
        let createdPurchases = [];

        // Distribute Landed Costs
        const includedItems = items.filter((i: any) => !i.excludeLandedCost);
        const totalItemsForLandedCost = includedItems.length > 0 ? includedItems.length : items.length;
        const transportPerItem = (transportCost || 0) / totalItemsForLandedCost;
        const taxPerItem = (taxAmount || 0) / totalItemsForLandedCost;
        const otherPerItem = (otherCosts || 0) / totalItemsForLandedCost;

        for (const item of items) {
            const applies = !item.excludeLandedCost || includedItems.length === 0;
            const itemTrans = applies ? transportPerItem : 0;
            const itemTax = applies ? taxPerItem : 0;
            const itemOther = applies ? otherPerItem : 0;

            const itemTotalPrice = item.quantity * item.unitPrice;
            grandTotal += itemTotalPrice;

            // Calculate new unit price with landed costs
            const totalItemExtraCost = itemTrans + itemTax + itemOther;
            let itemLandedUnitPrice = item.unitPrice;
            if (item.quantity > 0) {
                itemLandedUnitPrice = item.unitPrice + (totalItemExtraCost / item.quantity);
            }

            const purchase = await tx.materialPurchase.create({
                data: {
                    companyId,
                    vendorId,
                    materialName: item.materialName,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    totalPrice: itemTotalPrice,
                    purchaseDate: new Date(purchaseDate),
                    invoiceNumber: invoiceNumber || null,
                    notes,
                    transportCost: itemTrans,
                    taxAmount: itemTax,
                    otherCosts: itemOther,
                    landedCostApplied: applies,
                    paidAmount: 0,
                    paymentStatus: 'UNPAID'
                }
            });

            createdPurchases.push(purchase);

            if (updateInventory !== false) {
                const material = await tx.factoryMaterial.findFirst({
                    where: { name: item.materialName, companyId }
                });

                if (material) {
                    await tx.factoryMaterial.update({
                        where: { id: material.id },
                        data: {
                            inStock: { increment: item.quantity },
                            purchasePrice: itemLandedUnitPrice
                        }
                    });
                    await syncProductCostsForMaterial(companyId, item.materialName, itemLandedUnitPrice, tx);
                } else {
                    await tx.factoryMaterial.create({
                        data: {
                            companyId,
                            userId,
                            name: item.materialName,
                            sku: `MAT-${Math.floor(Math.random() * 10000)}`,
                            category: 'Raw Material',
                            unit: item.unit,
                            inStock: item.quantity,
                            purchasePrice: itemLandedUnitPrice,
                            minStock: 10
                        }
                    });
                    await syncProductCostsForMaterial(companyId, item.materialName, itemLandedUnitPrice, tx);
                }
            }
        }

        const totalExtraCosts = transportCost + taxAmount + otherCosts;
        const totalInvoiceAmount = grandTotal + totalExtraCosts;
        const paymentAmount = Math.min(paidAmount || 0, totalInvoiceAmount);

        // Record Expenses & Debts
        if (paymentAmount > 0) {
            await tx.transaction.create({
                data: {
                    companyId,
                    userId,
                    amount: paymentAmount,
                    type: 'EXPENSE',
                    category: 'Material Purchase',
                    description: `Material Purchase Payment - Inv: ${invoiceNumber || 'N/A'} (Edited)`,
                    transactionDate: new Date(purchaseDate),
                    accountId: accountId,
                    vendorId: vendorId
                }
            });

            await tx.account.update({
                where: { id: accountId },
                data: { balance: { decrement: paymentAmount } }
            });

            let remainingPayment = paymentAmount;
            for (const p of createdPurchases) {
                if (remainingPayment <= 0) break;
                const itemTotalWithLanded = p.totalPrice + p.transportCost + p.taxAmount + p.otherCosts;
                const payForItem = Math.min(itemTotalWithLanded, remainingPayment);
                
                await tx.materialPurchase.update({
                    where: { id: p.id },
                    data: {
                        paidAmount: payForItem,
                        paymentStatus: payForItem >= itemTotalWithLanded ? 'PAID' : 'PARTIAL'
                    }
                });
                remainingPayment -= payForItem;
            }
        }

        const debtAmount = totalInvoiceAmount - paymentAmount;
        if (debtAmount > 0) {
            await tx.transaction.create({
                data: {
                    companyId,
                    userId,
                    amount: debtAmount,
                    type: 'DEBT_TAKEN',
                    category: 'Material Purchase Debt',
                    description: `Debt for Material Purchase - Inv: ${invoiceNumber || 'N/A'} (Edited)`,
                    transactionDate: new Date(purchaseDate),
                    vendorId: vendorId
                }
            });
        }

        return createdPurchases;
    }, {
        maxWait: 10000,
        timeout: 30000 
    });

    return NextResponse.json({ purchases: result, message: 'Batch updated successfully' });
  } catch (error: any) {
    console.error('Error updating purchase batch:', error);
    return NextResponse.json({ message: error.message || 'Error updating purchase batch' }, { status: 500 });
  }
}
