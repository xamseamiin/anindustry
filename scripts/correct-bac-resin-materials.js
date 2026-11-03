require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const bac05 = '2bb95e6a-0c1f-4c7d-a225-eee80629e7c2';
const bac1 = '7cb510c3-cca3-4278-ae28-1ca6a6d71458';

(async () => {
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.factoryMaterial.findFirst({ where: { id: bac05, companyId } });
    const original = await tx.factoryMaterial.findFirst({ where: { id: bac1, companyId } });
    const resin05 = await tx.factoryMaterial.findFirst({ where: { companyId, name: 'Resin 0.5L' } });
    const resin1 = await tx.factoryMaterial.findFirst({ where: { companyId, name: 'Resin 1L' } });
    if (!created || !original || !resin05 || !resin1) throw new Error('Required material records not found');
    const used05 = await tx.saleItem.count({ where: { productId: created.id } });
    const moves05 = await tx.stockMovement.count({ where: { productId: created.id } });
    if (used05 || moves05) throw new Error(`Bac 0.5L has references: saleItems=${used05}, stockMovements=${moves05}`);
    await tx.factoryMaterial.update({ where: { id: resin05.id }, data: { inStock: 39000, purchasePrice: 11.164, unit: 'pcs' } });
    await tx.factoryMaterial.update({ where: { id: resin1.id }, data: { inStock: 123000, purchasePrice: 14.794, unit: 'pcs' } });
    await tx.factoryMaterial.update({ where: { id: original.id }, data: { name: 'Bac', unit: 'kg', inStock: 104 } });
    await tx.factoryMaterial.delete({ where: { id: created.id } });
    return { deleted: created.id, restored: original.id, resin05: resin05.id, resin1: resin1.id };
  });
  const rows = await prisma.factoryMaterial.findMany({ where: { companyId, name: { in: ['Bac', 'Bac 0.5L', 'Bac 1L', 'Resin 0.5L', 'Resin 1L'] } }, select: { id: true, name: true, category: true, unit: true, inStock: true, purchasePrice: true }, orderBy: { name: 'asc' } });
  console.log(JSON.stringify({ result, rows }, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
