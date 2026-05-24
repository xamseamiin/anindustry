import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export async function POST(request: Request) {
  try {
    const { companyId } = await requireManufacturingAccess();
    const body = await request.json();
    
    const purchaseIds: string[] = body.purchaseIds || [];
    const refundAccountId: string = body.refundAccountId || '';
    
    if (purchaseIds.length === 0) {
        return NextResponse.json({ message: 'No purchases selected to delete' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        // Fetch the selected purchases
        const purchases = await tx.materialPurchase.findMany({
            where: { id: { in: purchaseIds }, companyId }
        });

        if (purchases.length === 0) {
            throw new Error('Purchases not found');
        }

        let totalPaid = 0;
        const vendorId = purchases[0].vendorId;
        const invoiceNumber = purchases[0].invoiceNumber;
        const purchaseDate = purchases[0].purchaseDate;

        for (const p of purchases) {
            totalPaid += (p.paidAmount || 0);

            // Revert inventory (decrement inStock)
            if (p.quantity > 0) {
                const material = await tx.factoryMaterial.findFirst({
                    where: { name: p.materialName, companyId }
                });
                
                if (material) {
                    await tx.factoryMaterial.update({
                        where: { id: material.id },
                        data: {
                            inStock: { decrement: p.quantity }
                        }
                    });
                }
            }
        }

        // Refund money if any was paid and account is provided
        if (totalPaid > 0) {
            if (!refundAccountId) {
                throw new Error('Refund account is required because money was paid.');
            }
            
            // Increment the account balance (refund)
            await tx.account.update({
                where: { id: refundAccountId },
                data: { balance: { increment: totalPaid } }
            });
        }

        // Clean up Transactions
        // We look for transactions created that match the invoice number or reference
        if (invoiceNumber) {
            // Delete Original Expense, Debt Taken, and Debt Payments related to this invoice
            await tx.transaction.deleteMany({
                where: {
                    companyId,
                    vendorId,
                    OR: [
                        { description: { contains: `Inv: ${invoiceNumber}` } },
                        { description: { contains: `Invoice: ${invoiceNumber}` } },
                        { description: { contains: `PAY-${invoiceNumber}` } },
                        { description: { contains: `Deynbixinta: ${invoiceNumber}` } }
                    ]
                }
            });
        } else {
             // For batches without invoice numbers, delete by "N/A" if it was used, 
             // but that's risky as it might delete other "N/A" batches.
             // We can match by date and vendorId more strictly.
             // Best effort cleanup for "N/A" invoices:
             const startOfDay = new Date(purchaseDate);
             startOfDay.setHours(0, 0, 0, 0);
             const endOfDay = new Date(purchaseDate);
             endOfDay.setHours(23, 59, 59, 999);
             
             await tx.transaction.deleteMany({
                 where: {
                     companyId,
                     vendorId,
                     transactionDate: {
                         gte: startOfDay,
                         lte: endOfDay
                     },
                     description: { contains: 'Material Purchase' }
                 }
             });
        }

        // Finally, delete the MaterialPurchases
        await tx.materialPurchase.deleteMany({
            where: { id: { in: purchaseIds }, companyId }
        });

        return { message: 'Purchases deleted and rolled back safely' };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting purchases:', error);
    return NextResponse.json({ message: error.message || 'Error deleting purchases' }, { status: 500 });
  }
}
