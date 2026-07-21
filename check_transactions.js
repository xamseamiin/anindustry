const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Checking DB Transactions detail...");

  // Get accounts
  const accounts = await prisma.account.findMany({ where: { companyId } });
  console.log("Accounts:", accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance })));

  // Get transactions with accounts
  const txs = await prisma.transaction.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  console.log("\nLast 30 Transactions:");
  txs.forEach(t => {
    console.log(`Date: ${t.createdAt.toISOString().slice(0,10)}, Type: ${t.type}, Amount: ${t.amount}, AccountId: ${t.accountId}, Category: ${t.category}, Description: ${t.description || ''}`);
  });

  // Calculate sum of transactions per account
  console.log("\nSum of Transactions per Account:");
  const allTxs = await prisma.transaction.findMany({ where: { companyId } });
  const accountSums = {};
  allTxs.forEach(t => {
    if (!accountSums[t.accountId]) {
      accountSums[t.accountId] = { INCOME: 0, EXPENSE: 0, DEBT_TAKEN: 0, DEBT_GIVEN: 0, DEBT_REPAID: 0, DEBT_RECEIVED: 0 };
    }
    const type = t.type;
    accountSums[t.accountId][type] = (accountSums[t.accountId][type] || 0) + Number(t.amount);
  });

  for (const accountId in accountSums) {
    const acc = accounts.find(a => a.id === accountId);
    console.log(`\nAccount: ${acc ? acc.name : accountId}`);
    console.log(accountSums[accountId]);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
