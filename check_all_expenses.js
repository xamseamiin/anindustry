const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Analyzing all transactions for company:", companyId);

  const txs = await prisma.transaction.findMany({
    where: { companyId }
  });

  console.log(`Total transactions count: ${txs.length}`);
  
  // Group by type and count/sum
  const groups = {};
  txs.forEach(t => {
    if (!groups[t.type]) {
      groups[t.type] = { count: 0, sum: 0, withAccount: 0, withoutAccount: 0 };
    }
    groups[t.type].count++;
    groups[t.type].sum += Number(t.amount);
    if (t.accountId) {
      groups[t.type].withAccount++;
    } else {
      groups[t.type].withoutAccount++;
    }
  });

  console.log("Groups summary:", groups);

  // List all EXPENSE transactions
  console.log("\nEXPENSE Transactions list:");
  const expenseTxs = txs.filter(t => t.type === 'EXPENSE');
  expenseTxs.forEach((t, i) => {
    console.log(`${i+1}. Amount: ${t.amount}, AccountId: ${t.accountId}, Category: ${t.category}, Description: ${t.description || ''}, Date: ${t.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
