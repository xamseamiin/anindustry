const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const accountId = '5623d587-b6ad-4912-87ad-17cb294da017';

function jsonSafe(value) {
  return JSON.stringify(value, (_key, item) => {
    if (item && typeof item === 'object' && typeof item.toNumber === 'function') return item.toNumber();
    return item;
  }, 2);
}

async function main() {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('E-birr account not found.');
  if (account.name !== 'E-birr') throw new Error(`Refusing cleanup: expected E-birr, found ${account.name}.`);

  const transactions = await prisma.transaction.findMany({
    where: { accountId },
    orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }]
  });

  const expenseIds = [...new Set(transactions.map((transaction) => transaction.expenseId).filter(Boolean))];
  const linkedExpensesSnapshot = expenseIds.length
    ? await prisma.expense.findMany({ where: { id: { in: expenseIds } }, orderBy: { createdAt: 'asc' } })
    : [];

  const merchantSnapshot = await prisma.account.findFirst({
    where: { companyId: account.companyId, name: 'E-Birr Merchant' },
    select: { id: true, name: true, balance: true }
  });

  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `clean-ebirr-account-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );

  fs.writeFileSync(backupPath, jsonSafe({
    exportedAt: new Date().toISOString(),
    reason: 'Clean all E-birr account movements and zero the account. E-Birr Merchant is not changed.',
    account,
    merchantSnapshot,
    transactions,
    linkedExpensesSnapshot
  }));

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.transaction.deleteMany({ where: { accountId } });
    const updated = await tx.account.update({
      where: { id: accountId },
      data: { balance: 0 },
      select: { id: true, name: true, balance: true, isActive: true }
    });
    return { deletedTransactions: deleted.count, updated };
  });

  const remainingTransactions = await prisma.transaction.count({ where: { accountId } });
  const merchantAfter = merchantSnapshot
    ? await prisma.account.findUnique({
        where: { id: merchantSnapshot.id },
        select: { id: true, name: true, balance: true }
      })
    : null;

  console.log(jsonSafe({
    success: true,
    backupPath,
    result,
    remainingTransactions,
    merchantBefore: merchantSnapshot,
    merchantAfter
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
