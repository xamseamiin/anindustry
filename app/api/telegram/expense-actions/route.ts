// app/api/telegram/expense-actions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

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
        const {
            id, amount, note, paymentPhone, recipientName, categoryId, accountId, receiptUrl,
            transportType, equipmentName, rentalPeriod, consultantName, consultancyType, billType
        } = body;

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

        // Update in transaction
        const updatedExpense = await prisma.$transaction(async (tx) => {
            // A balance changes only when a real payment transaction exists. Approval by
            // itself does not mean money left the account.
            const paymentTransactions = await tx.transaction.findMany({
                where: { expenseId: id, type: { in: ['EXPENSE', 'DEBT_REPAID'] } }
            });

            for (const payment of paymentTransactions) {
                const oldPaymentAccountId = payment.accountId;
                const oldPaymentAmount = Math.abs(Number(payment.amount));

                if (oldPaymentAccountId) {
                    await tx.account.update({
                        where: { id: oldPaymentAccountId },
                        data: { balance: { increment: oldPaymentAmount } }
                    });
                }
                if (targetAccountId) {
                    await tx.account.update({
                        where: { id: targetAccountId },
                        data: { balance: { decrement: newAmount } }
                    });
                }

                await tx.transaction.update({
                    where: { id: payment.id },
                    data: {
                        amount: newAmount,
                        accountId: targetAccountId,
                        description: finalNote || payment.description
                    }
                });
            }

            let categoryName = existingExpense.category;
            if (categoryId) {
                const cat = await tx.expenseCategory.findUnique({ where: { id: categoryId } });
                if (cat) categoryName = cat.name;
            }

            let description = finalNote;
            if (categoryName === 'Transport & Fuel') {
                description = `Transport & Fuel${transportType ? ` (${transportType})` : ''}: ${note || ''}`.trim();
            } else if (categoryName === 'Equipment Rental') {
                const detail = [equipmentName, rentalPeriod].filter(Boolean).join(' - ');
                description = `Equipment Rental${detail ? ` (${detail})` : ''}: ${note || ''}`.trim();
            } else if (categoryName === 'Consultancy & Service') {
                const detail = [consultantName, consultancyType].filter(Boolean).join(' - ');
                description = `Consultancy & Service${detail ? ` (${detail})` : ''}: ${note || ''}`.trim();
            } else if (categoryName === 'Bills') {
                description = `Bills${billType ? ` (${billType})` : ''}: ${note || ''}`.trim();
            }

            return await tx.expense.update({
                where: { id },
                data: {
                    amount: newAmount,
                    note: finalNote,
                    categoryId: categoryId || existingExpense.categoryId,
                    category: categoryName,
                    description,
                    subCategory: billType || existingExpense.subCategory,
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

// DELETE: Delete Expense / Transaction and remove message from Telegram
export async function DELETE(request: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const defaultChatId = process.env.TELEGRAM_CHAT_ID;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Expense or Transaction ID required' }, { status: 400 });
        }

        let expense = await prisma.expense.findUnique({
            where: { id },
            include: { account: true }
        });

        let transaction = await prisma.transaction.findUnique({
            where: { id }
        });

        if (!expense && transaction && transaction.expenseId) {
            expense = await prisma.expense.findUnique({
                where: { id: transaction.expenseId },
                include: { account: true }
            });
        }

        const targetChatId = expense?.telegramChatId || defaultChatId;
        const targetMsgId = expense?.telegramMessageId;

        // Perform deletion in transaction
        await prisma.$transaction(async (tx) => {
            const transactionsToDelete = expense
                ? await tx.transaction.findMany({ where: { expenseId: expense.id } })
                : (transaction ? [transaction] : []);

            // Reverse only actual ledger entries. Previously an approved expense without
            // a receipt/payment transaction was refunded, creating money in the account.
            for (const ledgerEntry of transactionsToDelete) {
                const amount = Math.abs(Number(ledgerEntry.amount));
                const isOutflow = ['EXPENSE', 'DEBT_GIVEN', 'TRANSFER_OUT', 'SALARY'].includes(ledgerEntry.type)
                    || (ledgerEntry.type === 'DEBT_REPAID' && (!!ledgerEntry.vendorId || !!ledgerEntry.expenseId));
                const isInflow = ['INCOME', 'DEBT_TAKEN', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(ledgerEntry.type);

                if (ledgerEntry.accountId && isOutflow) {
                    await tx.account.update({
                        where: { id: ledgerEntry.accountId },
                        data: { balance: { increment: amount } }
                    });
                } else if (ledgerEntry.accountId && isInflow) {
                    await tx.account.update({
                        where: { id: ledgerEntry.accountId },
                        data: { balance: { decrement: amount } }
                    });
                } else if (!ledgerEntry.accountId) {
                    if (ledgerEntry.fromAccountId) {
                        await tx.account.update({
                            where: { id: ledgerEntry.fromAccountId },
                            data: { balance: { increment: amount } }
                        });
                    }
                    if (ledgerEntry.toAccountId) {
                        await tx.account.update({
                            where: { id: ledgerEntry.toAccountId },
                            data: { balance: { decrement: amount } }
                        });
                    }
                }
            }

            if (expense) {
                await tx.transaction.deleteMany({ where: { expenseId: expense.id } });
                await tx.expense.delete({ where: { id: expense.id } });

                if (expense.employeeId) {
                    const employee = await tx.employee.findUnique({
                        where: { id: expense.employeeId },
                        select: { salaryPaidThisMonth: true }
                    });
                    if (employee) {
                        await tx.employee.update({
                            where: { id: expense.employeeId },
                            data: {
                                salaryPaidThisMonth: Math.max(
                                    0,
                                    Number(employee.salaryPaidThisMonth || 0) - Number(expense.amount)
                                )
                            }
                        });
                    }
                }
            } else if (transaction) {
                await tx.transaction.delete({ where: { id: transaction.id } });

                if (transaction.employeeId) {
                    const employee = await tx.employee.findUnique({
                        where: { id: transaction.employeeId },
                        select: { salaryPaidThisMonth: true }
                    });
                    if (employee) {
                        await tx.employee.update({
                            where: { id: transaction.employeeId },
                            data: {
                                salaryPaidThisMonth: Math.max(
                                    0,
                                    Number(employee.salaryPaidThisMonth || 0) - Number(transaction.amount)
                                )
                            }
                        });
                    }
                }
            }
        });

        // Delete message from Telegram Group Chat completely
        if (token && targetChatId) {
            const chats = [targetChatId, '-1005307882362', '-5307882362'].filter(Boolean);
            for (const c of chats) {
                if (targetMsgId) {
                    try {
                        await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: c, message_id: targetMsgId })
                        });
                    } catch {}
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Diiwaankii & Fariintii Telegram-ka toos ayaa loo tirtiray!' 
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
        const { id, action, managerName, initData } = body; // action: 'approve' | 'reject'

        if (!id || !action) {
            return NextResponse.json({ error: 'Expense ID and action are required' }, { status: 400 });
        }

        const verifiedManager = verifyTelegramInitData(initData || '');
        if (!verifiedManager || !isTelegramFinancialAdmin(verifiedManager)) {
            return NextResponse.json({ error: 'Approve/Reject waxaa loo oggol yahay Hamse Moalin iyo Abdihakim Mumin oo keliya.' }, { status: 403 });
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
