const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== Inspecting Expenses for An industry. ===");
    const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2'; // An industry.

    const expenses = await prisma.expense.findMany({
        where: { companyId }
    });

    console.log(`Total expenses found: ${expenses.length}`);
    const categories = {};
    for (const e of expenses) {
        const cat = e.category;
        categories[cat] = (categories[cat] || 0) + Number(e.amount);
        console.log(`- Date: ${e.expenseDate.toISOString().split('T')[0]}, Cat: ${e.category}, Amt: ${e.amount}, Desc: ${e.description}`);
    }

    console.log("\nSum by category:");
    console.log(JSON.stringify(categories, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
