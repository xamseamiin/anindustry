import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/accounting/stats

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();

        // 1. Revenue (Sales)
        const sales = await prisma.sale.aggregate({
            where: {
                user: {
                    companyId: companyId
                }
            },
            _sum: { total: true }
        });
        const totalRevenue = sales._sum.total || 0;

        // 2. Cost of Goods Sold (COGS - Material cost of sold products)
        const saleItemsSum = await prisma.saleItem.aggregate({
            where: {
                sale: {
                    user: {
                        companyId: companyId
                    }
                }
            },
            _sum: { totalCost: true }
        });
        const totalCOGS = saleItemsSum._sum.totalCost || 0;

        // 3. Operational Expenses (Electricity, rent, salaries, general expenses)
        const expenses = await prisma.expense.aggregate({
            where: { companyId },
            _sum: { amount: true }
        });
        const totalExpenses = Number(expenses._sum.amount) || 0;

        // 4. Raw Stock Purchases (Asset Investment - Separated from operational expenses)
        const materialPurchases = await prisma.materialPurchase.aggregate({
            where: { companyId },
            _sum: { totalPrice: true }
        });
        const totalInventoryPurchases = materialPurchases._sum.totalPrice || 0;

        // 5. Net Operating Profit (Revenue minus COGS minus Operational Expenses)
        const netProfit = totalRevenue - totalCOGS - totalExpenses;

        // 5. Recent Transactions (Sales and Expenses)
        const recentSales = await prisma.sale.findMany({
            where: {
                user: {
                    companyId: companyId
                }
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, invoiceNumber: true, total: true, createdAt: true }
        });

        const recentExpenses = await prisma.expense.findMany({
            where: { companyId },
            take: 5,
            orderBy: { expenseDate: 'desc' },
            select: { id: true, description: true, amount: true, expenseDate: true }
        });

        // Combine and sort recent transactions
        const transactions = [
            ...recentSales.map(s => ({
                id: s.id,
                type: 'income',
                description: `Sale #${s.invoiceNumber}`,
                amount: s.total,
                date: s.createdAt
            })),
            ...recentExpenses.map(e => ({
                id: e.id,
                type: 'expense',
                description: e.description,
                amount: Number(e.amount),
                date: e.expenseDate
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

        return NextResponse.json({
            totalRevenue,
            totalExpenses,
            netProfit,
            totalInventoryPurchases,
            totalCOGS,
            transactions
        });
    } catch (error) {
        console.error('Error fetching accounting stats:', error);
        return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
    }
}
