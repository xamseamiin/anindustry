const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const accountId = 'e2124894-d151-432d-90c4-9e5025b71fb9';

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (!account || account.name !== 'E-Birr Merchant') {
      throw new Error('The expected E-Birr Merchant account was not found.');
    }

    const transactions = await tx.transaction.findMany({ where: { accountId } });
    const inflowTypes = new Set(['INCOME', 'DEBT_TAKEN', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT']);
    const outflowTypes = new Set(['EXPENSE', 'DEBT_GIVEN', 'TRANSFER_OUT']);

    const calculatedBalance = transactions.reduce((balance, entry) => {
      const amount = Math.abs(Number(entry.amount));
      if (inflowTypes.has(entry.type)) return balance + amount;
      if (outflowTypes.has(entry.type)) return balance - amount;
      if (entry.type === 'DEBT_REPAID') {
        return balance + ((!entry.vendorId && !entry.expenseId) ? amount : -amount);
      }
      return balance;
    }, 0);

    const updated = await tx.account.update({
      where: { id: accountId },
      data: { balance: calculatedBalance }
    });

    return {
      account: updated.name,
      previousBalance: Number(account.balance),
      correctedBalance: Number(updated.balance),
      ledgerEntries: transactions.length
    };
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
