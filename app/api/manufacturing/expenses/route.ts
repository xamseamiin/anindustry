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
            id: exp.receiptUrl || exp.id.slice(0, 8),
            description: exp.description,
            category: exp.category,
            date: new Date(exp.expenseDate).toISOString().split('T')[0],
            amount: Number(exp.amount),
            status: exp.paymentStatus || 'Paid'
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
