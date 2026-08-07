import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

const inflowTypes = new Set(['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'DEBT_TAKEN', 'SHAREHOLDER_DEPOSIT']);
const outflowTypes = new Set(['EXPENSE', 'TRANSFER_OUT', 'DEBT_GIVEN', 'SALARY']);

function periodBounds(type: string, start?: string | null, end?: string | null) {
  const now = new Date();
  let from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let to = new Date(from); to.setHours(23, 59, 59, 999);
  if (type === 'WEEKLY') { from.setDate(from.getDate() - 6); }
  if (type === 'MONTHLY') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
  if (type === 'CUSTOM') {
    if (start) from = new Date(`${start}T00:00:00`);
    if (end) to = new Date(`${end}T23:59:59.999`);
  }
  return { from, to };
}

function safeNumber(value: unknown) { return Number(value || 0); }

async function buildReport(request: Request, body?: any) {
  const url = new URL(request.url);
  const input = body || Object.fromEntries(url.searchParams.entries());
  const companyId = process.env.TELEGRAM_COMPANY_ID || '';
  if (!companyId) throw new Error('Company is not configured.');
  const identity = verifyTelegramInitData(input.initData || '');
  const isLocal = process.env.APP_ENV === 'local';
  const isAdmin = isLocal || (!!identity && isTelegramFinancialAdmin(identity));
  const reportType = String(input.reportType || 'MONTHLY').toUpperCase();
  const { from, to } = periodBounds(reportType, input.startDate, input.endDate);

  const accounts = await prisma.account.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, balance: true, currency: true }, orderBy: { name: 'asc' } });
  const selectedAccounts = input.accountId ? accounts.filter(a => a.id === input.accountId) : accounts;
  const accountIds = selectedAccounts.map(a => a.id);
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      transactionDate: { gte: from, lte: to },
      AND: [
        { OR: [{ accountId: { in: accountIds } }, { fromAccountId: { in: accountIds } }, { toAccountId: { in: accountIds } }] },
        ...(isAdmin ? [] : identity ? [{ OR: [{ userId: String(identity.id) }, { expense: { note: { contains: `[TelegramId: ${identity.id}]` } } }] }] : [{ id: '__unauthorized__' }])
      ]
    },
    select: {
      id: true, transactionDate: true, description: true, amount: true, type: true, category: true,
      accountId: true, fromAccountId: true, toAccountId: true, receiptUrl: true, userId: true,
      account: { select: { name: true } }, fromAccount: { select: { name: true } }, toAccount: { select: { name: true } },
      expense: { select: { category: true, subCategory: true, amount: true, description: true, note: true, createdAt: true, paymentDate: true, paymentStatus: true, receiptUrl: true, transportType: true, equipmentName: true, rentalPeriod: true, consultantName: true, consultancyType: true, employee: { select: { fullName: true, phone: true } } } }
    },
    orderBy: { transactionDate: 'asc' }
  });

  const filtered = transactions.filter(tx => {
    if (input.category && input.category !== 'ALL' && (tx.expense?.category || tx.category) !== input.category) return false;
    if (input.status && input.status !== 'ALL' && (tx.expense?.workflowStatus || tx.expense?.paymentStatus || 'PAID') !== input.status) return false;
    return true;
  });

  const signedAmount = (tx: any) => {
    const amount = Math.abs(safeNumber(tx.amount));
    if (inflowTypes.has(tx.type) || (tx.toAccountId && accountIds.includes(tx.toAccountId))) return amount;
    if (outflowTypes.has(tx.type) || (tx.fromAccountId && accountIds.includes(tx.fromAccountId))) return -amount;
    return 0;
  };
  const periodNet = filtered.reduce((sum, tx) => sum + signedAmount(tx), 0);
  const closingBalance = selectedAccounts.reduce((sum, a) => sum + safeNumber(a.balance), 0);
  const openingBalance = closingBalance - periodNet;
  let runningBalance = openingBalance;
  const ledger = filtered.map(tx => {
    const signed = signedAmount(tx);
    runningBalance += signed;
    const expense = tx.expense;
    return {
      id: tx.id,
      date: tx.transactionDate,
      description: tx.description,
      category: expense?.category || tx.category || (signed >= 0 ? 'Deposit' : 'General'),
      account: signed >= 0
        ? (tx.toAccount?.name || tx.account?.name || tx.fromAccount?.name || '')
        : (tx.fromAccount?.name || tx.account?.name || tx.toAccount?.name || ''),
      inflow: signed > 0 ? signed : 0,
      outflow: signed < 0 ? Math.abs(signed) : 0,
      balance: runningBalance,
      status: expense?.paymentStatus || 'PAID',
      receiptUrl: tx.receiptUrl || expense?.receiptUrl || null,
      receiptTransactionId: null,
      requester: expense?.note?.match(/\[Dalbaday:\s*([^\]]+)\]/)?.[1] || '',
      paymentPhone: expense?.note?.match(/\[PaymentPhone:\s*([^\]]+)\]/)?.[1] || expense?.employee?.phone || '',
      recipient: expense?.note?.match(/\[RecipientName:\s*([^\]]+)\]/)?.[1] || expense?.employee?.fullName || '',
      expenseForm: expense ? {
        category: expense.category,
        subCategory: expense.subCategory,
        amount: safeNumber(expense.amount),
        account: tx.account?.name || tx.fromAccount?.name || '',
        description: expense.description,
        note: String(expense.note || '').replace(/\[[^\]]+\]/g, '').trim(),
        requestDate: expense.createdAt,
        paymentDate: expense.paymentDate,
        workflowStatus: expense.paymentStatus,
        transportType: expense.transportType,
        equipmentName: expense.equipmentName,
        rentalPeriod: expense.rentalPeriod,
        consultantName: expense.consultantName,
        consultancyType: expense.consultancyType,
        employee: expense.employee?.fullName || null
      } : null
    };
  });
  const totalIn = ledger.reduce((sum, row) => sum + row.inflow, 0);
  const totalOut = ledger.reduce((sum, row) => sum + row.outflow, 0);
  const reserved = 0;
  const categories = Object.values(ledger.reduce((map: any, row) => {
    if (!map[row.category]) map[row.category] = { category: row.category, amount: 0, count: 0 };
    map[row.category].amount += row.outflow;
    map[row.category].count += 1;
    return map;
  }, {}));
  const receiptStats = {
    total: ledger.filter(r => r.outflow > 0).length,
    attached: ledger.filter(r => r.outflow > 0 && r.receiptUrl).length,
    missing: ledger.filter(r => r.outflow > 0 && !r.receiptUrl).length
  };
  const summary = { openingBalance, totalIn, totalOut, netCashFlow: totalIn - totalOut, closingBalance, reserved, available: closingBalance - reserved, transactionCount: ledger.length, receiptStats };
  return {
    reportType, period: { start: from, end: to }, accounts: selectedAccounts.map(a => ({ id: a.id, name: a.name, currency: a.currency })),
    summary, categories, ledger, generatedAt: new Date(), generatedBy: identity ? [identity.first_name, identity.last_name].filter(Boolean).join(' ') : 'Local Admin', isAdmin,
    filters: { accountId: input.accountId || 'ALL', category: input.category || 'ALL', status: input.status || 'ALL', includeReceipts: input.includeReceipts !== false && input.includeReceipts !== 'false', includeExpenseForms: input.includeExpenseForms !== false && input.includeExpenseForms !== 'false', language: input.language || 'so', orientation: input.orientation || 'portrait' }
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const verifyHash = url.searchParams.get('verify');
    if (verifyHash) {
      const report = await prisma.generatedFinancialReport.findUnique({ where: { reportHash: verifyHash } });
      return NextResponse.json({ success: !!report, verified: !!report, report });
    }
    return NextResponse.json({ success: true, report: await buildReport(request) });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = await buildReport(request, body);
    if (!report.isAdmin && !body.allowPersonal) return NextResponse.json({ error: 'Full-company report requires admin access.' }, { status: 403 });
    const canonical = JSON.stringify({ period: report.period, summary: report.summary, filters: report.filters, ledger: report.ledger.map(r => [r.id, r.inflow, r.outflow, r.balance]) });
    const reportHash = crypto.createHash('sha256').update(canonical).digest('hex');
    const reportNumber = `AN-${report.reportType.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
    try {
      const saved = await prisma.generatedFinancialReport.create({ data: {
        companyId: process.env.TELEGRAM_COMPANY_ID || '', reportNumber, reportType: report.reportType,
        periodStart: new Date(report.period.start), periodEnd: new Date(report.period.end), accountId: body.accountId || null,
        generatedBy: body.telegramUserId || null, generatedName: report.generatedBy, filters: report.filters, summary: report.summary, reportHash
      }});
      await prisma.financialAuditEvent.create({ data: { companyId: process.env.TELEGRAM_COMPANY_ID || '', actorId: body.telegramUserId || null, actorName: report.generatedBy, actorSource: 'MINI_APP', action: 'REPORT_GENERATED', entity: 'GeneratedFinancialReport', entityId: saved.id, after: { reportNumber, reportHash } } });
    } catch (auditError) {
      console.warn('Report audit persistence is unavailable; PDF generation will continue.', auditError);
    }
    return NextResponse.json({ success: true, report: { ...report, reportNumber, reportHash, verificationUrl: `/api/telegram/reports?verify=${reportHash}` } });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
