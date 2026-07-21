const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  const accountId = "5623d587-b6ad-4912-87ad-17cb294da017"; // E-birr

  const ebirr = await prisma.account.findUnique({ where: { id: accountId } });
  console.log(`Current E-birr Balance in Account Table: ${ebirr.balance}`);

  // Fetch all transactions on E-birr
  const txs = await prisma.transaction.findMany({
    where: { companyId, accountId },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total transactions on E-birr: ${txs.length}`);

  // We will trace the balance step-by-step
  let runningBalance = 0;
  let incomeSum = 0;
  let expenseSum = 0;
  let debtTakenSum = 0;

  console.log("\nSummary of transactions by type:");
  txs.forEach(t => {
    const amt = Number(t.amount);
    if (t.type === 'INCOME') {
      incomeSum += amt;
    } else if (t.type === 'EXPENSE') {
      expenseSum += amt;
    } else if (t.type === 'DEBT_TAKEN') {
      debtTakenSum += amt;
    }
  });

  console.log(`- INCOME transactions sum: ${incomeSum}`);
  console.log(`- EXPENSE transactions sum: ${expenseSum}`);
  console.log(`- DEBT_TAKEN transactions sum: ${debtTakenSum}`);
  
  console.log(`\nIf we sum: INCOME (${incomeSum}) + DEBT_TAKEN (${debtTakenSum}) - EXPENSE (${expenseSum}) = ${incomeSum + debtTakenSum - expenseSum}`);
  console.log(`Difference (Account Balance - Sum): ${ebirr.balance - (incomeSum + debtTakenSum - expenseSum)}`);

  // Let's check if the Account Balance is exactly equal to the sum of INCOME transactions
  console.log(`Account Balance: ${ebirr.balance}`);
  console.log(`Is Account Balance equal to INCOME transactions? ${ebirr.balance === incomeSum}`);
  console.log(`Is Account Balance equal to INCOME minus reverts? (Reverts = 9300): ${ebirr.balance === (incomeSum - 9300)}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
