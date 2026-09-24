import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

function identityAllowed(initData: string) {
  const identity = verifyTelegramInitData(initData || '');
  if (process.env.APP_ENV === 'local') return identity || { id: process.env.TELEGRAM_USER_ID || 'local-admin' };
  return identity && isTelegramFinancialAdmin(identity as any) ? identity : null;
}

const dayOnly = (value: string) => new Date(`${value}T12:00:00.000Z`);
const nairobiStart = (offset = 0) => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day') + offset, -3));
};

export async function GET(request: Request) {
  try {
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const params = new URL(request.url).searchParams;
    if (params.get('history') === '1') {
      if (!identityAllowed(request.headers.get('x-telegram-init-data') || '')) return NextResponse.json({ error: 'Fadlan Telegram-ka ka fur ama login samee.' }, { status: 403 });
      const page = Math.floor(Math.max(1, Math.min(100000, Number(params.get('page')) || 1)));
      const search = (params.get('search') || '').trim().slice(0, 100);
      const where = { companyId, ...(search ? { OR: [{ productName: { contains: search, mode: 'insensitive' as const } }, { orderNumber: { contains: search, mode: 'insensitive' as const } }] } : {}) };
      const todayStart = nairobiStart();
      const tomorrowStart = nairobiStart(1);
      const monthStart = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1, -3));
      const [rows, total, totals, todayTotals, monthTotals] = await Promise.all([
        prisma.productionOrder.findMany({ where, skip: (page - 1) * 25, take: 25, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, orderNumber: true, productName: true, quantity: true, status: true, startDate: true, createdAt: true, product: { select: { unit: true } }, workOrders: { select: { productionRate: true, assignedTo: { select: { fullName: true } } } } } }),
        prisma.productionOrder.count({ where }),
        prisma.productionOrder.aggregate({ where: { companyId, status: 'COMPLETED' }, _count: { _all: true }, _sum: { quantity: true } }),
        prisma.productionOrder.aggregate({ where: { companyId, status: 'COMPLETED', startDate: { gte: todayStart, lt: tomorrowStart } }, _count: { _all: true }, _sum: { quantity: true } }),
        prisma.productionOrder.aggregate({ where: { companyId, status: 'COMPLETED', startDate: { gte: monthStart, lt: tomorrowStart } }, _count: { _all: true }, _sum: { quantity: true } })
      ]);
      return NextResponse.json({ rows, total, page, pageSize: 25, stats: { totalBatches: totals._count._all, totalQuantity: totals._sum.quantity || 0, todayBatches: todayTotals._count._all, todayQuantity: todayTotals._sum.quantity || 0, monthBatches: monthTotals._count._all, monthQuantity: monthTotals._sum.quantity || 0 } }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const [products, employees, recent] = await Promise.all([
      prisma.productCatalog.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, unit: true, sellingPrice: true, standardCost: true },
        orderBy: { name: 'asc' }
      }),
      prisma.employee.findMany({
        where: { companyId, isActive: true },
        select: { id: true, fullName: true, role: true, department: true, productionRate: true, isPercentageLinked: true },
        orderBy: { fullName: 'asc' }
      }),
      prisma.productionOrder.findMany({
        where: { companyId, status: 'COMPLETED' },
        include: { product: { select: { sellingPrice: true, unit: true } }, workOrders: { include: { assignedTo: { select: { fullName: true } } } } },
        orderBy: { completedDate: 'desc' },
        take: 7
      })
    ]);

    return NextResponse.json({
      products: products.map(p => ({ ...p, sellingPrice: Number(p.sellingPrice), standardCost: Number(p.standardCost) })),
      employees,
      recent: recent.map(order => {
        const value = order.quantity * Number(order.product?.sellingPrice || 0);
        return {
          id: order.id, date: order.startDate, productName: order.productName, quantity: order.quantity,
          unit: order.product?.unit || 'pcs', productionValue: value,
          commissionTotal: order.workOrders.reduce((sum, w) => sum + value * Number(w.productionRate || 0) / 100, 0),
          workers: order.workOrders.map(w => ({ name: w.assignedTo?.fullName || 'Unknown', rate: Number(w.productionRate || 0) }))
        };
      })
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Production data lama soo qaadin.' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identity = identityAllowed(String(body.initData || ''));
    if (!identity) return NextResponse.json({ error: 'Telegram admin access is required.' }, { status: 403 });
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const userId = process.env.TELEGRAM_USER_ID || String((identity as any).id);
    const productId = String(body.productId || '');
    const quantity = Number(body.quantity);
    const productionDate = String(body.productionDate || new Date().toISOString().slice(0, 10));
    const workers: Array<{ employeeId: string; rate: number }> = Array.isArray(body.workers)
      ? body.workers.map((w: any) => ({ employeeId: String(w.employeeId || ''), rate: Number(w.rate) }))
      : [];

    if (!companyId || !productId || !Number.isInteger(quantity) || quantity <= 0 || !workers.length) {
      return NextResponse.json({ error: 'Product, quantity iyo ugu yaraan hal shaqaale waa qasab.' }, { status: 400 });
    }
    if (workers.some(w => !w.employeeId || !Number.isFinite(w.rate) || w.rate < 0 || w.rate > 100)) {
      return NextResponse.json({ error: 'Commission rate-ku waa inuu u dhexeeyaa 0 iyo 100.' }, { status: 400 });
    }
    if (new Set(workers.map(w => w.employeeId)).size !== workers.length) {
      return NextResponse.json({ error: 'Shaqaale isku mid ah laba jeer lama dooran karo.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async tx => {
      const product = await tx.productCatalog.findFirst({ where: { id: productId, companyId, isActive: true } });
      if (!product) throw new Error('Product-ka lama helin.');
      const employeeCount = await tx.employee.count({ where: { companyId, isActive: true, id: { in: workers.map(w => w.employeeId) } } });
      if (employeeCount !== workers.length) throw new Error('Mid ka mid ah shaqaalaha lama helin ama ma firfircoona.');

      const recipe = await tx.billOfMaterial.findMany({ where: { companyId, productId, productionOrderId: null } });
      const date = dayOnly(productionDate);
      const productionValue = quantity * Number(product.sellingPrice || 0);
      const commissions: Array<{ employeeId: string; rate: number; amount: number }> = workers.map(w => ({ ...w, amount: productionValue * w.rate / 100 }));
      const commissionTotal = commissions.reduce((sum: number, w) => sum + w.amount, 0);

      for (const item of recipe) {
        const required = item.quantity * quantity;
        const material = await tx.factoryMaterial.findFirst({ where: { companyId, name: item.materialName } });
        if (!material) throw new Error(`${item.materialName} inventory-ga lagama helin.`);
        if (Number(material.inStock) < required) throw new Error(`${item.materialName} kuma filna wax-soo-saarkan.`);
      }

      const order = await tx.productionOrder.create({ data: {
        companyId, productId, productName: product.name, quantity, status: 'COMPLETED', priority: 'MEDIUM',
        startDate: date, completedDate: date, orderNumber: `TG-PO-${Date.now()}`,
        notes: String(body.notes || 'Telegram Mini App daily production')
      } });

      let finishedGood = await tx.factoryMaterial.findFirst({ where: { companyId, name: product.name } });
      if (finishedGood) {
        await tx.factoryMaterial.update({ where: { id: finishedGood.id }, data: { inStock: { increment: quantity } } });
      } else {
        await tx.factoryMaterial.create({ data: {
          companyId, userId, name: product.name, sku: `FG-${Date.now().toString().slice(-7)}`, category: 'Finished Goods',
          unit: product.unit || 'pcs', inStock: quantity, minStock: 5, purchasePrice: Number(product.standardCost || 0),
          sellingPrice: Number(product.sellingPrice || 0), location: 'Warehouse'
        } });
      }

      let materialCost = 0;
      for (const item of recipe) {
        const required = item.quantity * quantity;
        const material = await tx.factoryMaterial.findFirstOrThrow({ where: { companyId, name: item.materialName } });
        const cost = required * Number(material.purchasePrice || 0);
        materialCost += cost;
        await tx.factoryMaterial.update({ where: { id: material.id }, data: { inStock: { decrement: required } } });
        await tx.manufacturingUsed.create({ data: { companyId, productionOrderId: order.id, materialName: item.materialName, quantityUsed: required, unit: material.unit || item.unit, costPerUnit: Number(material.purchasePrice || 0), totalCost: cost, usedDate: date } });
      }

      await tx.costTracking.create({ data: { companyId, productionOrderId: order.id, actualMaterialCost: materialCost, actualLaborCost: commissionTotal, overheadCost: 0, notes: 'Mini App production commission calculated automatically' } });

      for (const worker of commissions) {
        await tx.employeeAttendance.upsert({ where: { employeeId_date: { employeeId: worker.employeeId, date } }, update: { worked: true }, create: { employeeId: worker.employeeId, date, worked: true } });
        await tx.workOrder.create({ data: {
          companyId, productionOrderId: order.id, assignedToId: worker.employeeId, stage: 'Daily Production',
          description: `${product.name} · ${quantity} ${product.unit} · Commission ${worker.amount.toFixed(2)} ETB`,
          estimatedHours: 8, actualHours: 8, status: 'COMPLETED', startTime: date, endTime: date,
          productionRate: worker.rate, notes: `Commission due: ${worker.amount.toFixed(2)} ETB`
        } });
      }

      return { orderId: order.id, productName: product.name, quantity, productionValue, commissionTotal, commissions };
    });

    return NextResponse.json({ success: true, production: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Production-ka lama kaydin.' }, { status: 500 });
  }
}
