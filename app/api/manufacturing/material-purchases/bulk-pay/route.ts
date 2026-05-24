import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export async function POST(request: Request) {
  try {
    const { companyId, userId } = await requireManufacturingAccess();
    const body = await request.json();

    const { purchaseIds, amount, accountId } = body;
    const paymentAmount = parseFloat(amount);

    if (!purchaseIds || purchaseIds.length === 0 || !amount || paymentAmount <= 0 || !accountId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Verify account exists and has sufficient balance
    const account = await prisma.account.findFirst({
        where: { id: accountId, companyId }
    });
    
    if (!account) {
        return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    
    if (account.balance < paymentAmount) {
        return NextResponse.json({ message: 'Khasnadda lacag kugu filan kuma jirto (Insufficient balance)' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        // Fetch all purchases to pay
        const purchases = await tx.materialPurchase.findMany({
            where: { id: { in: purchaseIds }, companyId }
        });

        if (purchases.length === 0) {
            throw new Error('No valid purchases found');
        }

        // Calculate total unpaid debt for these purchases
        const totalDebt = purchases.reduce((sum, p) => sum + (p.totalPrice - p.paidAmount), 0);

        if (paymentAmount > totalDebt + 0.1) { // 0.1 for float tolerance
            throw new Error('Payment amount exceeds total debt for these items');
        }

        let remainingPayment = paymentAmount;
        let invoiceNum = purchases[0].invoiceNumber || 'Bulk';
        let vendorId = purchases[0].vendorId;
        
        for (const p of purchases) {
            if (remainingPayment <= 0) break;
            
            const itemDebt = p.totalPrice - p.paidAmount;
            if (itemDebt <= 0) continue;

            // Pay off as much as possible for this item
            const payForItem = Math.min(itemDebt, remainingPayment);
            
            const newPaidAmount = p.paidAmount + payForItem;
            let status = 'UNPAID';
            if (newPaidAmount >= p.totalPrice) status = 'PAID';
            else if (newPaidAmount > 0) status = 'PARTIAL';

            await tx.materialPurchase.update({
                where: { id: p.id },
                data: {
                    paidAmount: newPaidAmount,
                    paymentStatus: status
                }
            });

            remainingPayment -= payForItem;
        }

        // Record the expense transaction
        await tx.transaction.create({
            data: {
                companyId,
                userId,
                amount: paymentAmount,
                type: 'EXPENSE',
                category: 'Material Purchase Debt Payment',
                description: `Payment for multiple material purchases (Grouped). Invoice: ${invoiceNum}`,
                transactionDate: new Date(),
                accountId: accountId,
                vendorId: vendorId
            }
        });

        // Deduct from account
        await tx.account.update({
            where: { id: accountId },
            data: { balance: { decrement: paymentAmount } }
        });

        return { message: 'Lacagta waa la bixiyay' };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing bulk payment:', error);
    return NextResponse.json({ message: error.message || 'Error processing payment' }, { status: 500 });
  }
}
