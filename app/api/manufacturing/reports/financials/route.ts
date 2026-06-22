// app/api/manufacturing/reports/financials/route.ts - AN-Industory Financial Intelligence API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();

        // 1. Fetch all Sales for Revenue and COGS
        const sales = await prisma.sale.findMany({
            where: { companyId, status: { not: 'Refunded' } },
            include: { 
                items: {
                    include: {
                        material: true
                    }
                }
            }
        });

        // 2. Fetch all Expenses
        const expenses = await prisma.expense.findMany({
            where: { companyId }
        });

        // 3. Fetch Production Orders for Batch Profitability Table
        const batches = await prisma.productionOrder.findMany({
            where: { companyId, status: 'COMPLETED' },
            include: { 
                manufacturingUsed: true,
                costTracking: true,
                product: true
            },
            orderBy: { completedDate: 'desc' },
            take: 10
        });

        // 4. Calculate KPI Metrics
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
        const outstandingDebt = totalRevenue - totalPaid;

        // Filter out raw material purchases/raw inventory from general operating expenses
        // We no longer filter out manually recorded expenses from the Expense table.
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        
        // Calculate COGS strictly for items that were ACTUALLY sold (using precise totalCost stored in db)
        const cogs = sales.reduce((sum, s) => {
            return sum + s.items.reduce((iSum, item) => {
                return iSum + Number(item.totalCost || 0);
            }, 0);
        }, 0);

        const netProfit = totalRevenue - cogs - totalExpenses;

        // 5. Batch Profitability Mapping
        const batchProfitability = batches.map(b => {
            let cost = b.manufacturingUsed.reduce((sum, m) => sum + m.totalCost, 0) + (b.costTracking?.actualLaborCost || 0);
            if (cost === 0 && b.product) {
                cost = b.quantity * Number(b.product.standardCost || 0);
            }
            // Estimate revenue based on the product's actual catalog selling price
            const sellingPrice = Number(b.product?.sellingPrice) || 1.5;
            const estimatedRevenue = b.quantity * sellingPrice;
            return {
                id: b.id,
                orderNumber: b.orderNumber,
                productName: b.productName,
                quantity: b.quantity,
                cost: cost,
                revenue: estimatedRevenue,
                profit: estimatedRevenue - cost,
                margin: estimatedRevenue > 0 ? (((estimatedRevenue - cost) / estimatedRevenue) * 100).toFixed(1) : 0
            };
        });

        // 6. Monthly Trends (Mocking for now to show on chart)
        const monthlyTrends = [
            { month: 'Jan', revenue: 4500, cost: 3100 },
            { month: 'Feb', revenue: 5200, cost: 3800 },
            { month: 'Mar', revenue: 4800, cost: 3400 },
            { month: 'Apr', revenue: totalRevenue, cost: totalExpenses }
        ];

        return NextResponse.json({
            kpis: {
                totalRevenue,
                totalExpenses: totalExpenses,
                netProfit,
                outstandingDebt,
                profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0
            },
            batchProfitability,
            monthlyTrends
        });
    } catch (error: any) {
        console.error('Financial Report Error:', error);
        return NextResponse.json({ message: 'Error fetching financial data', error: error.message }, { status: 500 });
    }
}
