const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Analyzing receivables calculation detail...");

  // Sales total vs paid
  const sales = await prisma.sale.findMany({
    where: { companyId }
  });

  console.log(`Total Sales Count: ${sales.length}`);
  let totalSalesAmt = 0;
  let totalPaidSalesAmt = 0;
  let calculatedSalesDebt = 0;

  sales.forEach((s, i) => {
    const debt = Number(s.total) - Number(s.paidAmount);
    totalSalesAmt += Number(s.total);
    totalPaidSalesAmt += Number(s.paidAmount);
    calculatedSalesDebt += debt;
    console.log(`${i+1}. Inv: ${s.invoiceNumber}, Status: ${s.paymentStatus}, Total: ${s.total}, Paid: ${s.paidAmount}, Debt: ${debt}`);
  });

  console.log(`\nOverall Sales Total: ${totalSalesAmt}`);
  console.log(`Overall Sales Paid: ${totalPaidSalesAmt}`);
  console.log(`Overall Sales Debt: ${calculatedSalesDebt}`);

  // Fetch unpaid sales according to GET api filter:
  const unpaidSales = await prisma.sale.findMany({
    where: {
      companyId,
      paymentStatus: { notIn: ['Paid', 'PAID', 'Refunded', 'REFUNDED'] }
    }
  });

  console.log(`\nUnpaid Sales (according to GET filter: not Paid/PAID/Refunded/REFUNDED): ${unpaidSales.length}`);
  let unpaidSalesDebtSum = 0;
  unpaidSales.forEach((s, i) => {
    const debt = Number(s.total) - Number(s.paidAmount);
    unpaidSalesDebtSum += debt;
    console.log(`${i+1}. Inv: ${s.invoiceNumber}, Status: ${s.paymentStatus}, Total: ${s.total}, Paid: ${s.paidAmount}, Debt: ${debt}`);
  });
  console.log(`Unpaid Sales Debt Sum: ${unpaidSalesDebtSum}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
