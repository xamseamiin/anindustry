import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { assertNoOpenRevision } from '@/lib/expense-revisions';
import { requireTelegramPermission } from '@/lib/telegram-access';
import {
  EXPENSE_STATES,
  finalizeExpensePayment,
  makeIdempotencyKey,
  releaseExpenseReservation,
  reserveExpenseFunds,
  transitionExpense
} from '@/lib/financial-workflow';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireTelegramPermission(body.initData || '', 'manageExpenses');
    if (!access) return NextResponse.json({ error: 'Kharash maamulka fasax uma lihid.' }, { status: 403 });
    const verified = access.identity;
    const actor = { id: String(verified.id), name: [verified.first_name, verified.last_name].filter(Boolean).join(' ') || verified.username || String(verified.id), source: 'MINI_APP' as const };
    if (!body.expenseId || !body.action) return NextResponse.json({ error: 'expenseId and action are required.' }, { status: 400 });

    if (body.action === 'APPROVE') {
      await reserveExpenseFunds(body.expenseId, actor);
      const expense = await transitionExpense(body.expenseId, EXPENSE_STATES.AWAITING_RECEIPT, actor, { approvedBy: actor.name });
      return NextResponse.json({ success: true, expense });
    }
    if (body.action === 'REJECT' || body.action === 'CANCEL') {
      await releaseExpenseReservation(body.expenseId, actor, body.action === 'REJECT' ? 'REJECTED' : 'CANCELLED');
      const expense = await transitionExpense(body.expenseId, body.action === 'REJECT' ? EXPENSE_STATES.REJECTED : EXPENSE_STATES.CANCELLED, actor);
      return NextResponse.json({ success: true, expense });
    }
    if (body.action === 'PAY') {
      if (!body.receiptUrl) return NextResponse.json({ error: 'Receipt is required before payment.' }, { status: 400 });
      const key = body.idempotencyKey || makeIdempotencyKey('expense-payment', [body.expenseId, body.receiptTransactionId, body.receiptUrl]);
      const result = await finalizeExpensePayment({
        expenseId: body.expenseId,
        receiptUrl: body.receiptUrl,
        receiptTransactionId: body.receiptTransactionId,
        idempotencyKey: key,
        actor
      });
      return NextResponse.json({ success: true, result });
    }
    if (body.action === 'REFUND') {
      const expense = await prisma.expense.findUnique({ where: { id: body.expenseId }, include: { transactions: true } });
      if (!expense || expense.workflowStatus !== EXPENSE_STATES.PAID) return NextResponse.json({ error: 'Only a paid expense can be refunded.' }, { status: 409 });
      await prisma.$transaction(async tx => {
        await assertNoOpenRevision(tx, body.expenseId);
        const payments = expense.transactions.filter(t => t.type === 'EXPENSE' && !t.reversedAt);
        for (const payment of payments) {
          if (payment.accountId) await tx.account.update({ where: { id: payment.accountId }, data: { balance: { increment: Number(payment.amount) } } });
          await tx.transaction.update({ where: { id: payment.id }, data: { reversedAt: new Date() } });
        }
      });
      const updated = await transitionExpense(body.expenseId, EXPENSE_STATES.REFUNDED, actor);
      return NextResponse.json({ success: true, expense: updated });
    }
    return NextResponse.json({ error: 'Unknown workflow action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Workflow action failed.' }, { status: 409 });
  }
}
