// app/api/telegram/expense-actions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import revisionService from '@/lib/expense-revisions';
import { syncExpenseRevision } from '@/lib/expense-revision-telegram';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';
import { EXPENSE_STATES, releaseExpenseReservation, reserveExpenseFunds, transitionExpense } from '@/lib/financial-workflow';

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

// PUT: edits are audited proposals; financial changes need separate confirmation.
export async function PUT(request: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        if (!companyId) return NextResponse.json({ error: 'Company not configured.' }, { status: 400 });
        const body = await request.json();
        const identity = verifyTelegramInitData(body.initData || '');
        const local = process.env.APP_ENV === 'local' && process.env.NODE_ENV !== 'production';
        if (!local && !identity) {
            return NextResponse.json({ error: 'Telegram sign-in required.' }, { status: 403 });
        }
        const actor = { id: String(identity?.id || 'local-admin'), name: identity ? [identity.first_name, identity.last_name].filter(Boolean).join(' ') : 'Local Admin', local, source: 'MINI_APP' };
        const revision = await revisionService.createRevision(prisma, companyId, body, actor);
        const sync = await syncExpenseRevision(prisma, revision.id);
        return NextResponse.json({ success: true, revision, telegramSync: sync.status,
            message: revision.material ? 'Edit-ku wuxuu sugayaa ansixin iyo rasiid cusub. Balance lama beddelin.' : 'Qoraalka waa la saxay. Balance iyo rasiid lama beddelin.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Edit failed.' }, { status: 409 });
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
            if (expense) await revisionService.assertNoOpenRevision(tx, expense.id);
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
        if (token && targetChatId && process.env.TELEGRAM_NOTIFICATIONS_DISABLED !== 'true') {
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

        const approver = [verifiedManager.first_name, verifiedManager.last_name].filter(Boolean).join(' ');
        const revision = await prisma.expenseRevision.findFirst({ where: { expenseId: id, companyId: process.env.TELEGRAM_COMPANY_ID, status: 'PENDING_APPROVAL' } });
        if (revision && ['approve','reject'].includes(action)) {
            const updatedRevision = await revisionService.approveRevision(prisma, revision.companyId, revision.id, { id: String(verifiedManager.id), name: approver, source: 'MINI_APP' }, action === 'reject');
            const sync = await syncExpenseRevision(prisma, revision.id);
            return NextResponse.json({ success: true, revision: updatedRevision, telegramSync: sync.status });
        }
        await revisionService.assertNoOpenRevision(prisma, id);
        const actor = { id: String(verifiedManager.id), name: approver, source: 'MINI_APP' as const };

        if (action === 'approve') {
            await reserveExpenseFunds(id, actor);
            const updated = await transitionExpense(id, EXPENSE_STATES.AWAITING_RECEIPT, actor, { approvedBy: approver });

            // Edit Telegram message to prompt requester for receipt upload
            const targetChatId = expense.telegramChatId || defaultChatId;
            const targetMsgId = expense.telegramMessageId;

            if (token && targetChatId && targetMsgId && process.env.TELEGRAM_NOTIFICATIONS_DISABLED !== 'true') {
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
            await releaseExpenseReservation(id, actor, 'REJECTED');
            const rejected = await transitionExpense(id, EXPENSE_STATES.REJECTED, actor, { rejectedBy: approver });

            const targetChatId = expense.telegramChatId || defaultChatId;
            const targetMsgId = expense.telegramMessageId;

            if (token && targetChatId && targetMsgId && process.env.TELEGRAM_NOTIFICATIONS_DISABLED !== 'true') {
                const rejectedText =
                    `<b>AN-Industory</b>\n` +
                    `<b>🛑 DALABKA WAA LA DIADAY (REJECTED)</b>\n\n` +
                    `📂 Qaybta: ${expense.category}\n` +
                    `💵 Lacagta: ${Number(expense.amount).toLocaleString()} ETB\n` +
                    `✍️ Diaday: ${approver}`;

                await editTelegramBotMessage(token, targetChatId, targetMsgId, rejectedText);
            }

            return NextResponse.json({ success: true, message: 'Dalabku waa la diaday.', expense: rejected });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in manager expense action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
