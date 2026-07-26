import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        let companyId = session?.user?.companyId;

        // Fallback for Telegram / headless usage
        if (!companyId) {
            companyId = process.env.TELEGRAM_COMPANY_ID;
        }

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        // Fetch Sales for the day
        const sales = await prisma.sale.findMany({
            where: {
                companyId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                customer: true,
                account: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch Expenses for the day
        const expenses = await prisma.expense.findMany({
            where: {
                companyId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                employee: true,
                account: true,
                expenseCategory: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch Material Purchases for the day
        const purchases = await prisma.materialPurchase.findMany({
            where: {
                companyId,
                purchaseDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                vendor: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch Accounts for company
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            orderBy: { name: 'asc' }
        });

        // Aggregations
        const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
        const totalSalesPaid = sales.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);

        const paidExpenses = expenses.filter(e => e.approved || e.paymentStatus === 'PAID' || !!e.receiptUrl);
        const pendingExpenses = expenses.filter(e => !e.approved && e.paymentStatus !== 'PAID' && !e.receiptUrl);

        const totalPaidExpensesAmount = paidExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const totalPendingExpensesAmount = pendingExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const paidPurchases = purchases.filter(p => p.paymentStatus === 'PAID');
        const totalPaidPurchasesAmount = paidPurchases.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);

        const netDailyCashflow = totalSalesPaid - (totalPaidExpensesAmount + totalPaidPurchasesAmount);

        // Group Expenses by Category
        const expensesByCategory: Record<string, { count: number; total: number }> = {};
        expenses.forEach(e => {
            const cat = e.category || 'Dukaanka / Guud';
            if (!expensesByCategory[cat]) {
                expensesByCategory[cat] = { count: 0, total: 0 };
            }
            expensesByCategory[cat].count += 1;
            expensesByCategory[cat].total += Number(e.amount || 0);
        });

        // Detailed Sales summary
        const salesItemsSummary: Record<string, { quantity: number; revenue: number }> = {};
        sales.forEach(s => {
            s.items.forEach((item: any) => {
                const name = item.productName || 'Alaab';
                if (!salesItemsSummary[name]) {
                    salesItemsSummary[name] = { quantity: 0, revenue: 0 };
                }
                salesItemsSummary[name].quantity += item.quantity;
                salesItemsSummary[name].revenue += Number(item.quantity * item.unitPrice);
            });
        });

        return NextResponse.json({
            success: true,
            date: dateStr,
            summary: {
                totalSalesRevenue,
                totalSalesPaid,
                totalPaidExpensesAmount,
                totalPendingExpensesAmount,
                totalPaidPurchasesAmount,
                netDailyCashflow,
                salesCount: sales.length,
                expensesCount: expenses.length,
                purchasesCount: purchases.length
            },
            expensesByCategory: Object.entries(expensesByCategory).map(([category, val]) => ({
                category,
                count: val.count,
                total: val.total
            })),
            salesItemsSummary: Object.entries(salesItemsSummary).map(([productName, val]) => ({
                productName,
                quantity: val.quantity,
                revenue: val.revenue
            })),
            sales,
            expenses,
            purchases,
            accounts
        });
    } catch (error: any) {
        console.error('Error fetching daily report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
