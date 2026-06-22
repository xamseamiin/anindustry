// app/api/manufacturing/expenses/route.ts - Factory Expenses Engine
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';


export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ expenses: [] });
        }

        const expenses = await prisma.expense.findMany({
            where: { companyId: user.companyId },
            orderBy: { expenseDate: 'desc' },
            take: 100
        });

        const formattedExpenses = expenses.map(exp => ({
            id: exp.id,
            description: exp.description,
            category: exp.category,
            date: new Date(exp.expenseDate).toISOString().split('T')[0],
            amount: Number(exp.amount),
            status: exp.paymentStatus || 'Paid',
            receiptUrl: exp.receiptUrl
        }));

        return NextResponse.json({ expenses: formattedExpenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { description, category, amount, date, status } = body;
        const expenseDate = new Date(date);

        // Check for Closed Fiscal Period
        const closedPeriod = await prisma.financialPeriod.findFirst({
            where: {
                companyId: user.companyId,
                isClosed: true,
                startDate: { lte: expenseDate },
                endDate: { gte: expenseDate }
            }
        });

        if (closedPeriod) {
            return NextResponse.json({ 
                error: `Muddada maaliyadeed ee ${closedPeriod.name} waa mid xiran. Kharash cusub laguma qori karo.` 
            }, { status: 403 });
        }

        const expense = await prisma.expense.create({
            data: {
                companyId: user.companyId,
                description,
                category: category,
                amount: Number(amount),
                expenseDate: expenseDate,
                paidFrom: 'Petty Cash',
                paymentStatus: status,
                userId: session.user.id
            }
        });

        // Log Audit Action
        await logAudit({
            action: 'CREATE_EXPENSE',
            entity: 'Expense',
            entityId: expense.id,
            details: `Recorded expense: ${description} (${Number(amount).toLocaleString()} ETB)`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({ success: true, expense });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { id, action } = body;

        if (action === 'APPROVE') {
            // Approve the expense
            const expense = await prisma.expense.findFirst({
                where: { id, companyId: user.companyId }
            });

            if (!expense) {
                return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
            }

            if (expense.approved) {
                return NextResponse.json({ error: 'Expense already approved' }, { status: 400 });
            }

            const result = await prisma.$transaction(async (tx) => {
                // 1. Update expense status to approved and paid
                const updatedExpense = await tx.expense.update({
                    where: { id },
                    data: {
                        approved: true,
                        paymentStatus: 'PAID',
                        paymentDate: new Date()
                    }
                });

                // 2. Decrement account balance
                if (expense.accountId) {
                    await tx.account.update({
                        where: { id: expense.accountId },
                        data: { balance: { decrement: Number(expense.amount) } }
                    });
                }

                // 3. Create transaction entry (negative for expense)
                const transaction = await tx.transaction.create({
                    data: {
                        companyId: user.companyId,
                        userId: session.user.id,
                        description: expense.description,
                        amount: Number(expense.amount),
                        type: 'EXPENSE',
                        accountId: expense.accountId,
                        expenseId: expense.id,
                        employeeId: expense.employeeId,
                        receiptUrl: expense.receiptUrl
                    }
                });

                return { updatedExpense, transaction };
            });

            // If this was created from Telegram, try to update the Telegram message in real-time
            const telegramMetadata = expense.note || '';
            const chatIdMatch = telegramMetadata.match(/\[TelegramChatId:\s*([^\]]+)\]/);
            const messageIdMatch = telegramMetadata.match(/\[TelegramMessageId:\s*([^\]]+)\]/);

            if (chatIdMatch && messageIdMatch) {
                const chatId = chatIdMatch[1];
                const messageId = parseInt(messageIdMatch[1]);
                if (!isNaN(messageId)) {
                    const cleanNote = (expense.note || '')
                        .replace(/\[TelegramChatId:\s*[^\]]+\]/g, '')
                        .replace(/\[TelegramMessageId:\s*[^\]]+\]/g, '')
                        .replace(/\[TelegramId:\s*\d+\]/g, '')
                        .replace(/\[Dalbaday:\s*[^\]]+\]/g, '')
                        .replace(/\[AccountId:\s*[^\]]+\]/g, '')
                        .replace(/\[Account:\s*[^\]]+\]/g, '')
                        .replace(/\[ReceiptUrl:\s*[^\]]+\]/g, '')
                        .trim();

                    const formattedDate = new Date(expense.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });

                    let captionText = '';
                    if (expense.employeeId) {
                        const employee = await prisma.employee.findUnique({ where: { id: expense.employeeId } });
                        captionText = `<b>AN-Industory</b>\n` +
                                      `<b>✅ Diiwaangelinta Mushaharka (Waala Bixiyey)</b>\n\n` +
                                      `👤 Shaqaalaha: ${employee ? employee.fullName : 'Unknown'}\n` +
                                      `💵 Lacagta la bixiyey: ${Number(expense.amount).toLocaleString()} ETB\n` +
                                      `💳 Koontada la doortay: ${expense.paidFrom}\n` +
                                      `📝 Sharaxaad: ${cleanNote || 'Mushaharka bisha'}\n` +
                                      `📅 Taariikhda: ${formattedDate}\n\n` +
                                      `✅ Rasiidka waa la galiyey oo haraaga waa laga jaray.`;
                    } else {
                        captionText = `<b>AN-Industory</b>\n` +
                                      `<b>✅ Diiwaangelinta Kharashka (Waala Bixiyey)</b>\n\n` +
                                      `📂 Qaybta: ${expense.category}\n` +
                                      `💵 Lacagta la bixiyey: ${Number(expense.amount).toLocaleString()} ETB\n`;

                        if (expense.category === 'Transport & Fuel' && expense.transportType) {
                            captionText += `🚗 Nooca Gadiidka: ${expense.transportType}\n`;
                        } else if (expense.category === 'Equipment Rental' && expense.equipmentName) {
                            captionText += `⚙️ Qalabka: ${expense.equipmentName}\n📅 Muddada Kirada: ${expense.rentalPeriod || ''}\n`;
                        } else if (expense.category === 'Consultancy & Service' && expense.consultantName) {
                            captionText += `👤 La-taliyaha: ${expense.consultantName}\n📋 Adeegga: ${expense.consultancyType || ''}\n`;
                        } else if (expense.category === 'Raw Material' && expense.supplierName) {
                            let matName = '';
                            if (expense.materials && typeof expense.materials === 'object') {
                                matName = (expense.materials as any).materialName || '';
                            }
                            captionText += `🏭 Alaab-keenaha: ${expense.supplierName}\n📦 Name: ${matName}\n`;
                        }

                        captionText += `💳 Koontada la doortay: ${expense.paidFrom}\n` +
                                      `📝 Sharaxaad: ${cleanNote}\n` +
                                      `📅 Taariikhda: ${formattedDate}\n\n` +
                                      `✅ Rasiidka waa la galiyey oo haraaga waa laga jaray.`;
                    }

                    const { telegramSender } = await import('@/lib/telegram-sender');
                    await telegramSender.updateMessageToPaid(chatId, messageId, captionText, !!expense.receiptUrl);
                }
            }

            return NextResponse.json({ success: true, expense: result.updatedExpense });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error approving expense:', error);
        return NextResponse.json({ error: error.message || 'Failed to approve expense' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, fullName: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });
        }

        // 1. Fetch the expense
        const expense = await prisma.expense.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // 2. Perform the deletion and refund in a database transaction
        const result = await prisma.$transaction(async (tx) => {
            // A. If the expense was approved/paid, refund the balance to the account!
            if (expense.paymentStatus === 'PAID' && expense.accountId) {
                await tx.account.update({
                    where: { id: expense.accountId },
                    data: { balance: { increment: Number(expense.amount) } }
                });

                // B. Create a refund transaction entry (positive adjustment)
                await tx.transaction.create({
                    data: {
                        companyId: user.companyId,
                        userId: session.user.id,
                        description: `REVERTED: ${expense.description}`,
                        amount: Number(expense.amount),
                        type: 'INCOME', // or revert transaction
                        accountId: expense.accountId,
                        note: `Reverted/Cancelled Expense: ${expense.description} (Deleted by ${user.fullName})`,
                        transactionDate: new Date()
                    }
                });

                // Delete any transaction associated with this expense
                await tx.transaction.deleteMany({
                    where: { expenseId: expense.id }
                });
            }

            // C. Delete the expense record
            const deletedExpense = await tx.expense.delete({
                where: { id }
            });

            return deletedExpense;
        });

        // 3. Update the Telegram message (if this was created from Telegram)
        const telegramMetadata = expense.note || '';
        const chatIdMatch = telegramMetadata.match(/\[TelegramChatId:\s*([^\]]+)\]/);
        const messageIdMatch = telegramMetadata.match(/\[TelegramMessageId:\s*([^\]]+)\]/);

        if (chatIdMatch && messageIdMatch) {
            const chatId = chatIdMatch[1];
            const messageId = parseInt(messageIdMatch[1]);
            if (!isNaN(messageId)) {
                // Extract clean note
                const cleanNote = (expense.note || '')
                    .replace(/\[TelegramChatId:\s*[^\]]+\]/g, '')
                    .replace(/\[TelegramMessageId:\s*[^\]]+\]/g, '')
                    .replace(/\[TelegramId:\s*\d+\]/g, '')
                    .replace(/\[Dalbaday:\s*[^\]]+\]/g, '')
                    .replace(/\[AccountId:\s*[^\]]+\]/g, '')
                    .replace(/\[Account:\s*[^\]]+\]/g, '')
                    .replace(/\[ReceiptUrl:\s*[^\]]+\]/g, '')
                    .trim();

                const formattedDate = new Date(expense.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
                
                // Get creator name from metadata if present
                const creatorMatch = telegramMetadata.match(/\[Dalbaday:\s*([^\]]+)\]/);
                const creatorName = creatorMatch ? creatorMatch[1] : 'User';

                const deleteText = `<b>AN-Industory</b>\n` +
                                   `<b>❌ KHARASH LAGA NOQDAY / CANCELLED EXPENSE</b>\n\n` +
                                   `📂 Qaybta: ${expense.category}\n` +
                                   `💵 Lacagtii: ${Number(expense.amount).toLocaleString()} ETB\n` +
                                   `📝 Sharaxaad: ${cleanNote}\n` +
                                   `👤 Qofkii soo galiyey: ${creatorName}\n` +
                                   `📅 Taariikhda: ${formattedDate}\n\n` +
                                   `⚠️ <b>Kharashkan waa laga noqday (Deleted) waxaana tirtiray ${user.fullName}. Haraagii waa lagu celiyey koontada.</b>`;

                try {
                    const { telegramSender } = await import('@/lib/telegram-sender');
                    // We update the message to reflect it is cancelled/deleted and remove the inline keyboard entirely
                    await telegramSender.updateMessageToPaid(chatId, messageId, deleteText, false); 
                } catch (err) {
                    console.error("Error updating Telegram message for deleted expense:", err);
                }
            }
        }

        // Log Audit Action
        await logAudit({
            action: 'DELETE_EXPENSE',
            entity: 'Expense',
            entityId: id,
            details: `Deleted expense: ${expense.description} (${Number(expense.amount).toLocaleString()} ETB). Refunded to account.`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({ success: true, message: 'Expense deleted and refunded successfully' });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete expense' }, { status: 500 });
    }
}
