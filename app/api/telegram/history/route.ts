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

        const whereCondition: any = {
            companyId,
            ...(Object.keys(dateWhere).length > 0 ? { expenseDate: dateWhere } : {})
        };

        // If phone filter provided, filter by phone number in note or employee phone
        if (phone) {
            whereCondition.OR = [
                { note: { contains: phone } },
                { employee: { phone: { contains: phone } } },
                { employee: { phoneNumber: { contains: phone } } }
            ];
        }

        const expenses = await prisma.expense.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                expenseCategory: true,
                account: true,
                employee: true
            }
        });

        return NextResponse.json({
            success: true,
            expenses: expenses.map(e => ({
                id: e.id,
                description: e.description,
                amount: Number(e.amount),
                category: e.category || e.expenseCategory?.name || 'General',
                categoryId: e.categoryId,
                accountId: e.accountId,
                accountName: e.account?.name || 'E-Birr Merchant',
                expenseDate: e.expenseDate.toISOString(),
                createdAt: e.createdAt.toISOString(),
                note: e.note || '',
                receiptUrl: e.receiptUrl || '',
                paymentStatus: e.paymentStatus || 'PAID',
                employeeName: e.employee?.fullName || null,
                employeeId: e.employeeId,
                telegramMessageId: e.telegramMessageId,
                telegramChatId: e.telegramChatId
            }))
        });
    } catch (error: any) {
        console.error('Error fetching telegram history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
