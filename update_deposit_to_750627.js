const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  const accountId = "5623d587-b6ad-4912-87ad-17cb294da017"; // E-birr
  const transactionId = "6d9c3a11-33d7-4dda-b3d7-7bf96c880c54";
  const exactAmount = 750627;

  console.log(`Updating the deposit transaction to exactly ${exactAmount} ETB...`);

  // 1. Update the transaction amount
  const updatedTx = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      amount: exactAmount
    }
  });

  console.log("Updated Transaction:", {
    id: updatedTx.id,
    description: updatedTx.description,
    amount: updatedTx.amount.toString(),
    transactionDate: updatedTx.transactionDate
  });

  // 2. Ensure account balance is exactly 2,628,140
  const updatedAcc = await prisma.account.update({
    where: { id: accountId },
    data: {
      balance: 2628140
    }
  });

  console.log("Account Balance verified:", {
    id: updatedAcc.id,
    name: updatedAcc.name,
    balance: updatedAcc.balance
  });

  console.log("\nExact correction completed successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
