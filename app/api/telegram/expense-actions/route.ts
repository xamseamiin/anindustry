// app/api/telegram/expense-actions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper to send request to Telegram Bot API
async function editTelegramBotMessage(token: string, chatId: string, messageId: number, newText: string, replyMarkup?: any) {
    try {
        const urlText = `https://api.telegram.org/bot${token}/editMessageText`;
        const resText = await fetch(urlText, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: newText,
                parse_mode: 'HTML',
                reply_markup: replyMarkup
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
                parse_mode: 'HTML',
                reply_markup: replyMarkup
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
        const { id, amount, note, paymentPhone, recipientName, categoryId, accountId, receiptUrl } = body;

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
        const diff = newAmount - oldAmount;

        const targetAccountId = accountId || existingExpense.accountId;

        // Reconstruct note with preserved tags
        const existingNote = existingExpense.note || '';
        const reqMatch = existingNote.match(/\[Dalbaday:[^\]]+\]/);
        const idMatch = existingNote.match(/\[TelegramId:[^\]]+\]/);

        let finalNote = (note !== undefined ? note : existingNote.replace(/\[(?:Dalbaday|TelegramId|PaymentPhone|RecipientName|Account|AccountId):[^\]]*\]/g, '')).trim();
        if (reqMatch) finalNote += `\n${reqMatch[0]}`;
        if (idMatch) finalNote += ` ${idMatch[0]}`;
        if (paymentPhone) finalNote += `\n[PaymentPhone: ${paymentPhone}]`;
        if (recipientName) finalNote += `\n[RecipientName: ${recipientName}]`;

        const wasPaid = existingExpense.approved || existingExpense.paymentStatus === 'PAID' || !!existingExpense.receiptUrl;

        // Update in transaction
        const updatedExpense = await prisma.$transaction(async (tx) => {
            if (targetAccountId && diff !== 0 && wasPaid) {
                await tx.account.update({
                    where: { id: targetAccountId },
                    data: { balance: { decrement: diff } }
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
                    note: finalNote,
                    categoryId: categoryId || existingExpense.categoryId,
                    category: categoryName,
                    accountId: targetAccountId,
                    receiptUrl: receiptUrl !== undefined ? receiptUrl : existingExpense.receiptUrl
                },
                include: { account: true, expenseCategory: true, employee: true }
            });
        });

        // Edit original Telegram message if available
        const targetChatId = existingExpense.telegramChatId || defaultChatId;
        const targetMsgId = existingExpense.telegramMessageId;

        if (token && targetChatId && targetMsgId) {
            const formattedDate = new Date(existingExpense.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
            let updatedText = '';

            const reqMatch = existingExpense.note?.match(/\[Dalbaday:\s*([^\]]+)\]/);
            const requesterName = reqMatch ? reqMatch[1].trim() : '';
            const requesterLine = requesterName ? `🗣 <b>Soo Dalbay:</b> ${requesterName}\n` : '';

            if (existingExpense.employeeId) {
                updatedText = `<b>AN-Industory</b>\n` +
                              `<b>✅ Diiwaangelinta Mushaharka (Cusboonaysiin)</b>\n\n` +
                              requesterLine +
                              `👤 Shaqaalaha: ${updatedExpense.employee?.fullName || 'Shaqaale'}\n` +
                              `💵 Lacagta: ${newAmount.toLocaleString()} ETB\n` +
                              (paymentPhone ? `📱 Lambarka: ${paymentPhone}\n` : '') +
                              `💳 Koontada: ${updatedExpense.account?.name || 'Account'} (Haraa: ${Number(updatedExpense.account?.balance || 0).toLocaleString()} ETB)\n` +
                              `📝 Sharaxaad: ${finalNote}\n` +
                              `📅 Taariikhda: ${formattedDate}`;
            } else {
                updatedText = `<b>AN-Industory</b>\n` +
                              `<b>✅ Diiwaangelinta Kharashka (Cusboonaysiin)</b>\n\n` +
                              requesterLine +
                              `📂 Qaybta: ${updatedExpense.category}\n` +
                              `💵 Lacagta: ${newAmount.toLocaleString()} ETB\n` +
                              `💳 Koontada: ${updatedExpense.account?.name || 'Account'} (Haraa: ${Number(updatedExpense.account?.balance || 0).toLocaleString()} ETB)\n` +
                              `📝 Sharaxaad: ${finalNote}\n` +
                              `📅 Taariikhda: ${formattedDate}`;
            }

            await editTelegramBotMessage(token, targetChatId, targetMsgId, updatedText);
        }

        return NextResponse.json({ success: true, expense: updatedExpense });
    } catch (error: any) {
        console.error('Error editing expense:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete Expense
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
        const wasPaid = expense.approved || expense.paymentStatus === 'PAID' || !!expense.receiptUrl;

        // Refund balance ONLY IF paid, then delete expense
        await prisma.$transaction(async (tx) => {
            if (expense.accountId && wasPaid) {
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
                `<b>⚠️ Codsigan waa la kansalay (Deleted)</b>\n\n` +
                `📂 Qaybta: ${expense.category}\n` +
                `💵 Lacagta: ${refundAmount.toLocaleString()} ETB\n` +
                `📝 Sharaxaad: ${expense.description || expense.note || ''}\n\n` +
                (wasPaid 
                    ? `🛑 <i>Lacagtii waxaa dib loogu soo celiyay koontada.</i>` 
                    : `🛑 <i>Codsigan waa la tirtiray inta aana lacagta la bixiyin (Rasiid la'aan).</i>`);

            await editTelegramBotMessage(token, targetChatId, targetMsgId, cancelledText);
        }

        return NextResponse.json({ 
            success: true, 
            message: wasPaid 
                ? 'Kharashka waa la tirtiray, lacagtiina waa loo soo celiyay koontada!' 
                : 'Codsiga waa la tirtiray (Rasiid ma lahayn maadaama aan la bixin)!' 
        });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Manager Approve / Reject Expense Action
export async function POST(request: Request) {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const defaultChatId = process.env.TELEGRAM_CHAT_ID;
        const body = await request.json();
        const { id, action, managerName } = body; // action: 'approve' | 'reject'

        if (!id || !action) {
            return NextResponse.json({ error: 'Expense ID and action are required' }, { status: 400 });
        }

        const expense = await prisma.expense.findUnique({
            where: { id },
            include: { account: true, employee: true }
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        const approver = managerName || 'Abdehakim Mumin (@Abdehakimmumin)';

        if (action === 'approve') {
            const updated = await prisma.expense.update({
                where: { id },
                data: {
                    approved: true,
                    paymentStatus: 'APPROVED_AWAITING_RECEIPT'
                }
            });

            // Edit Telegram message to prompt requester for receipt upload
            const targetChatId = expense.telegramChatId || defaultChatId;
            const targetMsgId = expense.telegramMessageId;

            if (token && targetChatId && targetMsgId) {
                const approvedText =
                    `<b>AN-Industory</b>\n` +
                    `<b>📋 Codsiga ${expense.employeeId ? 'Mushaharka' : 'Kharashka'} (Sugaya Rasiidka)</b>\n\n` +
                    `📂 Qaybta: ${expense.category}\n` +
                    `💵 Lacagta: ${Number(expense.amount).toLocaleString()} ETB\n` +
                    `✍️ <b>Oggolaaday Manager:</b> ${approver}\n\n` +
                    `⏳ <b>Waa la oggolaaday!</b> Fadlan ku soo dir sawirka Rasiidka (Receipt Photo) ama ku dhufo badhanka hoose.`;

                const receiptMarkup = {
                    inline_keyboard: [
                        [
                            { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_${expense.id}` }
                        ]
                    ]
                };

                await editTelegramBotMessage(token, targetChatId, targetMsgId, approvedText, receiptMarkup);
            }

            return NextResponse.json({ success: true, message: 'Dalabku waa la oggolaaday!', expense: updated });
        } else if (action === 'reject') {
            await prisma.expense.delete({ where: { id } });

            const targetChatId = expense.telegramChatId || defaultChatId;
            const targetMsgId = expense.telegramMessageId;

            if (token && targetChatId && targetMsgId) {
                const rejectedText =
                    `<b>AN-Industory</b>\n` +
                    `<b>🛑 DALABKA WAA LA DIADAY (REJECTED)</b>\n\n` +
                    `📂 Qaybta: ${expense.category}\n` +
                    `💵 Lacagta: ${Number(expense.amount).toLocaleString()} ETB\n` +
                    `✍️ Diaday: ${approver}`;

                await editTelegramBotMessage(token, targetChatId, targetMsgId, rejectedText);
            }

            return NextResponse.json({ success: true, message: 'Dalabku waa la diaday.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in manager expense action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
