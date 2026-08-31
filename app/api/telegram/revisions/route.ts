import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyTelegramInitData } from '@/lib/telegram-admin';
import service from '@/lib/expense-revisions';
import { syncExpenseRevision } from '@/lib/expense-revision-telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identity = verifyTelegramInitData(body.initData || '');
    if (!identity) return NextResponse.json({ error: 'Telegram sign-in required.' }, { status: 403 });
    const r = await prisma.expenseRevision.findFirst({ where: { id: body.id, companyId: process.env.TELEGRAM_COMPANY_ID } });
    if (!r || (!service.ADMIN_IDS.has(String(identity.id)) && r.actorId !== String(identity.id))) return NextResponse.json({error:'Not authorized.'},{status:403});
    if (body.action !== 'RETRY_SYNC') return NextResponse.json({error:'Unknown action.'},{status:400});
    const sync = await syncExpenseRevision(prisma, r.id);
    return NextResponse.json({ success: sync.status === 'SYNCED', telegramSync: sync.status });
  } catch {
    return NextResponse.json({ error: 'Sync could not be completed; the edit is still saved.' }, { status: 503 });
  }
}
