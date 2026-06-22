// app/api/manufacturing/expenses/bulk/route.ts - AN-Industory Bulk Expenses Engine
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function cleanAndParseFloat(val: any): number {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleanStr = String(val).replace(/,/g, '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
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
        const { expenses } = body;

        if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
            return NextResponse.json({ error: 'No expenses data provided' }, { status: 400 });
        }

        // Execute all expenses atomically
        const results = await prisma.$transaction(async (tx) => {
            const expensesToCreate: any[] = [];
            const transactionsToCreate: any[] = [];
            const accountDecrements = new Map<string, number>();

            const closedPeriods = await tx.financialPeriod.findMany({
                where: { companyId: user.companyId, isClosed: true }
            });

            for (const item of expenses) {
                const description = (item.description || '').trim();
                const amount = cleanAndParseFloat(item.amount);
                const category = item.category || 'Utilities';
                const date = new Date(item.date || Date.now());
                const status = item.status || 'PAID';
                const accountId = item.accountId || null;

                if (!description || amount <= 0) continue; // Skip empty rows

                // Check for Closed Fiscal Period in-memory
                const closedPeriod = closedPeriods.find(p => date >= new Date(p.startDate) && date <= new Date(p.endDate));
                if (closedPeriod) {
                    throw new Error(`Muddada maaliyadeed ee ${closedPeriod.name} waa mid xiran. Kharash cusub laguma qori karo.`);
                }

                const expenseId = crypto.randomUUID();

                // 1. Prepare Expense record
                expensesToCreate.push({
                    id: expenseId,
                    companyId: user.companyId,
                    description,
                    category,
                    amount,
                    expenseDate: date,
                    paidFrom: 'Petty Cash',
                    paymentStatus: status,
                    userId: session.user.id,
                    accountId: accountId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // 2. Prepare Ledger transaction if PAID
                if (status === 'PAID' && accountId) {
                    accountDecrements.set(accountId, (accountDecrements.get(accountId) || 0) + amount);

                    transactionsToCreate.push({
                        id: crypto.randomUUID(),
                        description: `Kharash (Bulk): ${description}`,
                        amount: amount,
                        type: 'EXPENSE',
                        accountId: accountId,
                        companyId: user.companyId,
                        userId: session.user.id,
                        transactionDate: date,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }

            // Batch create records
            if (expensesToCreate.length > 0) {
                await tx.expense.createMany({ data: expensesToCreate });
            }
            if (transactionsToCreate.length > 0) {
                await tx.transaction.createMany({ data: transactionsToCreate });
            }

            // Aggregated account updates
            for (const [accId, decAmount] of accountDecrements.entries()) {
                await tx.account.update({
                    where: { id: accId },
                    data: { balance: { decrement: decAmount } }
                });
            }

            return expensesToCreate;
        }, {
            maxWait: 30000,
            timeout: 120000 // Extended to 2 minutes for massive sheets
        });

        // Audit log
        await logAudit({
            action: 'CREATE_EXPENSE_BULK',
            entity: 'Expense',
            entityId: session.user.id,
            details: `Successfully processed ${results.length} expenses in bulk using batch operations.`,
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
