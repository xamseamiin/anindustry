const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Analyzing DEBT_TAKEN transactions...");

  const txs = await prisma.transaction.findMany({
    where: { companyId, type: 'DEBT_TAKEN' }
  });

  txs.forEach((t, i) => {
    console.log(`${i+1}. Amount: ${t.amount}, AccountId: ${t.accountId}, Category: ${t.category}, Description: ${t.description || ''}, Date: ${t.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
