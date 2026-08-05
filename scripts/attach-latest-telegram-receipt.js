const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const expenseId = '344ac7cf-8e17-4232-9351-9cc7ca5fee7d';
const receiptMessageId = 499;
const receiptTransactionId = '2606027459';

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new Error('Expense not found.');
    if (Number(expense.amount) !== 400) throw new Error('Expense amount no longer matches the verified 400 ETB receipt.');

    const chatId = expense.telegramChatId || process.env.TELEGRAM_CHAT_ID || '-1005307882362';
    const internalChatId = String(chatId).replace(/^-100/, '').replace(/^-/, '');
    const receiptUrl = `https://t.me/c/${internalChatId}/${receiptMessageId}`;
    const existingPayment = await tx.transaction.findFirst({
      where: { expenseId, type: 'EXPENSE' }
    });

    const cleanedNote = (expense.note || '')
      .replace(/\[ReceiptTelegramMessageId:\s*[^\]]*\]/g, '')
      .replace(/\[TxId:\s*[^\]]*\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const receiptNote = `${cleanedNote}\n[ReceiptTelegramMessageId: ${receiptMessageId}] [TxId: ${receiptTransactionId}]`.trim();

    await tx.expense.update({
      where: { id: expenseId },
      data: {
        receiptUrl,
        note: receiptNote,
        approved: true,
        paymentStatus: 'PAID',
        paymentDate: new Date('2026-08-04T11:40:17.000Z')
      }
    });

    if (existingPayment) {
      await tx.transaction.update({
        where: { id: existingPayment.id },
        data: { receiptUrl, note: `Telegram receipt transaction ${receiptTransactionId}` }
      });
    } else {
      await tx.transaction.create({
        data: {
          companyId: expense.companyId,
          userId: expense.userId,
          description: expense.description,
          amount: Number(expense.amount),
          type: 'EXPENSE',
          accountId: expense.accountId,
          expenseId: expense.id,
          employeeId: expense.employeeId,
          receiptUrl,
          note: `Telegram receipt transaction ${receiptTransactionId}`,
          transactionDate: new Date('2026-08-04T11:40:17.000Z')
        }
      });

      if (expense.accountId) {
        await tx.account.update({
          where: { id: expense.accountId },
          data: { balance: { decrement: Number(expense.amount) } }
        });
      }
    }

    const account = expense.accountId
      ? await tx.account.findUnique({ where: { id: expense.accountId } })
      : null;

    return { receiptUrl, balance: account ? Number(account.balance) : null, alreadyHadPayment: !!existingPayment };
  });

  const telegramText = `<b>AN-Industory</b>\n` +
    `<b>📋 Kharashka (Rasiidka Dib Loogu Lifaaqayo)</b>\n\n` +
    `📂 Qaybta: Transport & Fuel\n` +
    `💵 Lacagta la bixiyay: 400 ETB\n` +
    `👤 Loo diray: Mustaf\n` +
    `📱 Lambarka: 0953575708\n` +
    `💳 E-Birr Merchant (Haraa: ${Number(result.balance).toLocaleString()} ETB)\n` +
    `📝 Sharaxaad: Maxamuud badiic loo qaaday caagado 300 xabo\n\n` +
    `⏳ Guji badhanka hoose, kadibna soo dir sawirka rasiidka si SMS-ka iyo rasiidku hal fariin u noqdaan.`;

  let telegramUpdated = false;
  for (const chatId of [process.env.TELEGRAM_CHAT_ID, '-1005307882362', '-5307882362'].filter(Boolean)) {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: 498,
        text: telegramText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '➕ Gali Rasiidka (Upload Receipt)', callback_data: `rcpt_${expenseId}` }]] }
      })
    });
    const telegramResult = await response.json();
    if (telegramResult.ok || String(telegramResult.description || '').includes('message is not modified')) {
      telegramUpdated = true;
      break;
    }
  }

  console.log(JSON.stringify({ ...result, telegramUpdated }, null, 2));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
