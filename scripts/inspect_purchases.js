const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const expenses = await prisma.expense.findMany({
        take: 50
    });
    console.log("All Expenses IDs and Descriptions:");
    expenses.forEach(e => {
        console.log(`ID: ${JSON.stringify(e.id)} | Desc: ${e.description}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
