import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTelegramPermission, resolveTelegramAccess } from '@/lib/telegram-access';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const initData = url.searchParams.get('initData') || request.headers.get('x-telegram-init-data') || '';
    const access = await resolveTelegramAccess(initData);
    if (!access || !access.permissions.isActive || (!access.permissions.viewDashboard && !access.permissions.viewReports)) {
      return NextResponse.json({ error: 'Xogtan fasax uma lihid.' }, { status: 403 });
    }
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, balance: true, reservedBalance: true, currency: true },
      orderBy: { name: 'asc' }
    });
    const statusGroups = await prisma.expense.groupBy({
      where: { companyId }, by: ['paymentStatus'], _count: { _all: true }, _sum: { amount: true }
    });
    return NextResponse.json({
      success: true,
      accounts: accounts.map(account => ({ id: account.id, name: account.name, currency: account.currency, balance: Number(account.balance), reserved: Number(account.reservedBalance || 0), available: Number(account.balance) - Number(account.reservedBalance || 0) })),
      selectedAccount: accounts[0] ? { id: accounts[0].id, name: accounts[0].name, currency: accounts[0].currency, balance: Number(accounts[0].balance), reserved: Number(accounts[0].reservedBalance || 0), available: Number(accounts[0].balance) - Number(accounts[0].reservedBalance || 0) } : null,
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
    const access = await requireTelegramPermission(body.initData || '', 'viewProfile');
    if (!access) return NextResponse.json({ error: 'Profile-ka fasax uma lihid.' }, { status: 403 });
    if (body.action === 'SAVE_NOTIFICATION_PREFERENCES') return NextResponse.json({ success: true, preference: body.preferences || {} });
    if (body.action === 'HEARTBEAT') return NextResponse.json({ success: true, heartbeat: { service: body.service || 'mini-app', status: body.status || 'online', lastSeenAt: new Date() } });
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
