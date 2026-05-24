import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET single purchase
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const purchase = await prisma.materialPurchase.findFirst({
      where: { id: params.id, companyId },
      include: {
        vendor: { select: { id: true, name: true, phone: true, email: true, contactPerson: true } },
        productionOrder: { select: { id: true, orderNumber: true, productName: true, status: true } }
      }
    });

    if (!purchase) {
      return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json({ purchase });
  } catch (error: any) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json({ message: 'Error fetching purchase', error: error.message }, { status: 500 });
  }
}

// PATCH: Record a payment against this purchase
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireManufacturingAccess();
    const body = await request.json();
    const payAmount = parseFloat(body.amount);
    const accountId = body.accountId;

    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ message: 'Invalid payment amount' }, { status: 400 });
    }

    const purchase = await prisma.materialPurchase.findFirst({
      where: { id: params.id, companyId }
    });

    if (!purchase) {
      return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });
    }

    const currentPaid = purchase.paidAmount || 0;
    const remaining = purchase.totalPrice - currentPaid;

    if (payAmount > remaining) {
      return NextResponse.json({ message: `Payment exceeds remaining debt of ${remaining}` }, { status: 400 });
    }

    const newPaid = currentPaid + payAmount;
    const newStatus = newPaid >= purchase.totalPrice ? 'PAID' : 'PARTIAL';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update purchase record
      const updated = await tx.materialPurchase.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaid,
          paymentStatus: newStatus
        }
      });

      // 2. Record expense transaction
      if (accountId) {
        await tx.transaction.create({
          data: {
            companyId,
            userId,
            amount: payAmount,
            type: 'DEBT_REPAID',
            category: 'Purchase Debt Payment',
            description: `Debt payment for ${purchase.materialName} - Remaining: ${(remaining - payAmount).toLocaleString()} ETB`,
            transactionDate: new Date(),
            accountId,
            vendorId: purchase.vendorId
          }
        });

        // 3. Deduct from account
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: payAmount } }
        });
      }

      return updated;
    });

    return NextResponse.json({ purchase: result, message: `Payment of ${payAmount.toLocaleString()} ETB recorded successfully` });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ message: 'Error recording payment', error: error.message }, { status: 500 });
  }
}

// DELETE purchase
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    await prisma.materialPurchase.delete({
      where: { id: params.id, companyId }
    });
    return NextResponse.json({ message: 'Purchase deleted' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ message: 'Error deleting purchase' }, { status: 500 });
  }
}
