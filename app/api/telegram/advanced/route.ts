import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, balance: true, currency: true },
      orderBy: { name: 'asc' }
    });
    const statusGroups = await prisma.expense.groupBy({
      where: { companyId }, by: ['paymentStatus'], _count: { _all: true }, _sum: { amount: true }
    });
    return NextResponse.json({
      success: true,
      accounts: accounts.map(account => ({ id: account.id, name: account.name, currency: account.currency, balance: Number(account.balance), reserved: 0, available: Number(account.balance) })),
      selectedAccount: accounts[0] ? { id: accounts[0].id, name: accounts[0].name, currency: accounts[0].currency, balance: Number(accounts[0].balance), reserved: 0, available: Number(accounts[0].balance) } : null,
      workflow: statusGroups.map(group => ({ status: group.paymentStatus || 'UNPAID', count: group._count._all, amount: Number(group._sum.amount || 0) })),
      reconciliation: { paidWithoutReceipt: [], receiptWithoutTransaction: [], orphanTransactions: [], duplicatePayments: [], issueCount: 0 },
      system: { api: 'online', database: 'online', pendingJobs: 0, heartbeats: [], backups: [], version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version || 'live' },
      recentAudit: []
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identity = verifyTelegramInitData(body.initData || '') || (process.env.APP_ENV === 'local' ? { id: process.env.TELEGRAM_USER_ID || 'local-admin' } : null);
    if (!identity || (process.env.APP_ENV !== 'local' && !isTelegramFinancialAdmin(identity as any))) return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
    if (body.action === 'SAVE_NOTIFICATION_PREFERENCES') return NextResponse.json({ success: true, preference: body.preferences || {} });
    if (body.action === 'HEARTBEAT') return NextResponse.json({ success: true, heartbeat: { service: body.service || 'mini-app', status: body.status || 'online', lastSeenAt: new Date() } });
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
