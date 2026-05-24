import prisma from './db';

export interface FiscalYearCloseResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Close a fiscal year and perform necessary operations
 */
export async function closeFiscalYear(
  fiscalYearId: string,
  companyId: string
): Promise<FiscalYearCloseResult> {
  try {
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the fiscal year
      const fiscalYear = await tx.fiscalYear.findFirst({
        where: {
          id: fiscalYearId,
          companyId: companyId,
        },
      });

      if (!fiscalYear) {
        throw new Error('Fiscal year not found');
      }

      if (fiscalYear.status === 'CLOSED') {
        throw new Error('Fiscal year is already closed');
      }

      // 2. Get all transactions for this fiscal year
      const transactions = await tx.transaction.findMany({
        where: {
          fiscalYearId: fiscalYearId,
          companyId: companyId,
        },
      });

      // 3. Calculate total income and expenses
      const totalIncome = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const netProfit = totalIncome - totalExpenses;

      // 4. Get or create Equity account
      let equityAccount = await tx.account.findFirst({
        where: {
          companyId: companyId,
          name: 'Equity',
          type: 'EQUITY',
        },
      });

      if (!equityAccount) {
        equityAccount = await tx.account.create({
          data: {
            name: 'Equity',
            type: 'EQUITY',
            balance: 0,
            companyId: companyId,
          },
        });
      }

      // 5. Create closing entries
      if (netProfit > 0) {
        // Create income closing entry
        await tx.transaction.create({
          data: {
            description: `Closing entry - Income for ${fiscalYear.year}`,
            amount: -totalIncome, // Negative to close income accounts
            type: 'TRANSFER_OUT',
            companyId: companyId,
            accountId: equityAccount.id,
            fiscalYearId: fiscalYearId,
            transactionDate: fiscalYear.endDate,
          },
        });

        // Create expense closing entry
        await tx.transaction.create({
          data: {
            description: `Closing entry - Expenses for ${fiscalYear.year}`,
            amount: totalExpenses, // Positive to close expense accounts
            type: 'TRANSFER_IN',
            companyId: companyId,
            accountId: equityAccount.id,
            fiscalYearId: fiscalYearId,
            transactionDate: fiscalYear.endDate,
          },
        });
      } else {
        // Create loss entry
        await tx.transaction.create({
          data: {
            description: `Closing entry - Net Loss for ${fiscalYear.year}`,
            amount: Math.abs(netProfit),
            type: 'EXPENSE',
            companyId: companyId,
            accountId: equityAccount.id,
            fiscalYearId: fiscalYearId,
            transactionDate: fiscalYear.endDate,
          },
        });
      }

      // 6. Update fiscal year status
      const updatedFiscalYear = await tx.fiscalYear.update({
        where: {
          id: fiscalYearId,
        },
        data: {
          status: 'CLOSED',
        },
      });

      return {
        fiscalYear: updatedFiscalYear,
        totalIncome,
        totalExpenses,
        netProfit,
        transactionsCount: transactions.length,
      };
    });

    return {
      success: true,
      message: `Sano maaliyadeed ${result.fiscalYear.year} waa la xirey. Faa'iidada guud: $${result.netProfit.toFixed(2)}`,
      data: result,
    };
  } catch (error) {
    console.error('Error closing fiscal year:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Qalad ayaa dhacay marka la xireyay sano maaliyadeed',
    };
  }
}

/**
 * Create a new fiscal year
 */
export async function createFiscalYear(
  year: number,
  startDate: Date,
  endDate: Date,
  companyId: string,
  description?: string
): Promise<FiscalYearCloseResult> {
  try {
    // Check if fiscal year already exists
    const existingFiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        year: year,
        companyId: companyId,
      },
    });

    if (existingFiscalYear) {
      return {
        success: false,
        message: 'Sano maaliyadeed waa la abuuray hore',
      };
    }

    // Create new fiscal year
    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        year: year,
        startDate: startDate,
        endDate: endDate,
        description: description,
        companyId: companyId,
        status: 'ACTIVE',
      },
    });

    return {
      success: true,
      message: `Sano maaliyadeed ${year} waa la abuuray`,
      data: fiscalYear,
    };
  } catch (error) {
    console.error('Error creating fiscal year:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Qalad ayaa dhacay marka la abuurayay sano maaliyadeed',
    };
  }
}

/**
 * Get fiscal year summary
 */
export async function getFiscalYearSummary(
  fiscalYearId: string,
  companyId: string
) {
  try {
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        id: fiscalYearId,
        companyId: companyId,
      },
    });

    if (!fiscalYear) {
      throw new Error('Fiscal year not found');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        fiscalYearId: fiscalYearId,
        companyId: companyId,
      },
    });

    const projects = await prisma.project.findMany({
      where: {
        fiscalYearId: fiscalYearId,
        companyId: companyId,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        fiscalYearId: fiscalYearId,
        companyId: companyId,
      },
    });

    const payments = await prisma.payment.findMany({
      where: {
        fiscalYearId: fiscalYearId,
        project: {
          companyId: companyId,
        },
      },
    });

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = totalIncome - totalExpenses;

    return {
      fiscalYear,
      summary: {
        totalTransactions: transactions.length,
        totalProjects: projects.length,
        totalExpensesCount: expenses.length,
        totalPayments: payments.length,
        totalIncome,
        totalExpenses,
        netProfit,
      },
    };
  } catch (error) {
    console.error('Error getting fiscal year summary:', error);
    throw error;
  }
}

