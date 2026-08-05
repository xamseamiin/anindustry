const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const prisma = new PrismaClient();
const companyId = process.env.TELEGRAM_COMPANY_ID;
const chatId = process.env.TELEGRAM_CHAT_ID || '-5307882362';
const accountId = 'e2124894-d151-432d-90c4-9e5025b71fb9';
const categoryId = '49007655-416d-49e4-822d-f5afa755fc36';

const requests = [
  { marker: 'RESTORED-2200-20260803-192515', date: new Date('2026-08-03T16:25:15.000Z'), transportType: 'Kiro', recipientName: 'Kacaan', phone: '+251915262421', description: 'Craxmaan jibrigaa loo geeyay cagado' },
  { marker: 'RESTORED-2200-20260804-091420', date: new Date('2026-08-04T06:14:20.000Z'), transportType: 'Kiro xaabside', recipientName: 'Kacaa ka', phone: '+251915262421', description: 'Mukhtaar loo qaaday cagado iyo Yusuf Keelaa' }
];

async function telegramRequest(method, body) {
  return fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(response => response.json());
}

async function main() {
  const source = await prisma.expense.findFirst({ where: { companyId, userId: { not: null } }, select: { userId: true } });
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!source?.userId || !account || account.companyId !== companyId) throw new Error('Company user/account mismatch.');

  const restored = [];
  for (const request of requests) {
    let expense = await prisma.expense.findFirst({ where: { companyId, note: { contains: `[RestoredRequest: ${request.marker}]` } } });
    if (!expense) {
      expense = await prisma.expense.create({
        data: {
          companyId, userId: source.userId,
          description: `Transport & Fuel (${request.transportType}): ${request.description}`,
          amount: 2200, category: 'Transport & Fuel', categoryId, accountId, paidFrom: account.name,
          expenseDate: request.date, createdAt: request.date, transportType: request.transportType,
          approved: false, paymentStatus: 'UNPAID', receiptUrl: null,
          note: `${request.description}\n[Dalbaday: Muxiyadin Maxamed Sh Abdi] [TelegramId: 5210687519]\n[PaymentPhone: ${request.phone}]\n[RecipientName: ${request.recipientName}]\n[Account: ${account.name}] [AccountId: ${accountId}]\n[RestoredRequest: ${request.marker}]`
        }
      });
    }

    if (!expense.telegramMessageId) {
      const displayedDate = request.date.toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
      const text = `<b>AN-Industory</b>\n<b>📋 Codsiga Kharashka (Sugaya Rasiidka)</b>\n\n` +
        `🗣 <b>Soo Dalbay:</b> Muxiyadin Maxamed Sh Abdi\n📂 Qaybta: Transport & Fuel\n💵 Lacagta la dalbay: 2,200 ETB\n` +
        `🚗 Nooca Gadiidka: ${request.transportType}\n👤 Loo dirayo: ${request.recipientName}\n📱 Lambarka: ${request.phone}\n` +
        `💳 Koontada: ${account.name} (Haraa: ${Number(account.balance).toLocaleString()} ETB)\n📝 Sharaxaad: ${request.description}\n` +
        `📅 Taariikhda: ${displayedDate}\n\n⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
      const sent = await telegramRequest('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '➕ Gali Rasiidka (Upload Receipt)', callback_data: `rcpt_${expense.id}` }]] } });
      if (!sent.ok) throw new Error(`Telegram send failed: ${sent.description}`);
      expense = await prisma.expense.update({
        where: { id: expense.id },
        data: { telegramChatId: String(chatId), telegramMessageId: sent.result.message_id, note: `${expense.note}\n[TelegramChatId: ${chatId}] [TelegramMessageId: ${sent.result.message_id}]` }
      });
    }
    restored.push({ id: expense.id, date: expense.expenseDate, telegramMessageId: expense.telegramMessageId });
  }
  console.log(JSON.stringify({ balanceUnchanged: Number(account.balance), restored }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
