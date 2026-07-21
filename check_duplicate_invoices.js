const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoiceNumber = 'AN-6691092-5Z5J';
  console.log(`Checking database for invoice: ${invoiceNumber}`);

  const sales = await prisma.sale.findMany({
    where: { invoiceNumber }
  });

  console.log(`Found ${sales.length} sales with this invoice number:`);
  sales.forEach((s, i) => {
    console.log(`${i+1}. ID: ${s.id}, Total: ${s.total}, Paid: ${s.paidAmount}, Status: ${s.paymentStatus}, Created: ${s.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
