const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Checking DB records for company:", companyId);

  // 1. Accounts
  console.log("\n--- Accounts ---");
  const accounts = await prisma.account.findMany({
    where: { companyId }
  });
  accounts.forEach(a => {
    console.log(`Name: ${a.name}, Balance: ${a.balance}, Type: ${a.type}, Active: ${a.isActive}`);
  });

  // 2. Sales summary
  console.log("\n--- Sales Summary ---");
  const sales = await prisma.sale.findMany({
    where: { companyId }
  });
  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalSalesPaid = sales.reduce((sum, s) => sum + Number(s.paidAmount), 0);
  const salesDebt = totalSales - totalSalesPaid;
  console.log(`Total Sales: ${totalSales}`);
  console.log(`Total Paid Sales: ${totalSalesPaid}`);
  console.log(`Sales Outstanding Debt: ${salesDebt}`);
  console.log(`Count: ${sales.length}`);

  // 3. Expenses summary
  console.log("\n--- Expenses Summary ---");
  const expenses = await prisma.expense.findMany({
    where: { companyId }
  });
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  console.log(`Total Expenses: ${totalExpenses}`);
  console.log(`Count: ${expenses.length}`);

  // 4. Material Purchases summary
  console.log("\n--- Material Purchases Summary ---");
  const purchases = await prisma.materialPurchase.findMany({
    where: { companyId }
  });
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalPrice), 0);
  const totalPurchasesPaid = purchases.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
  console.log(`Total Purchases: ${totalPurchases}`);
  console.log(`Total Paid Purchases: ${totalPurchasesPaid}`);
  console.log(`Count: ${purchases.length}`);

  // 5. Purchase Orders
  console.log("\n--- Purchase Orders ---");
  const pos = await prisma.purchaseOrder.findMany({
    where: { companyId }
  });
  const totalPos = pos.reduce((sum, po) => sum + Number(po.total), 0);
  const totalPosPaid = pos.reduce((sum, po) => sum + Number(po.paidAmount || 0), 0);
  console.log(`Total Purchase Orders: ${totalPos}`);
  console.log(`Total Paid POs: ${totalPosPaid}`);
  console.log(`Count: ${pos.length}`);

  // 6. Transactions
  console.log("\n--- Transactions ---");
  const transactions = await prisma.transaction.findMany({
    where: { companyId }
  });
  console.log(`Total Transactions Count: ${transactions.length}`);
  const txSummary = {};
  transactions.forEach(tx => {
    txSummary[tx.type] = (txSummary[tx.type] || 0) + Number(tx.amount);
  });
  console.log("Transactions by Type:", txSummary);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
