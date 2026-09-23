// app/api/manufacturing/dashboard/route.ts - AN-Industory True Live Dashboard API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

function nairobiMidnight(dayOffset = 0) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
    return new Date(Date.UTC(part('year'), part('month') - 1, part('day') + dayOffset, -3));
}

export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();

        // 1. Production Stats
        const totalOrders = await prisma.productionOrder.count({ where: { companyId } });
        const activeOrders = await prisma.productionOrder.count({
            where: {
                companyId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            }
        });

        // 2. Inventory Metrics (Using factoryMaterial for Manufacturing)
        const materials = await prisma.factoryMaterial.findMany({
            where: { companyId }
        });
        
        const products = await prisma.productCatalog.findMany({ where: { companyId }, select: { name: true } });
        const productNames = new Set(products.map(product => product.name.trim().toLocaleLowerCase()));
        const isFinishedGood = (item: typeof materials[number]) => item.category?.toLowerCase() === 'finished goods' || productNames.has(item.name.trim().toLocaleLowerCase());
        const rawInventory = materials.filter(item => !isFinishedGood(item));
        const lowStockCount = rawInventory.filter(i => (i.inStock || 0) <= (i.minStock || 0)).length;
        
        const rawMaterials = materials
            .filter(i => !isFinishedGood(i))
            .sort((a, b) => Number(a.inStock) - Number(b.inStock))
            .map(i => ({
                name: i.name,
                quantity: i.inStock,
                unit: i.unit,
                percentage: Math.min(100, ((i.inStock || 0) / ((i.minStock || 1) * 3)) * 100),
                status: (i.inStock || 0) <= (i.minStock || 0) ? 'low' : 'ok'
            }));

        const finishedGoods = materials
            .filter(i => isFinishedGood(i))
            .map(i => ({
                name: i.name,
                quantity: i.inStock,
                unit: i.unit,
                percentage: Math.min(100, ((i.inStock || 0) / 5000) * 100) // 5000 as a sample target
            }));

        // 3. Recent Production History
        const recentOrders = await prisma.productionOrder.findMany({
            where: { companyId },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        // 4. Sales Stats & Debt Calculation
        const sales = await prisma.sale.findMany({
            where: { companyId },
            select: { total: true, paidAmount: true }
        });
        const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const salesDebt = sales.reduce((sum, s) => sum + (Number(s.total) - Number(s.paidAmount)), 0);

        // Include manual debts from Transactions
        const debtGivenTx = await prisma.transaction.findMany({
            where: { companyId, type: 'DEBT_GIVEN' },
            select: { amount: true }
        });
        const debtReceivedTx = await prisma.transaction.findMany({
            where: { companyId, type: 'DEBT_RECEIVED' },
            select: { amount: true }
        });
        
        const manualDebtGiven = debtGivenTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const manualDebtReceived = debtReceivedTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
        
        const receivablesDebt = salesDebt + manualDebtGiven - manualDebtReceived;

        // Material Purchases & Purchase Orders & Manual Debts (Payables)
        const purchases = await prisma.materialPurchase.findMany({
            where: { companyId },
            select: { totalPrice: true, paidAmount: true }
        });
        const mpDebt = purchases.reduce((sum, p) => sum + (Number(p.totalPrice) - Number(p.paidAmount || 0)), 0);

        const pos = await prisma.purchaseOrder.findMany({
            where: { companyId },
            select: { total: true, paidAmount: true }
        });
        const poDebt = pos.reduce((sum, p) => sum + (Number(p.total) - Number(p.paidAmount || 0)), 0);

        const debtTakenTx = await prisma.transaction.findMany({
            where: { 
                companyId, 
                type: 'DEBT_TAKEN',
                OR: [
                    { category: null },
                    { category: { not: 'Material Purchase Debt' } }
                ]
            },
            select: { amount: true }
        });
        const debtRepaidTx = await prisma.transaction.findMany({
            where: { companyId, type: 'DEBT_REPAID' },
            select: { amount: true }
        });

        const manualDebtTaken = debtTakenTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const manualDebtRepaid = debtRepaidTx.reduce((sum, tx) => sum + Number(tx.amount), 0);

        const payablesDebt = mpDebt + poDebt + manualDebtTaken - manualDebtRepaid;

        // 5. Daily & Weekly Output Calculation
        const now = new Date();
        const todayStart = nairobiMidnight();
        const tomorrowStart = nairobiMidnight(1);
        const nairobiWeekday = new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', weekday: 'short' });
        const weekdayNumber = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(nairobiWeekday);
        const weekStart = nairobiMidnight(-((weekdayNumber + 6) % 7));

        const [productionMetrics, customerSales] = await Promise.all([prisma.productionOrder.findMany({
            where: {
                companyId,
                status: 'COMPLETED',
                startDate: { gte: weekStart, lt: tomorrowStart }
            },
            select: { id: true, productName: true, quantity: true, startDate: true, orderNumber: true, status: true },
            orderBy: { startDate: 'desc' }
        }), prisma.sale.findMany({
            where: { companyId, status: 'Completed', total: { gt: 0 } },
            select: { total: true, paidAmount: true, createdAt: true, customer: { select: { id: true, name: true, phone: true, phoneNumber: true } }, items: { select: { quantity: true } } }
        })]);

        const todayOutput = productionMetrics
            .filter(o => o.startDate && o.startDate >= todayStart && o.startDate < tomorrowStart)
            .reduce((sum, o) => sum + o.quantity, 0);
        const dailyOutput = todayOutput;
        const weeklyOutput = productionMetrics.reduce((sum, o) => sum + o.quantity, 0);
        const productionByDay = new Map<string, { quantity: number; batches: number }>();
        for (const order of productionMetrics) {
            if (!order.startDate) continue;
            const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(order.startDate);
            const current = productionByDay.get(day) || { quantity: 0, batches: 0 };
            current.quantity += order.quantity;
            current.batches += 1;
            productionByDay.set(day, current);
        }
        const last7Days = Array.from({ length: 7 }, (_, index) => {
            const dayStart = nairobiMidnight(index - 6);
            const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(dayStart);
            return { date: day, ...(productionByDay.get(day) || { quantity: 0, batches: 0 }) };
        });
        const soldToday = customerSales.filter(s => s.createdAt >= todayStart && s.createdAt < tomorrowStart).reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        const soldThisWeek = customerSales.filter(s => s.createdAt >= weekStart && s.createdAt < tomorrowStart).reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        const debtsByCustomer = new Map<string, { customerId: string; name: string; phone: string | null; debt: number; invoices: number }>();
        let walkInDebt = 0;
        for (const sale of customerSales) {
            const debt = Math.max(0, Number(sale.total) - Number(sale.paidAmount));
            if (debt <= 0.01) continue;
            if (!sale.customer) { walkInDebt += debt; continue; }
            const key = sale.customer.id;
            const current = debtsByCustomer.get(key) || { customerId: key, name: sale.customer.name, phone: sale.customer.phone || sale.customer.phoneNumber, debt: 0, invoices: 0 };
            current.debt += debt;
            current.invoices += 1;
            debtsByCustomer.set(key, current);
        }
        const customerDebtList = [...debtsByCustomer.values()].sort((a, b) => b.debt - a.debt).slice(0, 10);
        const batchesToday = productionMetrics.filter(o => o.startDate && o.startDate >= todayStart && o.startDate < tomorrowStart).length;

        // Mocking lines for now as it's a fixed factory setup, but we could count unique "lines" if model exists
        const activeLines = 4; // Sample lines active

        // 6. Account Balances
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            select: { name: true, balance: true, type: true }
        });

        return NextResponse.json({
            totalOrders,
            activeOrders,
            batchesToday,
            weeklyOutput,
            activeLines,
            lowStockCount,
            recentOrders,
            totalSales,
            totalDebt: receivablesDebt, // Legacy fallback
            receivablesDebt,
            payablesDebt,
            dailyOutput,
            soldToday,
            soldThisWeek,
            rawInventoryCount: rawInventory.length,
            rawInventoryTotal: rawInventory.reduce((sum, item) => sum + Number(item.inStock || 0), 0),
            finishedInventoryTotal: materials.filter(isFinishedGood).reduce((sum, item) => sum + Number(item.inStock || 0), 0),
            last7Days,
            customerDebtList,
            walkInDebt,
            lastProductionDate: productionMetrics[0]?.startDate || null,
            rawMaterials,
            finishedGoods,
            accounts
        });
    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ message: 'Error fetching dashboard stats', error: error.message }, { status: 500 });
    }
}
