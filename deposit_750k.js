const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  const accountId = "5623d587-b6ad-4912-87ad-17cb294da017"; // E-birr
  const amount = 750000;

  console.log(`Depositing ${amount} ETB into E-birr account sequentially...`);

  // 1. Fetch current account state
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    console.log("Account E-birr not found!");
    return;
  }
  console.log("Before deposit - Balance:", account.balance);

  // 2. Increment account balance
  const updatedAcc = await prisma.account.update({
    where: { id: accountId },
    data: {
      balance: { increment: amount }
    }
  });
  console.log("Account balance updated successfully. New Balance:", updatedAcc.balance);

  // 3. Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      companyId,
      amount,
      type: 'INCOME',
      description: 'Deposit/Ku shubid KMG ah (Correction/Suspense)',
      note: '750k deposit to E-birr requested by admin to correct/fund June 7 transactions',
      transactionDate: new Date(),
      accountId
    }
  });

  console.log("Deposit completed successfully!");
  console.log("Created Transaction ID:", transaction.id);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
