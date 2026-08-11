require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const amount = 25000;
const transferId = '802270619502';
const receiptPath = 'C:\\Users\\OMEN\\AppData\\Local\\Temp\\codex-clipboard-fcef85f5-f3c3-499b-8c31-ae7252d07765.png';
const execute = process.argv.includes('--execute');

async function telegram(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, { method: 'POST', body });
  const data = await response.json();
  if (!data.ok) throw new Error(`${method}: ${data.description || 'Telegram request failed'}`);
  return data.result;
}

async function main() {
  const account = await prisma.account.findFirst({
    where: { name: { equals: 'E-Birr Merchant', mode: 'insensitive' } },
    select: { id: true, companyId: true, name: true, balance: true }
  });
  if (!account) throw new Error('E-Birr Merchant account not found.');
  const duplicate = await prisma.transaction.findFirst({
    where: { companyId: account.companyId, OR: [{ note: { contains: transferId } }, { description: { contains: transferId } }] },
    select: { id: true }
  });
  if (duplicate) throw new Error(`Transfer ${transferId} is already recorded as ${duplicate.id}.`);
  if (!fs.existsSync(receiptPath)) throw new Error('Receipt screenshot is missing.');

  const balanceAfter = Number(account.balance) + amount;
  const dateLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  const caption = [
    'AN-Industory',
    '💰 Diiwaangelinta Deposit-ka (Dayn la Helay)',
    '',
    '👤 Laga helay: Abdehakim Abdi Mumin',
    `💵 Lacagta: ${amount.toLocaleString()} ETB`,
    `💳 Koontada: E-Birr Merchant`,
    `🧾 Transfer ID: ${transferId}`,
    '📝 Sharaxaad: Pity Cash',
    `📅 Taariikhda: ${dateLabel}`,
    '',
    `✅ Deposit-kan waxaa lagu daray E-Birr Merchant.`,
    `💼 Haraaga cusub: ${balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`
  ].join('\n');

  if (!execute) {
    console.log(JSON.stringify({ dryRun: true, account: account.name, balanceBefore: account.balance, amount, balanceAfter, transferId, chatConfigured: Boolean(process.env.TELEGRAM_CHAT_ID) }, null, 2));
    return;
  }

  const form = new FormData();
  form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
  form.append('caption', caption);
  form.append('parse_mode', 'HTML');
  form.append('photo', new Blob([fs.readFileSync(receiptPath)], { type: 'image/png' }), `${transferId}.png`);
  const sent = await telegram('sendPhoto', form);
  const rawChatId = String(sent.chat.id);
  const privateGroupId = rawChatId.startsWith('-100') ? rawChatId.slice(4) : rawChatId.replace('-', '');
  const receiptUrl = `https://t.me/c/${privateGroupId}/${sent.message_id}`;

  try {
    const result = await prisma.$transaction(async tx => {
      const fresh = await tx.account.findUnique({ where: { id: account.id }, select: { balance: true } });
      const exists = await tx.transaction.findFirst({ where: { companyId: account.companyId, OR: [{ note: { contains: transferId } }, { description: { contains: transferId } }] }, select: { id: true } });
      if (exists) throw new Error(`Transfer ${transferId} became a duplicate during execution.`);
      const before = Number(fresh.balance);
      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(), companyId: account.companyId, accountId: account.id,
          amount, type: 'DEBT_TAKEN', transactionDate: new Date(),
          description: 'Dayn: Abdehakim Abdi Mumin - Deposit E-Birr Merchant',
          note: `Pity Cash. Transfer ID: ${transferId}. [ReceiptTelegramMessageId: ${sent.message_id}] [TelegramChatId: ${sent.chat.id}]`,
          category: 'Deposit / Dayn la Helay', receiptUrl
        },
        select: { id: true, amount: true, type: true, transactionDate: true }
      });
      const updated = await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } }, select: { balance: true } });
      return { transaction, balanceBefore: before, balanceAfter: updated.balance };
    });
    console.log(JSON.stringify({ success: true, telegramMessageId: sent.message_id, receiptUrl, ...result }, null, 2));
  } catch (error) {
    const cleanup = new FormData(); cleanup.append('chat_id', String(sent.chat.id)); cleanup.append('message_id', String(sent.message_id));
    await telegram('deleteMessage', cleanup).catch(() => undefined);
    throw error;
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
