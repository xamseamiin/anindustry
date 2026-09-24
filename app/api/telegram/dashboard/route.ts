import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

function nairobiMidnight(dayOffset = 0) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day') + dayOffset, -3));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const initData = url.searchParams.get('initData') || '';
    const identity = verifyTelegramInitData(initData) || (process.env.APP_ENV === 'local' ? { id: process.env.TELEGRAM_USER_ID || 'local-admin' } : null);
    if (!identity || (process.env.APP_ENV !== 'local' && !isTelegramFinancialAdmin(identity as any))) {
      return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
    }

    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });

    const now = new Date();
    const todayStart = nairobiMidnight();
    const tomorrowStart = nairobiMidnight(1);
    const weekday = new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', weekday: 'short' });
    const weekdayNumber = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
    const weekStart = nairobiMidnight(-((weekdayNumber + 6) % 7));
    const monthParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit' }).formatToParts(now);
    const year = Number(monthParts.find(part => part.type === 'year')?.value);
    const month = Number(monthParts.find(part => part.type === 'month')?.value);
    const monthStart = new Date(Date.UTC(year, month - 1, 1, -3));

    const [materials, productCatalog, productionOrders, sales, allSales, recentSales] = await Promise.all([
      prisma.factoryMaterial.findMany({ where: { companyId }, select: { id: true, name: true, category: true, unit: true, inStock: true, minStock: true } }),
      prisma.productCatalog.findMany({ where: { companyId }, select: { name: true } }),
      prisma.productionOrder.findMany({
        where: { companyId, status: 'COMPLETED', startDate: { gte: nairobiMidnight(-6), lt: tomorrowStart } },
        select: { id: true, orderNumber: true, productName: true, quantity: true, startDate: true },
        orderBy: { startDate: 'desc' }
      }),
      prisma.sale.findMany({
        where: { companyId, status: 'Completed', createdAt: { gte: new Date(Math.min(monthStart.getTime(), nairobiMidnight(-6).getTime())), lt: tomorrowStart } },
        select: { total: true, paidAmount: true, createdAt: true, customer: { select: { id: true, name: true, phone: true, phoneNumber: true } }, items: { select: { quantity: true } } }
      }),
      prisma.sale.findMany({
        where: { companyId, status: 'Completed' },
        select: { total: true, paidAmount: true, createdAt: true, customer: { select: { id: true, name: true, phone: true, phoneNumber: true } } }
      }),
      prisma.sale.findMany({
        where: { companyId, status: 'Completed' }, take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, total: true, customer: { select: { name: true } }, items: { select: { productName: true, quantity: true } } }
      })
    ]);

    const catalogNames = new Set(productCatalog.map(product => product.name.trim().toLocaleLowerCase()));
    const isFinishedGood = (item: typeof materials[number]) => item.category?.trim().toLowerCase() === 'finished goods' || catalogNames.has(item.name.trim().toLocaleLowerCase());
    const stockRows = (rows: typeof materials) => rows
      .sort((a, b) => Number(a.inStock) - Number(b.inStock))
      .map(item => ({ id: item.id, name: item.name, quantity: Number(item.inStock || 0), unit: item.unit, minStock: Number(item.minStock || 0), low: Number(item.inStock || 0) <= Number(item.minStock || 0) }));
    const rawMaterials = stockRows(materials.filter(item => !isFinishedGood(item)));
    const finishedGoods = stockRows(materials.filter(isFinishedGood));
    const completedThisWeek = productionOrders.filter(order => order.startDate && order.startDate >= weekStart && order.startDate < tomorrowStart);
    const productionByDay = new Map<string, number>();
    for (const order of productionOrders) {
      if (!order.startDate) continue;
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(order.startDate);
      productionByDay.set(day, (productionByDay.get(day) || 0) + order.quantity);
    }
    const productionLast7Days = Array.from({ length: 7 }, (_, index) => {
      const date = nairobiMidnight(index - 6);
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(date);
      return { date: key, quantity: productionByDay.get(key) || 0 };
    });
    const salesByDay = new Map<string, { quantity: number; value: number }>();
    for (const sale of sales) {
      if (sale.createdAt < nairobiMidnight(-6)) continue;
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(sale.createdAt);
      const current = salesByDay.get(date) || { quantity: 0, value: 0 };
      current.quantity += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      current.value += Number(sale.total || 0);
      salesByDay.set(date, current);
    }
    const salesLast7Days = Array.from({ length: 7 }, (_, index) => {
      const date = nairobiMidnight(index - 6);
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(date);
      return { date: key, ...(salesByDay.get(key) || { quantity: 0, value: 0 }) };
    });
    const debtLast7Days = Array.from({ length: 7 }, (_, index) => {
      const date = nairobiMidnight(index - 6);
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(date);
      const amount = allSales.filter(sale => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(sale.createdAt) === key)
        .reduce((sum, sale) => sum + Math.max(0, Number(sale.total || 0) - Number(sale.paidAmount || 0)), 0);
      return { date: key, amount };
    });
    const soldToday = sales.filter(sale => sale.createdAt >= todayStart && sale.createdAt < tomorrowStart);
    const soldQuantity = (entries: typeof sales) => entries.reduce((sum, sale) => sum + sale.items.reduce((items, item) => items + item.quantity, 0), 0);
    const soldValue = (entries: typeof sales) => entries.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const debts = new Map<string, { name: string; phone: string | null; amount: number }>();
    let walkInDebt = 0;
    for (const sale of allSales) {
      const outstanding = Math.max(0, Number(sale.total || 0) - Number(sale.paidAmount || 0));
      if (outstanding <= 0.01) continue;
      if (!sale.customer) { walkInDebt += outstanding; continue; }
      const current = debts.get(sale.customer.id) || { name: sale.customer.name, phone: sale.customer.phone || sale.customer.phoneNumber, amount: 0 };
      current.amount += outstanding;
      debts.set(sale.customer.id, current);
    }
    const customerDebtList = [...debts.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const activity = recentSales.map(sale => ({
      id: sale.id,
      date: sale.createdAt,
      customer: sale.customer?.name || 'Walk-in customer',
      items: sale.items.map(item => `${item.productName} × ${item.quantity}`),
      amount: Number(sale.total || 0)
    }));

    return NextResponse.json({
      summary: {
        soldTodayQuantity: soldQuantity(soldToday), soldTodayValue: soldValue(soldToday),
        soldMonthQuantity: soldQuantity(sales.filter(sale => sale.createdAt >= monthStart)), soldMonthValue: soldValue(sales.filter(sale => sale.createdAt >= monthStart)),
        productionToday: productionOrders.filter(order => order.startDate && order.startDate >= todayStart && order.startDate < tomorrowStart).reduce((sum, order) => sum + order.quantity, 0),
        productionWeek: completedThisWeek.reduce((sum, order) => sum + order.quantity, 0),
        customerDebt: customerDebtList.reduce((sum, customer) => sum + customer.amount, 0) + walkInDebt,
        walkInDebt
      },
      rawMaterials, finishedGoods, customerDebtList,
      recentProduction: productionOrders.slice(0, 1).map(order => ({ ...order, quantity: Number(order.quantity) })),
      productionLast7Days, salesLast7Days, debtLast7Days, activity
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    console.error('Telegram dashboard data error:', error);
    return NextResponse.json({ error: error.message || 'Dashboard data failed to load.' }, { status: 500 });
  }
}
