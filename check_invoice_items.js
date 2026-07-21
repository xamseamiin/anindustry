const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoiceNumber = 'AN-6691092-5Z5J';
  console.log(`Checking items for invoice: ${invoiceNumber}`);

  const sale = await prisma.sale.findFirst({
    where: { invoiceNumber },
    include: { items: true }
  });

  if (sale) {
    console.log("Sale:", {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      total: sale.total,
      paidAmount: sale.paidAmount,
      paymentStatus: sale.paymentStatus,
      createdAt: sale.createdAt
    });
    console.log("Items:", sale.items);
  } else {
    console.log("Sale not found!");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
