const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Analyzing all records for Mawliid...");

  // Find customer ID for Mawliid
  const customer = await prisma.customer.findFirst({
    where: { name: { contains: 'Mawliid', mode: 'insensitive' } }
  });

  if (!customer) {
    console.log("Customer Mawliid not found!");
    return;
  }

  console.log("Customer Mawliid:", customer);

  const sales = await prisma.sale.findMany({
    where: { customerId: customer.id }
  });
  console.log("\nSales for Mawliid:");
  sales.forEach(s => {
    console.log(`Inv: ${s.invoiceNumber}, Total: ${s.total}, Paid: ${s.paidAmount}, Status: ${s.paymentStatus}, Date: ${s.createdAt}`);
  });

  const txs = await prisma.transaction.findMany({
    where: { customerId: customer.id }
  });
  console.log("\nTransactions for Mawliid:");
  txs.forEach(t => {
    console.log(`Type: ${t.type}, Amount: ${t.amount}, Date: ${t.createdAt}, Desc: ${t.description}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
