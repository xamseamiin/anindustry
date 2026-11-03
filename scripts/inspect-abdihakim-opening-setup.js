require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });

  const result = [];
  for (const company of companies) {
    const [customers, vendors, accounts, materials, catalog, transactions] = await Promise.all([
      prisma.customer.findMany({
        where: {
          companyId: company.id,
          OR: [
            { name: { contains: 'abdi', mode: 'insensitive' } },
            { name: { contains: 'hakim', mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, phone: true },
      }),
      prisma.shopVendor.findMany({
        where: {
          companyId: company.id,
          OR: [
            { name: { contains: 'abdi', mode: 'insensitive' } },
            { name: { contains: 'hakim', mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, phone: true },
      }),
      prisma.account.findMany({
        where: { companyId: company.id },
        select: { id: true, name: true, balance: true, type: true, isActive: true },
      }),
      prisma.factoryMaterial.findMany({
        where: { companyId: company.id },
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          unit: true,
          inStock: true,
          purchasePrice: true,
          sellingPrice: true,
        },
      }),
      prisma.productCatalog.findMany({
        where: { companyId: company.id },
        select: { id: true, name: true, standardCost: true, sellingPrice: true },
      }),
      prisma.transaction.findMany({
        where: {
          companyId: company.id,
          OR: [
            { description: { contains: 'Abdi', mode: 'insensitive' } },
            { description: { contains: 'Hakim', mode: 'insensitive' } },
          ],
        },
        orderBy: { transactionDate: 'asc' },
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          category: true,
          transactionDate: true,
          accountId: true,
          customerId: true,
          vendorId: true,
        },
      }),
    ]);

    result.push({ company, customers, vendors, accounts, materials, catalog, transactions });
  }

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
