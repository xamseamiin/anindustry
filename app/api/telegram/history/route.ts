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
        const requestedAccountId = searchParams.get('accountId');
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

        const account = requestedAccountId
            ? await prisma.account.findFirst({ where: { id: requestedAccountId, companyId, isActive: true }, select: { id: true, name: true, balance: true, reservedBalance: true, currency: true } })
            : await prisma.account.findFirst({ where: { companyId, name: { equals: 'E-Birr Merchant', mode: 'insensitive' } }, select: { id: true, name: true, balance: true, reservedBalance: true, currency: true } });
        if (!account) {
            return NextResponse.json({ error: 'E-Birr Merchant account not found' }, { status: 404 });
        }
        const accountId = account.id;

        const whereCondition: any = {
            companyId,
            ...(Object.keys(dateWhere).length > 0 ? { expenseDate: dateWhere } : {}),
            accountId
        };

        const expenses = await prisma.expense.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true, description: true, amount: true, category: true, categoryId: true, subCategory: true,
                accountId: true, expenseDate: true, createdAt: true, note: true, receiptUrl: true,
                paymentStatus: true, workflowStatus: true, version: true, approved: true, employeeId: true, telegramMessageId: true, telegramChatId: true,
                expenseCategory: { select: { name: true } }, account: { select: { name: true } },
                employee: { select: { fullName: true, phone: true, phoneNumber: true } }
            }
        });

        // Fetch deposits/inflows for the selected account only.
        let deposits: any[] = [];
        const depositWhereCondition: any = {
            companyId,
            AND: [{ OR: [{ idempotencyKey: null }, { NOT: { idempotencyKey: { startsWith: 'revision:' } } }] }],
            OR: [{ accountId }, { toAccountId: accountId }],
            type: { in: ['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'DEBT_TAKEN', 'OTHER'] },
            ...(Object.keys(dateWhere).length > 0 ? { transactionDate: dateWhere } : {})
        };
        const outboundWhereCondition: any = {
            companyId,
            reversedAt: null,
            expenseId: null,
            OR: [{ accountId }, { fromAccountId: accountId }],
            type: { in: ['TRANSFER_OUT', 'DEBT_GIVEN', 'DEBT_REPAID'] },
            ...(Object.keys(dateWhere).length > 0 ? { transactionDate: dateWhere } : {})
        };
        let withdrawals: any[] = [];
        try {
            deposits = await prisma.transaction.findMany({
                where: depositWhereCondition,
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { id: true, description: true, amount: true, accountId: true, toAccountId: true, transactionDate: true, createdAt: true, note: true, receiptUrl: true, account: { select: { name: true } }, toAccount: { select: { name: true } } }
            });
        } catch (depositErr) {
            console.error('Error fetching transaction deposits:', depositErr);
            deposits = [];
        }
        try {
            withdrawals = await prisma.transaction.findMany({
                where: outboundWhereCondition,
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { id: true, description: true, amount: true, accountId: true, fromAccountId: true, transactionDate: true, createdAt: true, note: true, receiptUrl: true, account: { select: { name: true } }, fromAccount: { select: { name: true } } }
            });
        } catch (withdrawalErr) {
            console.error('Error fetching direct account withdrawals:', withdrawalErr);
        }

        let revisions: any[] = [];
        try {
            revisions = await prisma.expenseRevision.findMany({ where: { companyId, expenseId: { in: expenses.map(e => e.id) } }, orderBy: { createdAt: 'desc' } });
        } catch (revisionErr) {
            // The revision workflow table may not yet exist in older production DBs.
            // It is optional for reading the ledger; don't let it take down Transactions.
            console.warn('Expense revision history is unavailable; continuing without revision badges.', revisionErr);
        }
        const revisionPayments = revisions.length ? await prisma.transaction.findMany({
            where: { companyId, expenseId: { in: revisions.map(r => r.expenseId) }, reversedAt: null, type: { in: ['EXPENSE', 'DEBT_REPAID', 'INCOME'] } },
            select: { expenseId: true, amount: true, type: true }
        }) : [];
        const mappedExpenses = expenses.map(e => {
            const revision = revisions.find(r => r.expenseId === e.id);
            const settledAmount = revision ? revisionPayments.filter(t => t.expenseId === e.id).reduce((sum, t) => sum + (t.type === 'INCOME' ? -1 : 1) * Number(t.amount), 0) : undefined;
            const noteStr = e.note || '';
            const reqMatch = noteStr.match(/\[Dalbaday:\s*([^\]]+)\]/);
            const idMatch = noteStr.match(/\[TelegramId:\s*([^\]]+)\]/);
            const phoneMatch = noteStr.match(/\[PaymentPhone:\s*([^\]]+)\]/);
            const recipMatch = noteStr.match(/\[RecipientName:\s*([^\]]+)\]/);
            const supplierReceiptMatch = noteStr.match(/\[(?:SupplierReceiptUrl|PurchaseReceiptUrl):\s*([^\]]+)\]/);

            const cleanNote = noteStr.replace(/\[(?:Dalbaday|TelegramId|PaymentPhone|RecipientName|Account|AccountId):[^\]]*\]/g, '').trim();

            const isApproved = e.approved ?? false;
            const hasReceipt = !!e.receiptUrl;
            const calculatedStatus = !isApproved
                ? 'PENDING_APPROVAL'
                : (!hasReceipt && e.paymentStatus !== 'PAID' ? 'AWAITING_RECEIPT' : (e.paymentStatus || 'PAID'));

            return {
                id: e.id,
                version: e.version,
                revision: revision ? { id: revision.id, status: revision.status, syncStatus: revision.syncStatus, reason: revision.reason } : null,
                description: e.description || e.category || 'Expense',
                amount: Number(e.amount),
                settledAmount,
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
                supportingReceiptUrl: supplierReceiptMatch ? supplierReceiptMatch[1].trim() : '',
                paymentStatus: e.paymentStatus || (isApproved ? (hasReceipt ? 'PAID' : 'UNPAID') : 'UNPAID'),
                workflowStatus: revision && ['PENDING_APPROVAL','AWAITING_RECEIPT','RECEIPT_REVIEW'].includes(revision.status) ? 'REVISION_' + revision.status : calculatedStatus,
                approved: isApproved,
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
            accountId: d.toAccountId || d.accountId || accountId,
            accountName: d.toAccount?.name || d.account?.name || account.name,
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
        const mappedWithdrawals = withdrawals.map(w => ({
            id: w.id,
            description: w.description || 'Account withdrawal',
            amount: Number(w.amount),
            category: 'Withdrawal',
            categoryId: null,
            accountId: w.fromAccountId || w.accountId || accountId,
            accountName: w.fromAccount?.name || w.account?.name || account.name,
            expenseDate: w.transactionDate.toISOString(),
            createdAt: w.createdAt.toISOString(),
            note: w.note || '',
            rawNote: w.note || '',
            requesterName: '',
            requesterId: '',
            paymentPhone: '',
            recipientName: '',
            receiptUrl: w.receiptUrl || '',
            paymentStatus: 'PAID',
            workflowStatus: 'PAID',
            approved: true,
            type: 'WITHDRAWAL',
            isDeposit: false,
            employeeName: null,
            employeeId: null,
            telegramMessageId: null,
            telegramChatId: null
        }));

        // Calculate the balance after every entry in chronological order, then return
        // newest first for the UI. This keeps each row's historical balance stable even
        // when the user searches or filters the already-calculated list.
        const combinedList = [...mappedExpenses, ...mappedDeposits, ...mappedWithdrawals]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map(entry => {
                const amount = Math.abs(Number('settledAmount' in entry ? entry.settledAmount ?? entry.amount : entry.amount));
                const isPaidExpense = entry.isDeposit || entry.paymentStatus === 'PAID' || !!entry.receiptUrl;
                const signedAmount = !isPaidExpense ? 0 : entry.isDeposit || entry.type === 'DEPOSIT' ? amount : -amount;
                return { ...entry, signedAmount };
            })
            .reverse();

        const paidExpenseWhere = { ...whereCondition, OR: [{ paymentStatus: 'PAID' }, { receiptUrl: { not: null } }] };
        const categoryGroups = await prisma.expense.groupBy({
            by: ['category', 'categoryId'],
            where: paidExpenseWhere,
            _sum: { amount: true },
            _count: { _all: true }
        });
        const [inflowAggregate, directOutflowAggregate, outflowAggregate] = await Promise.all([
            prisma.transaction.aggregate({ where: depositWhereCondition, _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: outboundWhereCondition, _sum: { amount: true } }),
            prisma.expense.aggregate({ where: paidExpenseWhere, _sum: { amount: true } })
        ]);
        const totalMoneyIn = Number(inflowAggregate._sum.amount || 0);
        const totalMoneyOut = Number(outflowAggregate._sum.amount || 0) + Number(directOutflowAggregate._sum.amount || 0);

        return NextResponse.json({
            success: true,
            expenses: combinedList,
            account: {
                id: account.id,
                name: account.name,
                currency: account.currency,
                balance: Number(account.balance),
                reservedBalance: Number(account.reservedBalance || 0),
                availableBalance: Number(account.balance) - Number(account.reservedBalance || 0)
            },
            summary: { moneyIn: totalMoneyIn, moneyOut: totalMoneyOut, net: totalMoneyIn - totalMoneyOut },
            categoryBreakdown: categoryGroups.map(group => ({
                name: group.category || 'Uncategorized',
                categoryId: group.categoryId,
                amount: Number(group._sum.amount || 0),
                count: group._count._all
            })).sort((a, b) => b.amount - a.amount)
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
