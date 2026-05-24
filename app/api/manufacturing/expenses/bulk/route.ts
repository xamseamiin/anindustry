// app/api/manufacturing/expenses/bulk/route.ts - AN-Industory Bulk Expenses Engine
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

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
        const { expenses } = body;

        if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
            return NextResponse.json({ error: 'No expenses data provided' }, { status: 400 });
        }

        // Execute all expenses atomically
        const results = await prisma.$transaction(async (tx) => {
            const processedExpenses = [];

            for (const item of expenses) {
                const description = (item.description || '').trim();
                const amount = Number(item.amount) || 0;
                const category = item.category || 'Utilities';
                const date = new Date(item.date || Date.now());
                const status = item.status || 'PAID';
                const accountId = item.accountId || null;

                if (!description || amount <= 0) continue; // Skip empty rows

                // Check for Closed Fiscal Period
                const closedPeriod = await tx.financialPeriod.findFirst({
                    where: {
                        companyId: user.companyId,
                        isClosed: true,
                        startDate: { lte: date },
                        endDate: { gte: date }
                    }
                });

                if (closedPeriod) {
                    throw new Error(`Muddada maaliyadeed ee ${closedPeriod.name} waa mid xiran. Kharash cusub laguma qori karo.`);
                }

                // 1. Create Expense record
                const expense = await tx.expense.create({
                    data: {
                        companyId: user.companyId,
                        description,
                        category,
                        amount,
                        expenseDate: date,
                        paidFrom: 'Petty Cash',
                        paymentStatus: status,
                        userId: session.user.id,
                        accountId: accountId
                    }
                });

                // 2. Decrement cash/bank account if status is PAID
                if (status === 'PAID' && accountId) {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amount } }
                    });

                    await tx.transaction.create({
                        data: {
                            description: `Kharash (Bulk): ${description}`,
                            amount: amount,
                            type: 'EXPENSE',
                            accountId: accountId,
                            companyId: user.companyId,
                            userId: session.user.id
                        }
                    });
                }

                processedExpenses.push(expense);
            }

            return processedExpenses;
        });

        // Audit log
        await logAudit({
            action: 'CREATE_EXPENSE_BULK',
            entity: 'Expense',
            entityId: session.user.id,
            details: `Successfully processed ${results.length} expenses in bulk.`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error('Error creating bulk expenses:', error);
        return NextResponse.json({ error: 'Failed to create bulk expenses: ' + error.message }, { status: 500 });
    }
}
