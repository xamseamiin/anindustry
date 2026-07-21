const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Analyzing unpaid sales customer names...");

  const unpaid = await prisma.sale.findMany({
    where: {
      companyId,
      paymentStatus: { notIn: ['Paid', 'PAID', 'Refunded', 'REFUNDED'] }
    },
    include: { customer: true }
  });

  unpaid.forEach((s, i) => {
    console.log(`${i+1}. Inv: ${s.invoiceNumber}, Customer: ${s.customer ? s.customer.name : 'Unknown'}, Total: ${s.total}, Paid: ${s.paidAmount}, Debt: ${s.total - s.paidAmount}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
