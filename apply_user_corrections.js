const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  const accountId = "5623d587-b6ad-4912-87ad-17cb294da017"; // E-birr
  const transactionId = "6d9c3a11-33d7-4dda-b3d7-7bf96c880c54";
  const targetDate = new Date("2026-04-25T12:00:00Z");

  console.log("Applying user accounting corrections...");

  // 1. Update the 750k transaction
  console.log(`Updating transaction ${transactionId} date and description...`);
  const updatedTx = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      description: "hadhaagii xisaabxidhkii hore",
      transactionDate: targetDate,
      createdAt: targetDate
    }
  });

  console.log("Updated Transaction:", {
    id: updatedTx.id,
    description: updatedTx.description,
    amount: updatedTx.amount,
    transactionDate: updatedTx.transactionDate,
    createdAt: updatedTx.createdAt
  });

  // 2. Set the E-birr account balance back to exactly 2,628,140
  console.log(`Setting E-birr account balance to exactly 2,628,140...`);
  const updatedAcc = await prisma.account.update({
    where: { id: accountId },
    data: {
      balance: 2628140
    }
  });

  console.log("Updated Account:", {
    id: updatedAcc.id,
    name: updatedAcc.name,
    balance: updatedAcc.balance
  });

  console.log("\nAll user corrections applied successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
