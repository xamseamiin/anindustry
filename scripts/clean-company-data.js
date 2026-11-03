require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const merchantName = 'E-Birr Merchant';

(async () => {
  const merchant = await prisma.account.findFirst({ where: { companyId, name: merchantName } });
  if (!merchant) throw new Error('E-Birr Merchant account not found for target company');

  const result = await prisma.$transaction(async (tx) => {
    const out = {};
    out.saleAllocations = (await tx.salePaymentAllocation.deleteMany({ where: { sale: { companyId } } })).count;
    out.saleItems = (await tx.saleItem.deleteMany({ where: { sale: { companyId } } })).count;
    out.sales = (await tx.sale.deleteMany({ where: { companyId } })).count;
    out.receiptCorrections = (await tx.salesReceiptCorrection.deleteMany({ where: { companyId } })).count;

    out.workOrders = (await tx.workOrder.deleteMany({ where: { companyId } })).count;
    out.manufacturingUsed = (await tx.manufacturingUsed.deleteMany({ where: { companyId } })).count;
    out.billOfMaterials = (await tx.billOfMaterial.deleteMany({ where: { companyId } })).count;
    out.costTracking = (await tx.costTracking.deleteMany({ where: { companyId } })).count;
    out.materialPurchases = (await tx.materialPurchase.deleteMany({ where: { companyId } })).count;
    out.productionOrders = (await tx.productionOrder.deleteMany({ where: { companyId } })).count;

    out.stockMovements = (await tx.stockMovement.deleteMany({ where: { companyId } })).count;
    out.purchaseOrderItems = (await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { companyId } } })).count;
    out.purchaseOrders = (await tx.purchaseOrder.deleteMany({ where: { companyId } })).count;

    out.nonMerchantTransactions = (await tx.transaction.deleteMany({
      where: {
        companyId,
        NOT: [{ accountId: merchant.id }, { fromAccountId: merchant.id }, { toAccountId: merchant.id }],
      },
    })).count;
    await tx.transaction.updateMany({ where: { companyId, OR: [{ accountId: merchant.id }, { fromAccountId: merchant.id }, { toAccountId: merchant.id }] }, data: { customerId: null } });

    await tx.product.updateMany({ where: { companyId }, data: { stock: 0, status: 'Out of Stock' } });
    await tx.factoryMaterial.updateMany({ where: { companyId }, data: { inStock: 0 } });
    await tx.account.updateMany({ where: { companyId, NOT: { id: merchant.id } }, data: { balance: 0, reservedBalance: 0 } });

    await tx.expense.updateMany({ where: { companyId }, data: { customerId: null } });
    await tx.payment.updateMany({ where: { project: { companyId } }, data: { customerId: null } });
    out.customers = (await tx.customer.deleteMany({ where: { companyId } })).count;
    return out;
  }, { timeout: 120000 });

  const remaining = await prisma.account.findMany({ where: { companyId }, select: { name: true, balance: true, reservedBalance: true } });
  console.log(JSON.stringify({ companyId, merchantId: merchant.id, deleted: result, accounts: remaining.map(a => ({ ...a, balance: Number(a.balance), reservedBalance: Number(a.reservedBalance) })) }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
