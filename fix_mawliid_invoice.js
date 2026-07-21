const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoiceNumber = 'AN-6691092-5Z5J';
  console.log(`Fixing invoice: ${invoiceNumber}`);

  // 1. Fetch the sale
  const sale = await prisma.sale.findFirst({
    where: { invoiceNumber },
    include: { items: true }
  });

  if (!sale) {
    console.log("Sale not found!");
    return;
  }

  console.log("Current Sale state:", {
    total: sale.total,
    paidAmount: sale.paidAmount,
    status: sale.paymentStatus
  });

  // 2. Perform updates
  await prisma.$transaction(async (tx) => {
    // Update Sale total
    await tx.sale.update({
      where: { id: sale.id },
      data: {
        total: 80000,
        paymentStatus: 'Paid'
      }
    });

    // Update SaleItem (if items exist, update the first one to match 80,000 total by setting quantity to 4000)
    if (sale.items.length > 0) {
      await tx.saleItem.update({
        where: { id: sale.items[0].id },
        data: {
          quantity: 4000,
          total: 80000
        }
      });
    }
  });

  console.log("Invoice successfully updated!");
  
  // Verify updated state
  const updatedSale = await prisma.sale.findUnique({
    where: { id: sale.id },
    include: { items: true }
  });

  console.log("New Sale state:", {
    total: updatedSale.total,
    paidAmount: updatedSale.paidAmount,
    status: updatedSale.paymentStatus,
    debt: updatedSale.total - updatedSale.paidAmount
  });
  console.log("New Item state:", updatedSale.items[0]);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
