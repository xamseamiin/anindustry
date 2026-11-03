require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const marker = '[SEPTEMBER-NOTEBOOK-2026-09-21-28]';
const apply = process.argv.includes('--apply');
const date = day => new Date(`2026-09-${String(day).padStart(2, '0')}T12:00:00+03:00`);

const productionRows = [
  [22, 2200], [23, 6100], [24, 4350], [26, 7450], [27, 7000], [28, 7600]
];

// The 21/09 notebook carry-forward is 60,855. The database was at 67,355
// after the already-recorded 5,350 production, so 6,500 units of Walk-in
// sales were missing from 21/09. The remaining rows are written explicitly.
const salesRows = [
  [21, 6500, 'BALANCE_RECONCILIATION'],
  [22, 750], [23, 200], [24, 5250], [25, 6600], [26, 7100], [27, 10400], [28, 50]
];

async function main() {
  const result = await prisma.$transaction(async tx => {
    const [finished, raw, caps, catalog, account] = await Promise.all([
      tx.factoryMaterial.findFirst({ where: { companyId, name: '1L' } }),
      tx.factoryMaterial.findFirst({ where: { companyId, name: 'Resin 1L' } }),
      tx.factoryMaterial.findFirst({ where: { companyId, name: 'Fur' } }),
      tx.productCatalog.findFirst({ where: { companyId, name: '1L' } }),
      tx.account.findFirst({ where: { companyId, name: { equals: 'E-birr', mode: 'insensitive' }, isActive: true } })
    ]);
    if (!finished || !raw || !caps || !catalog || !account) throw new Error('1L inventory, raw material, caps, catalog, or E-birr account is missing.');
    if (Number(finished.sellingPrice) !== 20) throw new Error(`1L selling price changed to ${finished.sellingPrice}; review required.`);

    const orderNumbers = productionRows.map(([day]) => `AN-NB-PROD-202609${day}-1L`);
    const invoiceNumbers = salesRows.map(([day]) => `AN-NB-202609${day}-1L`);
    const [existingOrders, existingSales, closedPeriod] = await Promise.all([
      tx.productionOrder.findMany({ where: { companyId, orderNumber: { in: orderNumbers } }, select: { orderNumber: true } }),
      tx.sale.findMany({ where: { companyId, invoiceNumber: { in: invoiceNumbers } }, select: { invoiceNumber: true } }),
      tx.financialPeriod.findFirst({ where: { companyId, isClosed: true, startDate: { lte: date(28) }, endDate: { gte: date(21) } } })
    ]);
    if (existingOrders.length || existingSales.length) throw new Error('One or more notebook rows were already imported; refusing to duplicate them.');
    if (closedPeriod) throw new Error('The September financial period is closed.');

    const produced = productionRows.reduce((sum, row) => sum + row[1], 0);
    const sold = salesRows.reduce((sum, row) => sum + row[1], 0);
    const income = sold * Number(finished.sellingPrice);
    const finalStock = Number(finished.inStock) + produced - sold;
    const summary = {
      apply,
      marker,
      account: account.name,
      openingFinishedStock: Number(finished.inStock),
      produced,
      sold,
      income,
      expectedFinishedStock: finalStock,
      expectedRawStock: Number(raw.inStock) - produced,
      expectedCapStock: Number(caps.inStock) - sold,
      expectedAccountBalance: Number(account.balance) + income,
      productionRows,
      salesRows
    };
    if (finalStock !== 65205) throw new Error(`Notebook reconciliation failed: expected 65,205 but calculated ${finalStock}.`);
    if (Number(raw.inStock) < produced || Number(caps.inStock) < sold) throw new Error('Raw 1L or cap stock is insufficient.');
    if (!apply) return summary;

    const userId = finished.userId;
    for (const [day, quantity] of productionRows) {
      const order = await tx.productionOrder.create({
        data: {
          companyId,
          productId: catalog.id,
          productName: '1L',
          quantity,
          status: 'COMPLETED',
          priority: 'MEDIUM',
          orderNumber: `AN-NB-PROD-202609${day}-1L`,
          startDate: date(day),
          completedDate: date(day),
          notes: `${marker} Historical production confirmed from owner notebook. One Resin 1L per bottle; caps are deducted at sale.`
        }
      });
      await tx.factoryMaterial.update({ where: { id: raw.id }, data: { inStock: { decrement: quantity } } });
      await tx.factoryMaterial.update({ where: { id: finished.id }, data: { inStock: { increment: quantity } } });
      await tx.manufacturingUsed.create({
        data: {
          companyId,
          productionOrderId: order.id,
          materialName: raw.name,
          quantityUsed: quantity,
          unit: raw.unit,
          costPerUnit: raw.purchasePrice,
          totalCost: Number(raw.purchasePrice) * quantity,
          usedDate: date(day),
          notes: marker
        }
      });
      await tx.costTracking.create({
        data: {
          companyId,
          productionOrderId: order.id,
          actualMaterialCost: Number(raw.purchasePrice) * quantity,
          actualLaborCost: 0,
          overheadCost: 0,
          notes: `${marker} Raw bottle cost only; labor/packaging were not supplied.`
        }
      });
    }

    for (const [day, quantity, reason] of salesRows) {
      const total = quantity * Number(finished.sellingPrice);
      const invoiceNumber = `AN-NB-202609${day}-1L`;
      const costPrice = Number(finished.purchasePrice) + Number(caps.purchasePrice);
      const sale = await tx.sale.create({
        data: {
          companyId,
          userId,
          invoiceNumber,
          customerId: null,
          accountId: account.id,
          subtotal: total,
          tax: 0,
          total,
          paidAmount: total,
          paymentMethod: 'E-BIRR',
          paymentStatus: 'Paid',
          status: 'Completed',
          createdAt: date(day),
          autoConvertDebt: false,
          notes: `${marker} Walk-in daily sale from owner notebook; fully paid to E-birr.${reason ? ' 21/09 quantity derived from the confirmed 60,855 carry-forward balance.' : ''} [CapDeducted:${quantity}]`,
          items: {
            create: [{
              productId: finished.id,
              productName: finished.name,
              quantity,
              unitPrice: finished.sellingPrice,
              total,
              costPrice,
              totalCost: costPrice * quantity
            }]
          }
        }
      });
      for (const material of [finished, caps]) {
        const updated = await tx.factoryMaterial.updateMany({
          where: { id: material.id, companyId, inStock: { gte: quantity } },
          data: { inStock: { decrement: quantity } }
        });
        if (updated.count !== 1) throw new Error(`Insufficient ${material.name} stock; transaction rolled back.`);
      }
      await tx.transaction.create({
        data: {
          companyId,
          userId,
          accountId: account.id,
          description: `Iibka ${sale.invoiceNumber}`,
          amount: total,
          type: 'INCOME',
          category: 'Sales Income',
          transactionDate: date(day),
          note: `${marker} Historical Walk-in sale recorded from owner notebook.`
        }
      });
    }
    await tx.account.update({ where: { id: account.id }, data: { balance: { increment: income } } });
    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'IMPORT_NOTEBOOK_STOCK_LEDGER',
        entity: 'Sale',
        details: JSON.stringify(summary)
      }
    });
    return summary;
  }, { isolationLevel: 'Serializable', timeout: 60000 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
