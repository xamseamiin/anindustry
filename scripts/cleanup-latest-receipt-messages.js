const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const expenseId = '344ac7cf-8e17-4232-9351-9cc7ca5fee7d';
const chatId = '-5307882362';
const finalMessageId = 507;

async function telegramRequest(method, body) {
  return fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(response => response.json());
}

async function main() {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { account: true }
  });
  if (!expense) throw new Error('Expense not found.');

  const cleanNote = (expense.note || '')
    .replace(/\[(?:ReceiptTelegramMessageId|TxId|TelegramChatId|TelegramMessageId):\s*[^\]]*\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      note: `${cleanNote}\n[TelegramChatId: ${chatId}] [TelegramMessageId: ${finalMessageId}]`,
      telegramChatId: chatId,
      telegramMessageId: finalMessageId
    }
  });

  const caption = `<b>AN-Industory</b>\n` +
    `<b>✅ Diiwaangelinta Kharashka (Waa la Bixiyey)</b>\n\n` +
    `🗣 <b>Soo Dalbay:</b> Muxiyadin Maxamed Sh Abdi\n` +
    `📂 Qaybta: Transport & Fuel\n` +
    `💵 Lacagta la bixiyey: 400 ETB\n` +
    `🚗 Nooca Gadiidka: Kiro\n` +
    `👤 Loo dirayo: Mustaf\n` +
    `📱 Lambarka: 0953575708\n` +
    `💳 Koontada: E-Birr Merchant (Haraa: ${Number(expense.account.balance).toLocaleString()} ETB)\n` +
    `📝 Sharaxaad: Maxamuud badiic loo qaaday caagado 300 xabo\n` +
    `🧾 Transaction ID: 2606027459\n\n` +
    `✅ Lacagtaas waa la diray.`;

  const captionResult = await telegramRequest('editMessageCaption', {
    chat_id: chatId,
    message_id: finalMessageId,
    caption,
    parse_mode: 'HTML'
  });

  const deleted = [];
  for (const messageId of [498, 499, 502, 503, 504, 505, 506]) {
    const result = await telegramRequest('deleteMessage', { chat_id: chatId, message_id: messageId });
    if (result.ok || String(result.description || '').includes('message to delete not found')) {
      deleted.push(messageId);
    }
  }

  console.log(JSON.stringify({ finalMessageId, captionUpdated: captionResult.ok, deleted }, null, 2));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
