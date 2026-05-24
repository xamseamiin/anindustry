const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const p = await prisma.materialPurchase.findMany({ include: { vendor: true } });
    console.log(JSON.stringify(p.map(x => ({ id: x.id, vendor: x.vendor.name, invoice: x.invoiceNumber, date: x.purchaseDate })), null, 2));
}
check();
