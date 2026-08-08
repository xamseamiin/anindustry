// app/api/telegram/history/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        if (!companyId) {
            return NextResponse.json({ error: 'TELEGRAM_COMPANY_ID not configured' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'all'; // 'all', 'today', 'week', 'month', 'custom'
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const phone = searchParams.get('phone'); // Optional phone filter

        let dateWhere: any = {};

        const now = new Date();
        if (filter === 'today') {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            dateWhere = { gte: startOfDay, lte: endOfDay };
        } else if (filter === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - 7);
            dateWhere = { gte: startOfWeek };
        } else if (filter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateWhere = { gte: startOfMonth };
        } else if (filter === 'custom' && (startDateParam || endDateParam)) {
            dateWhere = {};
            if (startDateParam) dateWhere.gte = new Date(startDateParam);
            if (endDateParam) {
                const end = new Date(endDateParam);
                end.setHours(23, 59, 59, 999);
                dateWhere.lte = end;
            }
        }

        const ebirrAccount = await prisma.account.findFirst({
            where: {
                companyId,
                name: { equals: 'E-Birr Merchant', mode: 'insensitive' }
            },
            select: { id: true, name: true, balance: true }
        });
        if (!ebirrAccount) {
            return NextResponse.json({ error: 'E-Birr Merchant account not found' }, { status: 404 });
        }
        const ebirrAccountId = ebirrAccount.id;

        const whereCondition: any = {
            companyId,
            ...(Object.keys(dateWhere).length > 0 ? { expenseDate: dateWhere } : {}),
            accountId: ebirrAccountId
        };

        const expenses = await prisma.expense.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true, description: true, amount: true, category: true, categoryId: true, subCategory: true,
                accountId: true, expenseDate: true, createdAt: true, note: true, receiptUrl: true,
                paymentStatus: true, approved: true, employeeId: true, telegramMessageId: true, telegramChatId: true,
                expenseCategory: { select: { name: true } }, account: { select: { name: true } },
                employee: { select: { fullName: true, phone: true, phoneNumber: true } }
            }
        });

        // 2. Fetch DEPOSIT/INFLOW transactions for E-Birr Merchant Account ONLY
        let deposits: any[] = [];
        try {
            const depositWhereCondition: any = {
                companyId,
                OR: [
                    { accountId: ebirrAccountId },
                    { toAccountId: ebirrAccountId }
                ],
                type: { in: ['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'DEBT_TAKEN', 'OTHER'] },
                ...(Object.keys(dateWhere).length > 0 ? { transactionDate: dateWhere } : {})
            };

            deposits = await prisma.transaction.findMany({
                where: depositWhereCondition,
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { id: true, description: true, amount: true, accountId: true, transactionDate: true, createdAt: true, note: true, receiptUrl: true, account: { select: { name: true } } }
            });
        } catch (depositErr) {
            console.error('Error fetching transaction deposits:', depositErr);
            deposits = [];
        }

        const mappedExpenses = expenses.map(e => {
            const noteStr = e.note || '';
            const reqMatch = noteStr.match(/\[Dalbaday:\s*([^\]]+)\]/);
            const idMatch = noteStr.match(/\[TelegramId:\s*([^\]]+)\]/);
            const phoneMatch = noteStr.match(/\[PaymentPhone:\s*([^\]]+)\]/);
            const recipMatch = noteStr.match(/\[RecipientName:\s*([^\]]+)\]/);

            const cleanNote = noteStr.replace(/\[(?:Dalbaday|TelegramId|PaymentPhone|RecipientName|Account|AccountId):[^\]]*\]/g, '').trim();

            return {
                id: e.id,
                description: e.description || e.category || 'Expense',
                amount: Number(e.amount),
                category: e.category || e.expenseCategory?.name || 'General',
                categoryId: e.categoryId,
                subCategory: e.subCategory,
                accountId: e.accountId,
                accountName: e.account?.name || 'E-Birr Merchant',
                expenseDate: e.expenseDate.toISOString(),
                createdAt: e.createdAt.toISOString(),
                note: cleanNote,
                rawNote: noteStr,
                requesterName: reqMatch ? reqMatch[1].trim() : '',
                requesterId: idMatch ? idMatch[1].trim() : '',
                paymentPhone: phoneMatch ? phoneMatch[1].trim() : (e.employee?.phone || e.employee?.phoneNumber || ''),
                recipientName: recipMatch ? recipMatch[1].trim() : (e.employee?.fullName || ''),
                receiptUrl: e.receiptUrl || '',
                paymentStatus: e.paymentStatus || 'PAID',
                workflowStatus: e.paymentStatus || 'DRAFT',
                approved: e.approved ?? true,
                type: 'WITHDRAWAL',
                isDeposit: false,
                employeeName: e.employee?.fullName || null,
                employeeId: e.employeeId,
                telegramMessageId: e.telegramMessageId,
                telegramChatId: e.telegramChatId
            };
        });

        const mappedDeposits = deposits.map(d => ({
            id: d.id,
            description: d.description || 'Deposit / Account Inflow',
            amount: Number(d.amount),
            category: 'Deposit',
            categoryId: null,
            accountId: d.accountId,
            accountName: d.account?.name || 'E-Birr Merchant',
            expenseDate: d.transactionDate.toISOString(),
            createdAt: d.createdAt.toISOString(),
            note: d.note || 'Koontada oo lagu shubay lacag (Deposit)',
            rawNote: d.note || '',
            requesterName: 'System / Bank Deposit',
            requesterId: '',
            paymentPhone: '',
            recipientName: 'AN-Industory',
            receiptUrl: d.receiptUrl || '',
            paymentStatus: 'PAID',
            workflowStatus: 'PAID',
            approved: true,
            type: 'DEPOSIT',
            isDeposit: true,
            employeeName: null,
            employeeId: null,
            telegramMessageId: null,
            telegramChatId: null
        }));

        // Calculate the balance after every entry in chronological order, then return
        // newest first for the UI. This keeps each row's historical balance stable even
        // when the user searches or filters the already-calculated list.
        let runningBalance = 0;
        const combinedList = [...mappedExpenses, ...mappedDeposits]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map(entry => {
                const amount = Math.abs(Number(entry.amount));
                const isPaidExpense = entry.isDeposit || entry.paymentStatus === 'PAID' || !!entry.receiptUrl;
                if (isPaidExpense) {
                    runningBalance += entry.isDeposit || entry.type === 'DEPOSIT' ? amount : -amount;
                }
                return { ...entry, runningBalance };
            })
            .reverse();

        return NextResponse.json({
            success: true,
            expenses: combinedList,
            account: {
                id: ebirrAccount.id,
                name: ebirrAccount.name,
                balance: Number(ebirrAccount.balance)
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error: any) {
        console.error('Error fetching telegram history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
