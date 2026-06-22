// app/api/manufacturing/accounting/transactions/route.ts - AN-Industory Transactions Ledger API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all transaction logs with filters
export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const { searchParams } = new URL(request.url);
        
        const type = searchParams.get('type');
        const accountId = searchParams.get('accountId');
        const query = searchParams.get('query');

        // Build robust filter condition
        const where: any = { companyId };

        if (type && type !== 'ALL') {
            if (type === 'TRANSFER') {
                where.type = { in: ['TRANSFER_IN', 'TRANSFER_OUT'] };
            } else {
                where.type = type;
            }
        }

        if (accountId) {
            where.OR = [
                { accountId },
                { fromAccountId: accountId },
                { toAccountId: accountId }
            ];
        }

        if (query) {
            where.description = { contains: query, mode: 'insensitive' };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                account: { select: { name: true, type: true } },
                fromAccount: { select: { name: true } },
                toAccount: { select: { name: true } },
                customer: { select: { name: true } },
                vendor: { select: { name: true } }
            },
            orderBy: { transactionDate: 'desc' }
        });

        return NextResponse.json({ transactions });
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ message: 'Error fetching transactions', error: error.message }, { status: 500 });
    }
}

// POST: Add manual transaction and atomically update account balances
export async function POST(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const body = await request.json();
        const { amount, type, description, note, transactionDate, accountId, fromAccountId, toAccountId, reference, customerId, vendorId } = body;

        const txAmount = parseFloat(amount);
        if (isNaN(txAmount) || txAmount <= 0) {
            return NextResponse.json({ message: 'Qadarku waa inuu ahaadaa tiro ka weyn eber.' }, { status: 400 });
        }

        const date = transactionDate ? new Date(transactionDate) : new Date();

        // Perform balance updates atomically using prisma transaction block
        const transactionResult = await prisma.$transaction(async (tx) => {
            // 1. Log Transaction(s)
            if (type === 'TRANSFER') {
                // OUT transaction for Source
                await tx.transaction.create({
                    data: {
                        companyId,
                        amount: txAmount,
                        type: 'TRANSFER_OUT',
                        description: `${description}${reference ? ` (Ref: ${reference})` : ''}`,
                        note,
                        transactionDate: date,
                        accountId: fromAccountId || null,
                        fromAccountId: fromAccountId || null,
                        toAccountId: toAccountId || null,
                        userId
                    }
                });

                // IN transaction for Destination
                await tx.transaction.create({
                    data: {
                        companyId,
                        amount: txAmount,
                        type: 'TRANSFER_IN',
                        description: `${description}${reference ? ` (Ref: ${reference})` : ''}`,
                        note,
                        transactionDate: date,
                        accountId: toAccountId || null,
                        fromAccountId: fromAccountId || null,
                        toAccountId: toAccountId || null,
                        userId
                    }
                });
            } else {
                await tx.transaction.create({
                    data: {
                        companyId,
                        amount: txAmount,
                        type: type as any,
                        description: `${description}${reference ? ` (Ref: ${reference})` : ''}`,
                        note,
                        transactionDate: date,
                        accountId: accountId || null,
                        userId,
                        customerId: customerId || null,
                        vendorId: vendorId || null
                    }
                });
            }

            // 2. Adjust Balances
            if ((type === 'INCOME' || type === 'DEBT_TAKEN' || type === 'DEBT_RECEIVED') && accountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: txAmount } }
                });
            } else if ((type === 'EXPENSE' || type === 'DEBT_GIVEN' || type === 'DEBT_REPAID') && accountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: txAmount } }
                });
            } else if (type === 'TRANSFER' && fromAccountId && toAccountId) {
                // Deduct from Source
                await tx.account.update({
                    where: { id: fromAccountId },
                    data: { balance: { decrement: txAmount } }
                });
                // Add to Destination
                await tx.account.update({
                    where: { id: toAccountId },
                    data: { balance: { increment: txAmount } }
                });
            }

            return { success: true };
        });

        return NextResponse.json({ 
            success: true, 
            transaction: transactionResult, 
            message: 'Transaction-ka waa la diiwaangeliyey, kontonadiina waa la cusboonaysiiyey!' 
        });
    } catch (error: any) {
        console.error('Error creating manual transaction:', error);
        return NextResponse.json({ message: 'Error creating transaction', error: error.message }, { status: 500 });
    }
}
