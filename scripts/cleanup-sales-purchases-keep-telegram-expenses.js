const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_COMPANY_ID = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const companyId = process.env.TELEGRAM_COMPANY_ID || process.env.COMPANY_ID || DEFAULT_COMPANY_ID;
const shouldApply = process.argv.includes('--apply');

const inflowTypes = new Set(['INCOME', 'DEBT_TAKEN', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT']);
const outflowTypes = new Set(['EXPENSE', 'DEBT_GIVEN', 'DEBT_REPAID', 'TRANSFER_OUT']);

function jsonSafe(value) {
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === 'bigint') return item.toString();
    if (item && typeof item === 'object' && typeof item.toNumber === 'function') return item.toNumber();
    return item;
  }, 2);
}

function signedAccountEffect(transaction) {
  if (!transaction.accountId) return 0;
  const amount = Math.abs(Number(transaction.amount || 0));
  if (inflowTypes.has(transaction.type)) return amount;
  if (outflowTypes.has(transaction.type)) return -amount;
  return 0;
}

function sumBy(rows, keyFn, valueFn) {
  const result = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    result.set(key, (result.get(key) || 0) + valueFn(row));
  }
  return result;
}

async function collectSnapshot() {
  const sales = await prisma.sale.findMany({
    where: { companyId },
    include: { items: true, customer: true, account: true },
    orderBy: { createdAt: 'asc' }
  });

  const saleInvoiceNumbers = sales.map((sale) => sale.invoiceNumber);
  const saleTransactions = saleInvoiceNumbers.length > 0
    ? await prisma.transaction.findMany({
        where: {
          companyId,
          type: 'INCOME',
          OR: [
            {
              description: {
                in: saleInvoiceNumbers.flatMap((invoice) => [`Iibka ${invoice}`, `Iibka #${invoice}`])
              }
            },
            ...saleInvoiceNumbers.map((invoice) => ({
              description: { contains: invoice }
            }))
          ]
        },
        orderBy: { createdAt: 'asc' }
      })
    : [];

  const materialPurchases = await prisma.materialPurchase.findMany({
    where: { companyId },
    include: { vendor: true },
    orderBy: { purchaseDate: 'asc' }
  });

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { companyId },
    include: {
      items: true,
      vendor: true,
      expenses: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const materialVendorIds = [...new Set(materialPurchases.map((purchase) => purchase.vendorId).filter(Boolean))];
  const purchaseVendorIds = [...new Set(purchaseOrders.map((order) => order.vendorId).filter(Boolean))];
  const purchaseInvoiceNumbers = [...new Set([
    ...materialPurchases.map((purchase) => purchase.invoiceNumber || 'N/A'),
    ...purchaseOrders.map((order) => order.poNumber || 'N/A')
  ])];

  const purchaseTransactions = await prisma.transaction.findMany({
    where: {
      companyId,
      OR: [
        { category: { in: ['Material Purchase', 'Material Purchase Debt', 'Material Purchase Debt Payment', 'Purchase Debt Payment', 'Purchase Order', 'Purchase Payment'] } },
        { description: { startsWith: 'Material Purchase Payment' } },
        { description: { startsWith: 'Unpaid Material Purchase' } },
        { description: { startsWith: 'Debt payment for' } },
        materialVendorIds.length ? { vendorId: { in: materialVendorIds } } : undefined,
        purchaseVendorIds.length ? { vendorId: { in: purchaseVendorIds } } : undefined,
        purchaseInvoiceNumbers.length ? {
          OR: purchaseInvoiceNumbers.map((invoice) => ({
            description: { contains: `Inv: ${invoice}` }
          }))
        } : undefined
      ].filter(Boolean)
    },
    orderBy: { createdAt: 'asc' }
  });

  const telegramExpenses = await prisma.expense.findMany({
    where: {
      companyId,
      OR: [
        { telegramMessageId: { not: null } },
        { telegramChatId: { not: null } },
        { note: { contains: '[Telegram' } },
        { note: { contains: '[Dalbaday:' } }
      ]
    },
    include: { account: true },
    orderBy: { createdAt: 'asc' }
  });

  const nonTelegramExpenses = await prisma.expense.findMany({
    where: {
      companyId,
      NOT: {
        OR: [
          { telegramMessageId: { not: null } },
          { telegramChatId: { not: null } },
          { note: { contains: '[Telegram' } },
          { note: { contains: '[Dalbaday:' } }
        ]
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const accounts = await prisma.account.findMany({
    where: { companyId },
    orderBy: { name: 'asc' }
  });

  const factoryMaterials = await prisma.factoryMaterial.findMany({
    where: { companyId },
    orderBy: { name: 'asc' }
  });

  return {
    companyId,
    exportedAt: new Date().toISOString(),
    sales,
    saleTransactions,
    materialPurchases,
    purchaseOrders,
    purchaseTransactions,
    telegramExpenses,
    nonTelegramExpenses,
    accounts,
    factoryMaterials
  };
}

function summarize(snapshot) {
  const saleQuantity = snapshot.sales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0),
    0
  );
  const salePaid = snapshot.sales.reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0);
  const saleTransactionAmount = snapshot.saleTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const purchaseTotal = snapshot.materialPurchases.reduce((sum, purchase) => sum + Number(purchase.totalPrice || 0), 0);
  const purchasePaid = snapshot.materialPurchases.reduce((sum, purchase) => sum + Number(purchase.paidAmount || 0), 0);
  const purchaseTransactionAmount = snapshot.purchaseTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return {
    companyId: snapshot.companyId,
    apply: shouldApply,
    backupRequired: true,
    sales: snapshot.sales.length,
    saleItemsQuantityToRestore: saleQuantity,
    salePaidAmount: salePaid,
    saleTransactionsToDelete: snapshot.saleTransactions.length,
    saleTransactionAmountToReverse: saleTransactionAmount,
    materialPurchases: snapshot.materialPurchases.length,
    materialPurchaseTotal: purchaseTotal,
    materialPurchasePaidAmount: purchasePaid,
    purchaseOrders: snapshot.purchaseOrders.length,
    purchaseTransactionsToDelete: snapshot.purchaseTransactions.length,
    purchaseTransactionAmount: purchaseTransactionAmount,
    telegramExpensesKept: snapshot.telegramExpenses.length,
    nonTelegramExpensesFound: snapshot.nonTelegramExpenses.length,
    accountsSnapshotted: snapshot.accounts.length,
    factoryMaterialsSnapshotted: snapshot.factoryMaterials.length
  };
}

function writeBackup(snapshot) {
  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `cleanup-sales-purchases-${stamp}.json`);
  fs.writeFileSync(backupPath, jsonSafe(snapshot));
  return backupPath;
}

async function applyCleanup(snapshot) {
  const saleIds = snapshot.sales.map((sale) => sale.id);
  const saleTransactionIds = snapshot.saleTransactions.map((transaction) => transaction.id);
  const materialPurchaseIds = snapshot.materialPurchases.map((purchase) => purchase.id);
  const purchaseOrderIds = snapshot.purchaseOrders.map((order) => order.id);
  const purchaseTransactionIds = snapshot.purchaseTransactions.map((transaction) => transaction.id);

  const saleStockByProduct = sumBy(
    snapshot.sales.flatMap((sale) => sale.items),
    (item) => item.productId,
    (item) => Number(item.quantity || 0)
  );

  const purchaseStockByName = sumBy(
    snapshot.materialPurchases,
    (purchase) => purchase.materialName,
    (purchase) => Number(purchase.quantity || 0)
  );

  const allMoneyTransactions = [
    ...snapshot.saleTransactions,
    ...snapshot.purchaseTransactions.filter((transaction) => !saleTransactionIds.includes(transaction.id))
  ];

  const accountReversals = sumBy(
    allMoneyTransactions,
    (transaction) => transaction.accountId,
    (transaction) => -signedAccountEffect(transaction)
  );

  return prisma.$transaction(async (tx) => {
    for (const [productId, quantity] of saleStockByProduct) {
      await tx.factoryMaterial.update({
        where: { id: productId },
        data: { inStock: { increment: quantity } }
      });
    }

    for (const [materialName, quantity] of purchaseStockByName) {
      await tx.factoryMaterial.updateMany({
        where: { companyId, name: materialName },
        data: { inStock: { decrement: quantity } }
      });
    }

    for (const [accountId, amount] of accountReversals) {
      if (amount === 0) continue;
      await tx.account.update({
        where: { id: accountId },
        data: amount > 0
          ? { balance: { increment: amount } }
          : { balance: { decrement: Math.abs(amount) } }
      });
    }

    const deletedSaleTransactions = saleTransactionIds.length
      ? await tx.transaction.deleteMany({ where: { id: { in: saleTransactionIds }, companyId } })
      : { count: 0 };

    const uniquePurchaseTransactionIds = purchaseTransactionIds.filter((id) => !saleTransactionIds.includes(id));
    const deletedPurchaseTransactions = uniquePurchaseTransactionIds.length
      ? await tx.transaction.deleteMany({ where: { id: { in: uniquePurchaseTransactionIds }, companyId } })
      : { count: 0 };

    const deletedSales = saleIds.length
      ? await tx.sale.deleteMany({ where: { id: { in: saleIds }, companyId } })
      : { count: 0 };

    const deletedPurchaseOrders = purchaseOrderIds.length
      ? await tx.purchaseOrder.deleteMany({ where: { id: { in: purchaseOrderIds }, companyId } })
      : { count: 0 };

    const deletedMaterialPurchases = materialPurchaseIds.length
      ? await tx.materialPurchase.deleteMany({ where: { id: { in: materialPurchaseIds }, companyId } })
      : { count: 0 };

    return {
      deletedSales: deletedSales.count,
      deletedSaleTransactions: deletedSaleTransactions.count,
      deletedMaterialPurchases: deletedMaterialPurchases.count,
      deletedPurchaseOrders: deletedPurchaseOrders.count,
      deletedPurchaseTransactions: deletedPurchaseTransactions.count,
      saleStockProductsRestored: saleStockByProduct.size,
      purchaseStockMaterialsReversed: purchaseStockByName.size,
      accountBalancesAdjusted: accountReversals.size
    };
  }, { maxWait: 10000, timeout: 60000 });
}

async function main() {
  const snapshot = await collectSnapshot();
  const summary = summarize(snapshot);
  console.log(jsonSafe({ step: shouldApply ? 'pre-apply-summary' : 'dry-run-summary', ...summary }));

  if (!shouldApply) {
    console.log('Dry run only. Re-run with --apply to write backup and delete the data.');
    return;
  }

  const backupPath = writeBackup(snapshot);
  const result = await applyCleanup(snapshot);
  const after = await collectSnapshot();

  console.log(jsonSafe({
    success: true,
    backupPath,
    result,
    after: summarize(after)
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
