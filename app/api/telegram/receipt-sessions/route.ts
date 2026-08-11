import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { makeIdempotencyKey } from '@/lib/financial-workflow';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const telegramUserId = url.searchParams.get('telegramUserId');
  const telegramChatId = url.searchParams.get('telegramChatId');
  if (!telegramUserId || !telegramChatId) return NextResponse.json({ error: 'Telegram user/chat are required.' }, { status: 400 });
  await prisma.receiptSession.updateMany({
    where: { telegramUserId, telegramChatId, status: 'AWAITING_UPLOAD', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' }
  });
  const sessions = await prisma.receiptSession.findMany({
    where: { telegramUserId, telegramChatId, status: 'AWAITING_UPLOAD', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ success: true, sessions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = process.env.TELEGRAM_COMPANY_ID || body.companyId;
    if (!companyId || !body.telegramUserId || !body.telegramChatId) {
      return NextResponse.json({ error: 'Required session metadata is missing.' }, { status: 400 });
    }
    if (!body.expenseId && !body.materialPurchaseId) return NextResponse.json({ error: 'A target record is required.' }, { status: 400 });

    if (body.expenseId) {
      const expense = await prisma.expense.findUnique({ where: { id: body.expenseId }, include: { account: true } });
      if (!expense || !expense.account) return NextResponse.json({ error: 'Expense/account not found.' }, { status: 404 });
      const available = Number(expense.account.balance) - Number(expense.account.reservedBalance);
      if (Number(expense.amount) > available + Number(expense.reservedAmount)) {
        await prisma.expense.update({ where: { id: expense.id }, data: { workflowStatus: 'INSUFFICIENT_FUNDS' } });
        return NextResponse.json({
          error: 'INSUFFICIENT_FUNDS',
          balance: Number(expense.account.balance),
          reserved: Number(expense.account.reservedBalance),
          available,
          requested: Number(expense.amount),
          shortfall: Number(expense.amount) - available
        }, { status: 409 });
      }
    }

    const key = makeIdempotencyKey('receipt-session', [body.expenseId, body.materialPurchaseId, body.telegramChatId, body.telegramUserId]);
    await prisma.receiptSession.updateMany({
      where: { telegramChatId: String(body.telegramChatId), telegramUserId: String(body.telegramUserId), status: 'AWAITING_UPLOAD' },
      data: { status: 'CANCELLED', completedAt: new Date() }
    });
    const session = await prisma.receiptSession.upsert({
      where: { idempotencyKey: key },
      create: {
        companyId,
        expenseId: body.expenseId || null,
        materialPurchaseId: body.materialPurchaseId || null,
        telegramUserId: String(body.telegramUserId),
        telegramChatId: String(body.telegramChatId),
        telegramMessageId: body.telegramMessageId || null,
        idempotencyKey: key,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      },
      update: {
        status: 'AWAITING_UPLOAD',
        telegramMessageId: body.telegramMessageId || null,
        receiptFileId: null,
        completedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      }
    });
    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const session = await prisma.receiptSession.findUnique({ where: { id: body.id } });
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    if (session.expiresAt < new Date() && body.status === 'COMPLETED') return NextResponse.json({ error: 'Session expired.' }, { status: 410 });
    const updated = await prisma.receiptSession.update({
      where: { id: session.id },
      data: {
        status: body.status || 'COMPLETED',
        receiptFileId: body.receiptFileId || session.receiptFileId,
        completedAt: ['COMPLETED', 'CANCELLED'].includes(body.status) ? new Date() : null
      }
    });
    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
