// app/api/manufacturing/dashboard/route.ts - AN-Industory True Live Dashboard API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

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
        
        const lowStockCount = materials.filter(i => (i.inStock || 0) <= (i.minStock || 0)).length;
        
        const rawMaterials = materials
            .filter(i => i.category === 'Raw Materials')
            .slice(0, 4)
            .map(i => ({
                name: i.name,
                quantity: i.inStock,
                unit: i.unit,
                percentage: Math.min(100, ((i.inStock || 0) / ((i.minStock || 1) * 3)) * 100),
                status: (i.inStock || 0) <= (i.minStock || 0) ? 'low' : 'ok'
            }));

        const finishedGoods = materials
            .filter(i => i.category === 'Finished Goods')
            .slice(0, 4)
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

        // Material Purchases Debt (Payables)
        const purchases = await prisma.materialPurchase.findMany({
            where: { companyId },
            select: { totalPrice: true, paidAmount: true }
        });
        const payablesDebt = purchases.reduce((sum, p) => sum + (Number(p.totalPrice) - Number(p.paidAmount)), 0);

        // 5. Daily & Weekly Output Calculation
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const productionMetrics = await prisma.productionOrder.findMany({
            where: {
                companyId,
                createdAt: { gte: weekStart },
                status: 'COMPLETED'
            },
            select: { quantity: true, createdAt: true }
        });

        const dailyOutput = productionMetrics
            .filter(o => o.createdAt >= todayStart)
            .reduce((sum, o) => sum + o.quantity, 0);

        const weeklyOutput = productionMetrics.reduce((sum, o) => sum + o.quantity, 0);
        
        // Count batches today
        const batchesToday = productionMetrics.filter(o => o.createdAt >= todayStart).length;

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
            rawMaterials,
            finishedGoods,
            accounts
        });
    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ message: 'Error fetching dashboard stats', error: error.message }, { status: 500 });
    }
}
