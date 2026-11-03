require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';

(async () => {
  const result = await prisma.$transaction(async (tx) => {
    const oneL = await tx.factoryMaterial.updateMany({ where: { companyId, name: '1L', category: 'Finished Goods' }, data: { inStock: 48075, unit: 'pcs' } });
    const halfL = await tx.factoryMaterial.updateMany({ where: { companyId, name: '0.5L', category: 'Finished Goods' }, data: { inStock: 49400, unit: 'pcs' } });
    const fur = await tx.factoryMaterial.updateMany({ where: { companyId, name: 'Fur' }, data: { inStock: 270000, unit: 'pcs' } });
    const bac = await tx.factoryMaterial.updateMany({ where: { companyId, name: 'Bac' }, data: { name: 'Bac 1L', inStock: 123000, unit: 'pcs', category: 'Raw Material' } });
    const owner = await tx.user.findFirst({ where: { companyId }, select: { id: true } });
    if (!owner) throw new Error('No company user found for Bac 0.5L material');
    const existing = await tx.factoryMaterial.findFirst({ where: { companyId, name: 'Bac 0.5L' } });
    if (existing) await tx.factoryMaterial.update({ where: { id: existing.id }, data: { inStock: 39000, unit: 'pcs', category: 'Raw Material' } });
    else await tx.factoryMaterial.create({ data: { name: 'Bac 0.5L', sku: 'RAW-BAC-05L', category: 'Raw Material', unit: 'pcs', inStock: 39000, minStock: 0, purchasePrice: 0, sellingPrice: 0, userId: owner.id, companyId } });
    return { oneL: oneL.count, halfL: halfL.count, fur: fur.count, bacRenamed: bac.count };
  });
  const rows = await prisma.factoryMaterial.findMany({ where: { companyId, name: { in: ['1L', '0.5L', 'Bac 1L', 'Bac 0.5L', 'Fur'] } }, select: { name: true, category: true, unit: true, inStock: true }, orderBy: { name: 'asc' } });
  console.log(JSON.stringify({ result, rows }, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
