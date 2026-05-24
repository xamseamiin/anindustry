import prisma from '@/lib/db';

export async function recalculateAccountBalance(accountId: string, upToDate?: Date) {
    if (!accountId) return;

    const whereClause: any = {
        OR: [
            { accountId: accountId },
            { fromAccountId: accountId },
            { toAccountId: accountId }
        ]
    };

    if (upToDate) {
        whereClause.transactionDate = { lte: upToDate };
    }

    const rawTransactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' }
        ]
    });

    let currentBalance = 0;

    rawTransactions.forEach((trx) => {
        const amount = Math.abs(Number(trx.amount));

        // 1. Unified Transfer Logic (For new single-record transfers)
        if (!trx.accountId) {
            if (trx.toAccountId === accountId) {
                currentBalance += amount;
            } else if (trx.fromAccountId === accountId) {
                currentBalance -= amount;
            }
            return;
        }

        // 2. Standard Logic (For non-transfers and OLD dual-record transfers)
        // CRITICAL: We only process the record if the accountId matches the ledger account.
        // This prevents double-counting old transfer pairs.
        if (trx.accountId !== accountId) return;

        const isStandardIn = [
            'INCOME',
            'DEBT_RECEIVED',
            'TRANSFER_IN',
            'SHAREHOLDER_DEPOSIT'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && (!trx.vendorId && !trx.expenseId && !(trx.description && trx.description.includes('Flipped to Outflow'))));

        const isStandardOut = [
            'EXPENSE',
            'DEBT_GIVEN',
            'DEBT_TAKEN',
            'TRANSFER_OUT',
            'SALARY'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && (!!trx.vendorId || !!trx.expenseId || (trx.description && trx.description.includes('Flipped to Outflow'))));

        if (isStandardIn) {
            currentBalance += amount;
        } else if (isStandardOut) {
            currentBalance -= amount;
        }
    });

    // Only update the account record if we're calculating the current (non-historical) balance
    if (!upToDate) {
        await prisma.account.update({
            where: { id: accountId },
            data: { balance: currentBalance }
        });
    }

    return currentBalance;
}

export async function updateExpenseStatus(expenseId: string) {
    if (!expenseId) return;

    const expense = await prisma.expense.findUnique({
        where: { id: expenseId }
    });

    if (!expense) return;

    // Calculate total amount paid for this expense from all transactions
    const relatedTransactions = await prisma.transaction.findMany({
        where: {
            expenseId: expenseId,
            type: { in: ['EXPENSE', 'DEBT_REPAID'] }
        }
    });

    const totalPaid = relatedTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const expAmount = Number(expense.amount || 0);

    let newStatus = 'UNPAID';
    if (expAmount > 0 && totalPaid >= expAmount) {
        newStatus = 'PAID';
    } else if (totalPaid > 0 && totalPaid < expAmount) {
        newStatus = 'PARTIAL';
    }

    // Update expense record
    return await prisma.expense.update({
        where: { id: expenseId },
        data: { 
            paymentStatus: newStatus,
            // We could also store paidAmount if we had that field, but we rely on transactions
        }
    });
}

export async function updateProjectAdvancePaid(projectId: string) {
    if (!projectId) return;

    // Sum all transactions linked to this project that are advance payments
    // We now count all INCOME records linked to the project, regardless of name, to prevent data loss.
    const advanceTransactions = await prisma.transaction.findMany({
        where: {
            projectId: projectId,
            type: 'INCOME'
        }
    });

    const totalAdvance = advanceTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return;

    const agreementAmount = Number(project.agreementAmount || 0);
    const remainingAmount = agreementAmount - totalAdvance;

    return await prisma.project.update({
        where: { id: projectId },
        data: {
            advancePaid: totalAdvance,
            remainingAmount: remainingAmount
        }
    });
}

export async function updateEmployeeSalaryStats(employeeId: string) {
    if (!employeeId) return;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sum all salary-related transactions for this employee THIS MONTH
    const monthlyTransactions = await prisma.transaction.findMany({
        where: {
            employeeId: employeeId,
            transactionDate: { gte: startOfMonth },
            OR: [
                { type: 'EXPENSE' },
                { type: 'DEBT_REPAID' }
            ],
            // Only count if it's salary related or linked to a salary expense
            // For now, if it's linked to the employee, we treat it as salary payment
        }
    });

    const totalPaidThisMonth = monthlyTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

    // Update last payment date if any
    const lastTrx = await prisma.transaction.findFirst({
        where: { employeeId: employeeId },
        orderBy: { transactionDate: 'desc' }
    });

    return await prisma.employee.update({
        where: { id: employeeId },
        data: {
            salaryPaidThisMonth: totalPaidThisMonth,
            lastPaymentDate: lastTrx?.transactionDate || null
        }
    });
}

export async function checkFinancialPeriod(companyId: string, date: Date) {
    if (!companyId || !date) return true; // allow if no context

    const period = await prisma.financialPeriod.findFirst({
        where: {
            companyId: companyId,
            startDate: { lte: date },
            endDate: { gte: date },
            isClosed: true
        }
    });

    if (period) {
        return false; // Period is closed, modification NOT allowed
    }
    return true; // Modification allowed
}

