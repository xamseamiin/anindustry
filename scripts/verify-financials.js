const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== Verifying Profit and Loss Reports Calculations (with COGS subtracted from Net Profit) ===");
    const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2'; // An industry.

    // 1. Sales
    const sales = await prisma.sale.findMany({
        where: { companyId, status: { not: 'Refunded' } },
        include: {
            items: true
        }
    });
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
    const outstandingDebt = totalRevenue - totalPaid;

    // 2. Expenses (All from Expense table)
    const expenses = await prisma.expense.findMany({
        where: { companyId }
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // 3. COGS
    const cogs = sales.reduce((sum, s) => {
        return sum + s.items.reduce((iSum, item) => {
            return iSum + Number(item.totalCost || 0);
        }, 0);
    }, 0);

    // 4. Net Profit = Revenue - COGS - Expenses
    const netProfit = totalRevenue - cogs - totalExpenses;

    console.log("Results:");
    console.log("Total Revenue (Sales):", totalRevenue);
    console.log("Total Paid (Sales):", totalPaid);
    console.log("Outstanding Debt:", outstandingDebt);
    console.log("COGS (Product cost):", cogs);
    console.log("Total Expenses (including Salaries):", totalExpenses);
    console.log("Net Profit:", netProfit);
    
    // Check if totalExpenses matches the sum of listed expenses
    const expectedSum = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (totalExpenses === expectedSum) {
        console.log("✅ Verification successful! Calculations match perfectly.");
    } else {
        console.log("❌ Verification failed. Calculations do not match.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
