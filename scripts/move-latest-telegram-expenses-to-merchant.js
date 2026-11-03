const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const companyId = process.env.TELEGRAM_COMPANY_ID || 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const apply = process.argv.includes('--apply');
const safe = value => JSON.stringify(value, (_key, item) => item && typeof item.toNumber === 'function' ? item.toNumber() : item, 2);

function todayStart() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = type => Number(parts.find(part => part.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day'), -3));
}

async function editTelegram(expense, merchantName) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !expense.telegramChatId || !expense.telegramMessageId) return { status: 'skipped', reason: 'Telegram credentials/message ID unavailable' };
  const oldText = String(expense.note || '').replace(/e-?birr(?!\s*merchant)/ig, merchantName);
  const text = oldText.includes(merchantName) ? oldText : `${oldText}\n\nAccount: ${merchantName}`;
  const payload = { chat_id: expense.telegramChatId, message_id: Number(expense.telegramMessageId), text, parse_mode: 'HTML' };
  const response = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (result.ok) return { status: 'edited' };
  const caption = await fetch(`https://api.telegram.org/bot${token}/editMessageCaption`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, caption: text }) });
  const captionResult = await caption.json();
  return captionResult.ok ? { status: 'edited-caption' } : { status: 'failed', reason: result.description || captionResult.description };
}

async function main() {
  const merchant = await prisma.account.findFirst({ where: { companyId, name: { equals: 'E-Birr Merchant', mode: 'insensitive' } }, select: { id: true, name: true, balance: true } });
  if (!merchant) throw new Error('E-Birr Merchant account lama helin.');
  const start = todayStart();
  const rows = await prisma.expense.findMany({ where: { companyId, createdAt: { gte: start }, OR: [{ telegramMessageId: { not: null } }, { telegramChatId: { not: null } }, { note: { contains: '[Telegram' } }, { note: { contains: '[Dalbaday:' } }] }, include: { account: { select: { id: true, name: true, balance: true } }, transactions: true }, orderBy: { createdAt: 'desc' }, take: 2 });
  if (rows.length !== 2) throw new Error(`Waxaa la helay ${rows.length} kharash oo maanta Telegram ah; labada record si ammaan ah looma xaqiijin.`);
  if (rows.some(row => row.accountId === merchant.id)) throw new Error('Mid ka mid ah labada record hore ayuu ugu jiraa E-Birr Merchant; waxba lama beddelin.');
  const snapshot = { exportedAt: new Date().toISOString(), companyId, merchant, rows };
  const backupDir = path.join(process.cwd(), 'backups'); fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `latest-telegram-expenses-before-merchant-${Date.now()}.json`); fs.writeFileSync(backupPath, safe(snapshot));
  const transferAmounts = rows.flatMap(row => row.transactions.filter(tx => tx.accountId === row.accountId && ['EXPENSE', 'DEBT_GIVEN', 'DEBT_REPAID', 'TRANSFER_OUT', 'SALARY'].includes(tx.type)).map(tx => Math.abs(Number(tx.amount || 0))));
  const total = transferAmounts.reduce((sum, amount) => sum + amount, 0);
  console.log(safe({ apply, selected: rows.map(row => ({ id: row.id, createdAt: row.createdAt, amount: row.amount, account: row.account?.name, messageId: row.telegramMessageId })), totalToMove: total, merchant: merchant.name, backupPath }));
  if (!apply) return;
  await prisma.$transaction(async tx => {
    for (const row of rows) {
      const amount = row.transactions.filter(entry => entry.accountId === row.accountId && ['EXPENSE', 'DEBT_GIVEN', 'DEBT_REPAID', 'TRANSFER_OUT', 'SALARY'].includes(entry.type)).reduce((sum, entry) => sum + Math.abs(Number(entry.amount || 0)), 0);
      if (amount && row.accountId) await tx.account.update({ where: { id: row.accountId }, data: { balance: { increment: amount } } });
      if (amount) await tx.account.update({ where: { id: merchant.id }, data: { balance: { decrement: amount } } });
      await tx.expense.update({ where: { id: row.id }, data: { accountId: merchant.id } });
      await tx.transaction.updateMany({ where: { expenseId: row.id }, data: { accountId: merchant.id } });
    }
  });
  const telegram = [];
  for (const row of rows) telegram.push({ id: row.id, ...(await editTelegram(row, merchant.name)) });
  console.log(safe({ success: true, moved: rows.length, total, telegram, backupPath }));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
