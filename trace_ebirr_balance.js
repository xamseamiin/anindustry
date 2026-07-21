const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  const accountId = "5623d587-b6ad-4912-87ad-17cb294da017"; // E-birr
  console.log("Tracing E-birr balance changes chronologically...");

  const txs = await prisma.transaction.findMany({
    where: { companyId, accountId },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total transactions on E-birr: ${txs.length}`);
  
  let calculatedBalance = 0;
  txs.forEach((t, i) => {
    const prev = calculatedBalance;
    let change = 0;
    if (t.type === 'INCOME' || t.type === 'DEBT_TAKEN' || t.type === 'DEBT_RECEIVED') {
      change = Number(t.amount);
      calculatedBalance += change;
    } else if (t.type === 'EXPENSE' || t.type === 'DEBT_GIVEN' || t.type === 'DEBT_REPAID') {
      change = -Number(t.amount);
      calculatedBalance += change;
    }
    console.log(`${i+1}. Date: ${t.createdAt.toISOString().slice(0,10)}, Type: ${t.type}, Amount: ${change > 0 ? '+' : ''}${change}, Balance: ${prev} -> ${calculatedBalance}, Desc: ${t.description || ''}`);
  });

  console.log("\nFinal Calculated Balance:", calculatedBalance);
  
  const actualAccount = await prisma.account.findUnique({ where: { id: accountId } });
  console.log("Actual Account Balance in DB:", actualAccount.balance);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
