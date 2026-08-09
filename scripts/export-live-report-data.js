const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const inflows = new Set(['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'DEBT_TAKEN', 'SHAREHOLDER_DEPOSIT']);
const outflows = new Set(['EXPENSE', 'TRANSFER_OUT', 'DEBT_GIVEN', 'SALARY']);
const n = value => Number(value || 0);

async function main() {
  const companyId = process.env.TELEGRAM_COMPANY_ID;
  if (!companyId) throw new Error('TELEGRAM_COMPANY_ID is missing.');
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const accounts = await prisma.account.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, balance: true }, orderBy: { name: 'asc' } });
  const accountIds = accounts.map(account => account.id);
  const transactions = await prisma.transaction.findMany({
    where: { companyId, transactionDate: { gte: from, lte: to }, OR: [{ accountId: { in: accountIds } }, { fromAccountId: { in: accountIds } }, { toAccountId: { in: accountIds } }] },
    select: {
      transactionDate: true, description: true, amount: true, type: true, category: true, accountId: true, fromAccountId: true, toAccountId: true,
      account: { select: { name: true } }, fromAccount: { select: { name: true } }, toAccount: { select: { name: true } },
      expense: { select: { category: true, description: true, note: true, employee: { select: { fullName: true } }, vendor: { select: { name: true } } } }
    },
    orderBy: { transactionDate: 'asc' }
  });
  const signed = tx => {
    const amount = Math.abs(n(tx.amount));
    if (inflows.has(tx.type) || (tx.toAccountId && accountIds.includes(tx.toAccountId))) return amount;
    if (outflows.has(tx.type) || (tx.fromAccountId && accountIds.includes(tx.fromAccountId))) return -amount;
    return 0;
  };
  const net = transactions.reduce((sum, tx) => sum + signed(tx), 0);
  const closingBalance = accounts.reduce((sum, account) => sum + n(account.balance), 0);
  let running = closingBalance - net;
  const ledger = transactions.map(tx => {
    const amount = signed(tx); running += amount;
    const expense = tx.expense;
    const cleanDescription = String(expense?.note || '').replace(/\[[^\]]+\]/g, '').trim();
    const recipientName = expense?.note?.match(/\[RecipientName:\s*([^\]]+)\]/)?.[1] || '';
    return {
      date: tx.transactionDate,
      category: expense?.category || tx.category || (amount >= 0 ? 'Deposit' : 'General'),
      person: expense?.employee?.fullName || expense?.vendor?.name || recipientName || '-',
      description: cleanDescription || tx.description || expense?.description || '-',
      account: amount >= 0 ? (tx.toAccount?.name || tx.account?.name || '-') : (tx.fromAccount?.name || tx.account?.name || '-'),
      inflow: amount > 0 ? amount : 0,
      outflow: amount < 0 ? Math.abs(amount) : 0,
      balance: running
    };
  });
  const data = {
    generatedAt: new Date(), period: { from, to }, accounts: accounts.map(a => ({ name: a.name, balance: n(a.balance) })),
    summary: { totalIn: ledger.reduce((s,r)=>s+r.inflow,0), totalOut: ledger.reduce((s,r)=>s+r.outflow,0), closingBalance }, ledger
  };
  const output = path.join(__dirname, '..', 'tmp', 'live-financial-data.json');
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ output, transactions: ledger.length, ...data.summary }));
}

main().finally(() => prisma.$disconnect());
