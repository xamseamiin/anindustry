const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Measuring database queries performance for the dashboard...");

  const startTime = Date.now();

  // Query 1
  let qStart = Date.now();
  await prisma.productionOrder.count({ where: { companyId } });
  console.log(`Query 1 (Count ProductionOrder): ${Date.now() - qStart}ms`);

  // Query 2
  qStart = Date.now();
  await prisma.productionOrder.count({
      where: {
          companyId,
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
  });
  console.log(`Query 2 (Count Active Orders): ${Date.now() - qStart}ms`);

  // Query 3
  qStart = Date.now();
  await prisma.factoryMaterial.findMany({ where: { companyId } });
  console.log(`Query 3 (findMany FactoryMaterial): ${Date.now() - qStart}ms`);

  // Query 4
  qStart = Date.now();
  await prisma.productionOrder.findMany({
      where: { companyId },
      take: 5,
      orderBy: { createdAt: 'desc' }
  });
  console.log(`Query 4 (findMany Recent Production): ${Date.now() - qStart}ms`);

  // Query 5
  qStart = Date.now();
  await prisma.sale.findMany({
      where: { companyId },
      select: { total: true, paidAmount: true }
  });
  console.log(`Query 5 (findMany Sale): ${Date.now() - qStart}ms`);

  // Query 6
  qStart = Date.now();
  await prisma.transaction.findMany({
      where: { companyId, type: 'DEBT_GIVEN' },
      select: { amount: true }
  });
  console.log(`Query 6 (findMany Transaction DEBT_GIVEN): ${Date.now() - qStart}ms`);

  // Query 7
  qStart = Date.now();
  await prisma.transaction.findMany({
      where: { companyId, type: 'DEBT_RECEIVED' },
      select: { amount: true }
  });
  console.log(`Query 7 (findMany Transaction DEBT_RECEIVED): ${Date.now() - qStart}ms`);

  // Query 8
  qStart = Date.now();
  await prisma.materialPurchase.findMany({
      where: { companyId },
      select: { totalPrice: true, paidAmount: true }
  });
  console.log(`Query 8 (findMany MaterialPurchase): ${Date.now() - qStart}ms`);

  // Query 9
  qStart = Date.now();
  await prisma.purchaseOrder.findMany({
      where: { companyId },
      select: { total: true, paidAmount: true }
  });
  console.log(`Query 9 (findMany PurchaseOrder): ${Date.now() - qStart}ms`);

  // Query 10
  qStart = Date.now();
  await prisma.transaction.findMany({
      where: { 
          companyId, 
          type: 'DEBT_TAKEN',
          OR: [
              { category: null },
              { category: { not: 'Material Purchase Debt' } }
          ]
      },
      select: { amount: true }
  });
  console.log(`Query 10 (findMany Transaction DEBT_TAKEN): ${Date.now() - qStart}ms`);

  // Query 11
  qStart = Date.now();
  await prisma.transaction.findMany({
      where: { companyId, type: 'DEBT_REPAID' },
      select: { amount: true }
  });
  console.log(`Query 11 (findMany Transaction DEBT_REPAID): ${Date.now() - qStart}ms`);

  // Query 12
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  qStart = Date.now();
  await prisma.productionOrder.findMany({
      where: {
          companyId,
          createdAt: { gte: weekStart },
          status: 'COMPLETED'
      },
      select: { quantity: true, createdAt: true }
  });
  console.log(`Query 12 (findMany ProductionOrder Weekly): ${Date.now() - qStart}ms`);

  // Query 13
  qStart = Date.now();
  await prisma.account.findMany({
      where: { companyId, isActive: true },
      select: { name: true, balance: true, type: true }
  });
  console.log(`Query 13 (findMany Account): ${Date.now() - qStart}ms`);

  const totalTime = Date.now() - startTime;
  console.log(`\nTotal Sequential DB queries time: ${totalTime}ms`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
