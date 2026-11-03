require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COMPANY_ID = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const CUSTOMER_ID = '883ffa21-3188-4d5d-a85d-faf5fadbd55b';
const VENDOR_ID = '8f1a48ef-faa6-4d0a-9ea7-db5a97afcf4e';
const CASH_ACCOUNT_ID = '9d60b28e-52b7-4ffa-9c05-fd52880531ba';
const MARKER = '[OPENING-SETUP-2026-09-09]';
const apply = process.argv.includes('--apply');

const DATES = {
  opening: new Date('2026-09-08T09:00:00+03:00'),
  purchase: new Date('2026-09-09T09:00:00+03:00'),
  production: new Date('2026-09-12T09:00:00+03:00'),
};

const BASE_TOTAL = 4_615_800;
const TRANSPORT_TOTAL = 120_800;
const OTHER_COST_TOTAL = 237_580;
const EXTRA_TOTAL = TRANSPORT_TOTAL + OTHER_COST_TOTAL;
const ORDER_TOTAL = BASE_TOTAL + EXTRA_TOTAL;
const INSTALLATION = 103_450;
const NEW_FUNDING = ORDER_TOTAL + INSTALLATION;
const OLD_DEBT = 1_427_910;
const DEBT_SETTLEMENT = 1_043_500;
const FINAL_DEBT = OLD_DEBT + NEW_FUNDING - DEBT_SETTLEMENT;

const items = [
  {
    key: '1L',
    materialName: 'Resin 1L',
    quantity: 300_000,
    baseUnitPrice: 11.93,
    baseTotal: 3_579_000,
    openingRaw: 77_355,
    produced: 62_305,
    finalRaw: 315_050,
    finalFinished: 62_305,
    sellingPrice: 20,
  },
  {
    key: '0.5L',
    materialName: 'Resin 0.5L',
    quantity: 48_000,
    baseUnitPrice: 8.30,
    baseTotal: 398_400,
    openingRaw: 52_000,
    produced: 14_500,
    finalRaw: 85_500,
    finalFinished: 14_500,
    sellingPrice: 15,
  },
  {
    key: 'Fur',
    materialName: 'Fur',
    quantity: 380_000,
    baseUnitPrice: 1.68,
    baseTotal: 638_400,
    openingRaw: 0,
    produced: 0,
    finalRaw: 380_000,
    finalFinished: 0,
    sellingPrice: 0,
  },
].map((item) => {
  const share = item.baseTotal / BASE_TOTAL;
  const transportCost = TRANSPORT_TOTAL * share;
  const otherCosts = OTHER_COST_TOTAL * share;
  const landedTotal = item.baseTotal + transportCost + otherCosts;
  return {
    ...item,
    share,
    transportCost,
    otherCosts,
    landedTotal,
    landedUnitPrice: landedTotal / item.quantity,
  };
});

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function snapshot() {
  const [company, customer, vendor, account, users, fiscalYears, materials, catalog, purchases, productionOrders, expenses, transactions] = await Promise.all([
    prisma.company.findUnique({ where: { id: COMPANY_ID } }),
    prisma.customer.findUnique({ where: { id: CUSTOMER_ID } }),
    prisma.shopVendor.findUnique({ where: { id: VENDOR_ID } }),
    prisma.account.findUnique({ where: { id: CASH_ACCOUNT_ID } }),
    prisma.user.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, fullName: true, role: true, status: true } }),
    prisma.fiscalYear.findMany({ where: { companyId: COMPANY_ID } }),
    prisma.factoryMaterial.findMany({ where: { companyId: COMPANY_ID }, orderBy: { name: 'asc' } }),
    prisma.productCatalog.findMany({ where: { companyId: COMPANY_ID }, orderBy: { name: 'asc' } }),
    prisma.materialPurchase.findMany({ where: { companyId: COMPANY_ID }, orderBy: { purchaseDate: 'asc' } }),
    prisma.productionOrder.findMany({ where: { companyId: COMPANY_ID }, include: { manufacturingUsed: true, costTracking: true }, orderBy: { createdAt: 'asc' } }),
    prisma.expense.findMany({ where: { companyId: COMPANY_ID }, orderBy: { expenseDate: 'asc' } }),
    prisma.transaction.findMany({ where: { companyId: COMPANY_ID }, orderBy: { transactionDate: 'asc' } }),
  ]);
  return { company, customer, vendor, account, users, fiscalYears, materials, catalog, purchases, productionOrders, expenses, transactions };
}

function assertSetup(data) {
  if (!data.company) throw new Error('Target company was not found.');
  if (!data.customer) throw new Error('Sh. Cabdixakiim customer was not found.');
  if (!data.vendor) throw new Error('mohamed abdi supplier was not found.');
  if (!data.account) throw new Error('Main Cash / Khasnadda was not found.');
  if (Math.abs(Number(data.account.balance)) > 0.01) {
    throw new Error(`Main Cash must start at zero; current balance is ${data.account.balance}.`);
  }
  if (data.transactions.some((transaction) => `${transaction.description} ${transaction.note || ''}`.includes(MARKER))) {
    throw new Error('This opening setup was already applied; refusing to duplicate it.');
  }
  if (ORDER_TOTAL !== 4_974_180) throw new Error('Order total invariant failed.');
  if (FINAL_DEBT !== 5_462_040) throw new Error('Final debt invariant failed.');
  const allocated = items.reduce((sum, item) => sum + item.landedTotal, 0);
  if (Math.abs(allocated - ORDER_TOTAL) > 0.01) throw new Error('Landed cost allocation invariant failed.');
}

async function main() {
  const before = await snapshot();
  assertSetup(before);

  const plan = {
    apply,
    company: before.company.name,
    customer: before.customer.name,
    supplier: before.vendor.name,
    account: before.account.name,
    accountOpeningBalance: before.account.balance,
    oldDebt: OLD_DEBT,
    newFunding: NEW_FUNDING,
    debtSettlement: DEBT_SETTLEMENT,
    finalDebt: FINAL_DEBT,
    order: {
      baseTotal: BASE_TOTAL,
      transportTotal: TRANSPORT_TOTAL,
      otherCostTotal: OTHER_COST_TOTAL,
      grandTotal: ORDER_TOTAL,
      items: items.map((item) => ({
        name: item.key,
        quantity: item.quantity,
        baseUnitPrice: item.baseUnitPrice,
        allocatedExtraCost: roundMoney(item.transportCost + item.otherCosts),
        landedTotal: roundMoney(item.landedTotal),
        landedUnitPrice: item.landedUnitPrice,
      })),
    },
    finalStock: items.map((item) => ({
      name: item.key,
      raw: item.finalRaw,
      finished: item.finalFinished,
      total: item.finalRaw + item.finalFinished,
      sellingPrice: item.sellingPrice,
    })),
  };

  if (!apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `opening-order-production-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), marker: MARKER, before, plan }, null, 2));

  const user = before.users.find((entry) => entry.status === 'Active') || before.users[0];
  if (!user) throw new Error('No company user is available for audit ownership.');
  const fiscalYear = before.fiscalYears.find((entry) => entry.year === 2026) || null;

  const result = await prisma.$transaction(async (tx) => {
    const freshAccount = await tx.account.findUnique({ where: { id: CASH_ACCOUNT_ID } });
    if (!freshAccount || Math.abs(Number(freshAccount.balance)) > 0.01) {
      throw new Error('Main Cash balance changed after validation; transaction cancelled.');
    }

    const materialMap = {};
    for (const item of items) {
      const raw = await tx.factoryMaterial.findFirst({
        where: { companyId: COMPANY_ID, name: { equals: item.materialName, mode: 'insensitive' } },
      });
      if (!raw) throw new Error(`Raw stock record missing: ${item.materialName}`);

      materialMap[item.key] = await tx.factoryMaterial.update({
        where: { id: raw.id },
        data: {
          inStock: item.openingRaw,
          purchasePrice: item.landedUnitPrice,
          description: `Opening stock ${item.openingRaw.toLocaleString()} pcs before order dated 09/09/2026. ${MARKER}`,
        },
      });

      if (item.key !== 'Fur') {
        const finished = await tx.factoryMaterial.findFirst({
          where: { companyId: COMPANY_ID, name: { equals: item.key, mode: 'insensitive' } },
        });
        if (!finished) throw new Error(`Finished stock record missing: ${item.key}`);
        await tx.factoryMaterial.update({
          where: { id: finished.id },
          data: {
            inStock: 0,
            purchasePrice: item.landedUnitPrice,
            sellingPrice: item.sellingPrice,
            description: `Finished stock reset before production dated 12/09/2026. ${MARKER}`,
          },
        });
        const catalog = await tx.productCatalog.findFirst({
          where: { companyId: COMPANY_ID, name: { equals: item.key, mode: 'insensitive' } },
        });
        if (!catalog) throw new Error(`Product catalog record missing: ${item.key}`);
        await tx.productCatalog.update({
          where: { id: catalog.id },
          data: { standardCost: roundMoney(item.landedUnitPrice), sellingPrice: item.sellingPrice },
        });
      }
    }

    const openingDebt = await tx.transaction.create({
      data: {
        companyId: COMPANY_ID,
        customerId: CUSTOMER_ID,
        userId: user.id,
        fiscalYearId: fiscalYear?.id,
        amount: OLD_DEBT,
        type: 'DEBT_TAKEN',
        category: 'Opening Payable / Dayntii Hore',
        description: `Dayntii hore ee shirkaddu ku lahayd Sh. Cabdixakiim (Ref: ABDIHAKIM-OPENING) ${MARKER}`,
        note: 'Opening payable; wax lacag ah account-ka kama soo gelin.',
        transactionDate: DATES.opening,
      },
    });

    const funding = await tx.transaction.create({
      data: {
        companyId: COMPANY_ID,
        customerId: CUSTOMER_ID,
        userId: user.id,
        fiscalYearId: fiscalYear?.id,
        accountId: CASH_ACCOUNT_ID,
        amount: NEW_FUNDING,
        type: 'DEBT_TAKEN',
        category: 'Customer Funding / Dayn la Helay',
        description: `Maalgelinta Sh. Cabdixakiim: dalab 4,974,180 + installation 103,450 (Ref: ABDIHAKIM-FUNDING-09092026) ${MARKER}`,
        note: 'Lacagta account-ka ayaa la geliyay, kadib dalabka iyo installation-ka ayaa laga bixiyay.',
        transactionDate: DATES.purchase,
        balanceBefore: 0,
        balanceAfter: NEW_FUNDING,
      },
    });
    await tx.account.update({ where: { id: CASH_ACCOUNT_ID }, data: { balance: { increment: NEW_FUNDING } } });

    const purchases = [];
    for (const item of items) {
      const purchase = await tx.materialPurchase.create({
        data: {
          companyId: COMPANY_ID,
          fiscalYearId: fiscalYear?.id,
          materialName: item.materialName,
          quantity: item.quantity,
          unit: 'pcs',
          unitPrice: item.landedUnitPrice,
          totalPrice: item.landedTotal,
          transportCost: item.transportCost,
          taxAmount: 0,
          otherCosts: item.otherCosts,
          landedCostApplied: true,
          paidAmount: item.landedTotal,
          paymentStatus: 'PAID',
          vendorId: VENDOR_ID,
          purchaseDate: DATES.purchase,
          invoiceNumber: 'DALAB-09092026',
          notes: `Kharashka 358,380 ETB waxaa loogu qaybiyay alaabta saamiga qiimaheeda. ${MARKER}`,
        },
      });
      purchases.push(purchase);
      await tx.factoryMaterial.update({
        where: { id: materialMap[item.key].id },
        data: { inStock: { increment: item.quantity }, purchasePrice: item.landedUnitPrice },
      });
    }

    const purchasePayment = await tx.transaction.create({
      data: {
        companyId: COMPANY_ID,
        vendorId: VENDOR_ID,
        userId: user.id,
        fiscalYearId: fiscalYear?.id,
        accountId: CASH_ACCOUNT_ID,
        amount: ORDER_TOTAL,
        type: 'EXPENSE',
        category: 'Material Purchase',
        description: `Dalabkii 09/09/2026 — supplier mohamed abdi (Ref: DALAB-09092026) ${MARKER}`,
        note: '1L, 0.5L iyo Fur; landed cost-ku waa 4,974,180 ETB.',
        transactionDate: DATES.purchase,
        balanceBefore: NEW_FUNDING,
        balanceAfter: INSTALLATION,
      },
    });
    await tx.account.update({ where: { id: CASH_ACCOUNT_ID }, data: { balance: { decrement: ORDER_TOTAL } } });

    const expense = await tx.expense.create({
      data: {
        companyId: COMPANY_ID,
        userId: user.id,
        customerId: CUSTOMER_ID,
        fiscalYearId: fiscalYear?.id,
        accountId: CASH_ACCOUNT_ID,
        description: `Rakibidda warshadda ${MARKER}`,
        amount: INSTALLATION,
        paidFrom: 'Main Cash / Khasnadda',
        expenseDate: DATES.purchase,
        category: 'Installation / Rakibidda Warshadda',
        note: 'Waxaa maalgeliyay Sh. Cabdixakiim. Shaqaalaha fuliyay dib ayaa loogu xiriirin doonaa iyadoo aan lacag mar labaad la bixin.',
        approved: true,
        workflowStatus: 'PAID',
        paymentStatus: 'PAID',
        paymentDate: DATES.purchase,
        approvedBy: user.id,
        approvedAt: DATES.purchase,
      },
    });

    const installationPayment = await tx.transaction.create({
      data: {
        companyId: COMPANY_ID,
        customerId: CUSTOMER_ID,
        userId: user.id,
        fiscalYearId: fiscalYear?.id,
        accountId: CASH_ACCOUNT_ID,
        expenseId: expense.id,
        amount: INSTALLATION,
        type: 'EXPENSE',
        category: 'Installation / Rakibidda Warshadda',
        description: `Kharashka rakibidda warshadda (Ref: INSTALL-09092026) ${MARKER}`,
        note: 'Qofka shaqada fuliyay dib ayaa employee ahaan loogu xiriirin doonaa; lacagtan dib looma bixinayo.',
        transactionDate: DATES.purchase,
        balanceBefore: INSTALLATION,
        balanceAfter: 0,
      },
    });
    await tx.account.update({ where: { id: CASH_ACCOUNT_ID }, data: { balance: { decrement: INSTALLATION } } });

    const settlement = await tx.transaction.create({
      data: {
        companyId: COMPANY_ID,
        customerId: CUSTOMER_ID,
        userId: user.id,
        fiscalYearId: fiscalYear?.id,
        amount: DEBT_SETTLEMENT,
        type: 'DEBT_REPAID',
        category: 'Debt Adjustment / Iib Hore',
        description: `Lacagtii iibka hore ee daynta Cabdixakiim lagu xiray (Ref: ABDIHAKIM-SETTLEMENT) ${MARKER}`,
        note: 'Ma aha sale cusub; waa settlement-ka daynta, muddadii 01/06/2026 ilaa 23/07/2026.',
        transactionDate: DATES.purchase,
      },
    });

    const productionOrders = [];
    for (const item of items.filter((entry) => entry.produced > 0)) {
      const catalog = await tx.productCatalog.findFirst({
        where: { companyId: COMPANY_ID, name: { equals: item.key, mode: 'insensitive' } },
      });
      const finished = await tx.factoryMaterial.findFirst({
        where: { companyId: COMPANY_ID, name: { equals: item.key, mode: 'insensitive' } },
      });
      if (!catalog || !finished) throw new Error(`Production setup missing for ${item.key}`);

      const order = await tx.productionOrder.create({
        data: {
          companyId: COMPANY_ID,
          productId: catalog.id,
          orderNumber: `PROD-12092026-${item.key.replace('.', '')}`,
          productName: item.key,
          quantity: item.produced,
          status: 'COMPLETED',
          priority: 'MEDIUM',
          startDate: DATES.production,
          completedDate: DATES.production,
          notes: `Production-ka stock snapshot-ka 12/09/2026. Fur lagama jarin; furku wuxuu baxaa marka sale dhaco. ${MARKER}`,
        },
      });

      const totalMaterialCost = item.produced * item.landedUnitPrice;
      await tx.factoryMaterial.update({ where: { id: materialMap[item.key].id }, data: { inStock: { decrement: item.produced } } });
      await tx.factoryMaterial.update({
        where: { id: finished.id },
        data: {
          inStock: { increment: item.produced },
          purchasePrice: item.landedUnitPrice,
          sellingPrice: item.sellingPrice,
        },
      });
      await tx.manufacturingUsed.create({
        data: {
          companyId: COMPANY_ID,
          productionOrderId: order.id,
          materialName: item.materialName,
          quantityUsed: item.produced,
          unit: 'pcs',
          costPerUnit: item.landedUnitPrice,
          totalCost: totalMaterialCost,
          usedDate: DATES.production,
          notes: `Hal raw body ayaa loo beddelay hal finished bottle. Furku sale-ka ayuu ka baxaa. ${MARKER}`,
        },
      });
      await tx.costTracking.create({
        data: {
          companyId: COMPANY_ID,
          productionOrderId: order.id,
          actualMaterialCost: totalMaterialCost,
          actualLaborCost: 0,
          overheadCost: 0,
          notes: `Landed cost-ka raw material-ka. ${MARKER}`,
        },
      });
      productionOrders.push(order);
    }

    const finalAccount = await tx.account.findUnique({ where: { id: CASH_ACCOUNT_ID } });
    const finalMaterials = await tx.factoryMaterial.findMany({
      where: { companyId: COMPANY_ID, id: { in: Object.values(materialMap).map((entry) => entry.id) } },
      select: { name: true, inStock: true, purchasePrice: true },
    });
    if (!finalAccount || Math.abs(Number(finalAccount.balance)) > 0.01) throw new Error('Main Cash did not finish at zero.');

    for (const item of items) {
      const raw = finalMaterials.find((entry) => entry.name.toLowerCase() === item.materialName.toLowerCase());
      if (!raw || Math.abs(raw.inStock - item.finalRaw) > 0.001) {
        throw new Error(`Final raw stock mismatch for ${item.materialName}.`);
      }
    }

    return {
      openingDebtId: openingDebt.id,
      fundingId: funding.id,
      purchaseIds: purchases.map((entry) => entry.id),
      purchasePaymentId: purchasePayment.id,
      installationExpenseId: expense.id,
      installationPaymentId: installationPayment.id,
      settlementId: settlement.id,
      productionOrderIds: productionOrders.map((entry) => entry.id),
      finalAccountBalance: finalAccount.balance,
    };
  }, { maxWait: 10_000, timeout: 60_000 });

  const [accountAfter, rawAfter, finishedAfter, payableTaken, payableRepaid] = await Promise.all([
    prisma.account.findUnique({ where: { id: CASH_ACCOUNT_ID }, select: { name: true, balance: true } }),
    prisma.factoryMaterial.findMany({
      where: { companyId: COMPANY_ID, name: { in: ['Resin 1L', 'Resin 0.5L', 'Fur'] } },
      select: { name: true, inStock: true, purchasePrice: true },
      orderBy: { name: 'asc' },
    }),
    prisma.factoryMaterial.findMany({
      where: { companyId: COMPANY_ID, name: { in: ['1L', '0.5L'] } },
      select: { name: true, inStock: true, purchasePrice: true, sellingPrice: true },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.aggregate({
      where: { companyId: COMPANY_ID, customerId: CUSTOMER_ID, type: 'DEBT_TAKEN', description: { contains: MARKER } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { companyId: COMPANY_ID, customerId: CUSTOMER_ID, type: 'DEBT_REPAID', description: { contains: MARKER } },
      _sum: { amount: true },
    }),
  ]);

  const verifiedDebt = Number(payableTaken._sum.amount || 0) - Number(payableRepaid._sum.amount || 0);
  console.log(JSON.stringify({
    success: true,
    backupPath,
    result,
    verification: { accountAfter, rawAfter, finishedAfter, payableTaken: payableTaken._sum.amount, payableRepaid: payableRepaid._sum.amount, verifiedDebt },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
