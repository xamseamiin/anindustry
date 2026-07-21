// app/api/telegram/expense-actions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper to send request to Telegram Bot API
async function editTelegramBotMessage(token: string, chatId: string, messageId: number, newText: string) {
    try {
        const urlText = `https://api.telegram.org/bot${token}/editMessageText`;
        const resText = await fetch(urlText, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: newText,
                parse_mode: 'HTML'
            })
        });
        const dataText = await resText.json();
        if (dataText.ok) return true;

        // Try editMessageCaption if message was a photo
        const urlCap = `https://api.telegram.org/bot${token}/editMessageCaption`;
        const resCap = await fetch(urlCap, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                caption: newText,
                parse_mode: 'HTML'
            })
        });
        const dataCap = await resCap.json();
        return dataCap.ok;
    } catch (e) {
        console.error('Error editing Telegram bot message:', e);
        return false;
    }
}

// PUT: Edit Expense
export async function PUT(request: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const defaultChatId = process.env.TELEGRAM_CHAT_ID;

        if (!companyId) {
            return NextResponse.json({ error: 'TELEGRAM_COMPANY_ID not configured' }, { status: 400 });
        }

        const body = await request.json();
        const { id, amount, note, categoryId, accountId, receiptUrl } = body;

        if (!id) {
            return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
        }

        const existingExpense = await prisma.expense.findUnique({
            where: { id },
            include: { account: true, expenseCategory: true }
        });

        if (!existingExpense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        const oldAmount = Number(existingExpense.amount);
        const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;
        const diff = newAmount - oldAmount; // positive means increased expense, negative means decreased expense

        // Target account (defaults to E-Birr Merchant or expense.accountId)
        const targetAccountId = accountId || existingExpense.accountId;

        // Update in transaction
        const updatedExpense = await prisma.$transaction(async (tx) => {
            // Adjust balance if target account exists and diff is non-zero
            if (targetAccountId && diff !== 0) {
                await tx.account.update({
                    where: { id: targetAccountId },
                    data: { balance: { decrement: diff } } // subtract diff from balance
                });
            }

            let categoryName = existingExpense.category;
            if (categoryId) {
                const cat = await tx.expenseCategory.findUnique({ where: { id: categoryId } });
                if (cat) categoryName = cat.name;
            }

            return await tx.expense.update({
                where: { id },
                data: {
                    amount: newAmount,
                    note: note !== undefined ? note : existingExpense.note,
                    categoryId: categoryId || existingExpense.categoryId,
                    category: categoryName,
                    accountId: targetAccountId,
                    receiptUrl: receiptUrl !== undefined ? receiptUrl : existingExpense.receiptUrl
                },
                include: { account: true, expenseCategory: true }
            });
        });

        // Calculate live E-Birr Merchant balance for message update
        let liveBalanceText = '';
        try {
            const EBIRR_NAME = 'E-Birr Merchant';
            const eBirrAcc = await prisma.account.findFirst({
                where: { companyId, name: EBIRR_NAME, isActive: true }
            });
            if (eBirrAcc) {
                const pendingAgg = await prisma.expense.aggregate({
                    where: { accountId: eBirrAcc.id, companyId, paymentStatus: { not: 'PAID' } },
                    _sum: { amount: true }
                });
                const pending = Number(pendingAgg._sum?.amount ?? 0);
                const currentLive = Number(eBirrAcc.balance) - pending;
                liveBalanceText = `${currentLive.toLocaleString()} ETB`;
            }
        } catch (_) {}

        // Edit original Telegram message if available
        const targetChatId = existingExpense.telegramChatId || defaultChatId;
        const targetMsgId = existingExpense.telegramMessageId;

        if (token && targetChatId && targetMsgId) {
            const formattedDate = new Date(existingExpense.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
            const cleanNote = (updatedExpense.note || '').replace(/\[(?:Dalbaday|TelegramId|PaymentPhone|RecipientName|Account|AccountId):[^\]]*\]/g, '').trim();

            const updatedTelegramText =
                `<b>AN-Industory</b>\n` +
                `<b>✅ Diiwaangelinta Kharashka (Cusboonaysiin / Updated)</b>\n\n` +
                `📂 Qaybta: ${updatedExpense.category}\n` +
                `💵 Lacagta la bixiyey: ${newAmount.toLocaleString()} ETB\n` +
                `💳 Koontada: ${updatedExpense.account?.name || 'E-Birr Merchant'}\n` +
                `📝 Sharaxaad: ${cleanNote || 'Kharash'}\n` +
                `📅 Taariikhda: ${formattedDate}\n\n` +
                `✏️ <i>(Waxaa lagu sameeyay Edit)</i>` +
                (liveBalanceText ? `\n\n💳 <b>E-Birr Merchant Balance:</b> ${liveBalanceText}\n   (Hadhka saxda ah ka dib dalabkan)` : '');

            await editTelegramBotMessage(token, targetChatId, targetMsgId, updatedTelegramText);
        }

        return NextResponse.json({ success: true, expense: updatedExpense, message: 'Kharashka waa la cusboonaysiiyay!' });
    } catch (error: any) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete Expense & Refund Balance
export async function DELETE(request: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const defaultChatId = process.env.TELEGRAM_CHAT_ID;

        if (!companyId) {
            return NextResponse.json({ error: 'TELEGRAM_COMPANY_ID not configured' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
        }

        const expense = await prisma.expense.findUnique({
            where: { id },
            include: { account: true }
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        const refundAmount = Number(expense.amount);

        // Refund balance and delete expense
        await prisma.$transaction(async (tx) => {
            if (expense.accountId) {
                await tx.account.update({
                    where: { id: expense.accountId },
                    data: { balance: { increment: refundAmount } }
                });
            }

            // Also delete associated transaction if exists
            await tx.transaction.deleteMany({
                where: { expenseId: id }
            });

            await tx.expense.delete({
                where: { id }
            });
        });

        // Edit original Telegram message to show it is cancelled
        const targetChatId = expense.telegramChatId || defaultChatId;
        const targetMsgId = expense.telegramMessageId;

        if (token && targetChatId && targetMsgId) {
            const cancelledText =
                `<b>AN-Industory</b>\n` +
                `<b>⚠️ Kharashkan waa la canceled-gareeyay (Deleted)</b>\n\n` +
                `📂 Qaybta: ${expense.category}\n` +
                `💵 Lacagta la soo celiyay: ${refundAmount.toLocaleString()} ETB\n` +
                `📝 Sharaxaad: ${expense.description || expense.note || ''}\n\n` +
                `🛑 <i>Lacagtii waxaa dib loogu soo celiyay koontada E-Birr Merchant.</i>`;

            await editTelegramBotMessage(token, targetChatId, targetMsgId, cancelledText);
        }

        return NextResponse.json({ success: true, message: 'Kharashka waa la tirtiray, haraagiina waa la soo celiyay!' });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
