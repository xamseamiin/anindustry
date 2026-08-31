import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { assertNoOpenRevision } from '@/lib/expense-revisions';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';
import {
  EXPENSE_STATES,
  finalizeExpensePayment,
  makeIdempotencyKey,
  releaseExpenseReservation,
  reserveExpenseFunds,
  transitionExpense
} from '@/lib/financial-workflow';

export const dynamic = 'force-dynamic';

function actorFrom(body: any) {
  const verified = verifyTelegramInitData(body.initData || '');
  if (verified && isTelegramFinancialAdmin(verified)) {
    return { authorized: true, actor: { id: String(verified.id), name: [verified.first_name, verified.last_name].filter(Boolean).join(' '), source: 'MINI_APP' as const } };
  }
  if (process.env.APP_ENV === 'local') {
    return { authorized: true, actor: { id: process.env.TELEGRAM_USER_ID || 'local-admin', name: 'Local Admin', source: 'MINI_APP' as const } };
  }
  return { authorized: false, actor: { source: 'MINI_APP' as const } };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const auth = actorFrom(body);
    if (!auth.authorized) return NextResponse.json({ error: 'Admin permission required.' }, { status: 403 });
    if (!body.expenseId || !body.action) return NextResponse.json({ error: 'expenseId and action are required.' }, { status: 400 });

    if (body.action === 'APPROVE') {
      await reserveExpenseFunds(body.expenseId, auth.actor);
      const expense = await transitionExpense(body.expenseId, EXPENSE_STATES.AWAITING_RECEIPT, auth.actor, { approvedBy: auth.actor.name });
      return NextResponse.json({ success: true, expense });
    }
    if (body.action === 'REJECT' || body.action === 'CANCEL') {
      await releaseExpenseReservation(body.expenseId, auth.actor, body.action === 'REJECT' ? 'REJECTED' : 'CANCELLED');
      const expense = await transitionExpense(body.expenseId, body.action === 'REJECT' ? EXPENSE_STATES.REJECTED : EXPENSE_STATES.CANCELLED, auth.actor);
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
        actor: auth.actor
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
      const updated = await transitionExpense(body.expenseId, EXPENSE_STATES.REFUNDED, auth.actor);
      return NextResponse.json({ success: true, expense: updated });
    }
    return NextResponse.json({ error: 'Unknown workflow action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Workflow action failed.' }, { status: 409 });
  }
}
