import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        let companyId = session?.user?.companyId;
        const preparedBy = session?.user?.name || session?.user?.email || 'Executive Manager';

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
        const refNumber = `D-${dateStr.replace(/-/g, '')}`;

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
                expenseCategory: true,
                vendor: true,
                project: true
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

        // Calculate per-account transactions on dateStr to determine previous balance vs current balance
        const accountBalancesSummary = await Promise.all(accounts.map(async (acc) => {
            // Paid sales into this account today
            const daySales = sales.filter(s => s.accountId === acc.id).reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
            
            // Paid expenses from this account today
            const dayExpenses = expenses.filter(e => e.accountId === acc.id && (e.approved || e.paymentStatus === 'PAID' || !!e.receiptUrl)).reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const currentBalance = Number(acc.balance || 0);
            const netChangeOnDate = daySales - dayExpenses;
            const previousBalance = currentBalance - netChangeOnDate;

            return {
                id: acc.id,
                name: acc.name,
                type: acc.type,
                previousBalance,
                currentBalance,
                change: netChangeOnDate
            };
        }));

        // Separate Expenses into Project/Factory Expenses vs Company/Ops Expenses
        const projectExpenses: any[] = [];
        const companyExpenses: any[] = [];

        expenses.forEach(e => {
            const isPaid = e.approved || e.paymentStatus === 'PAID' || !!e.receiptUrl;
            if (!isPaid) return; // Only count paid in outflow statement

            const categoryLower = (e.category || '').toLowerCase();
            const isProjectOrLabor = e.projectId || categoryLower.includes('material') || categoryLower.includes('labor') || categoryLower.includes('raw') || categoryLower.includes('equipment') || categoryLower.includes('transport') || categoryLower.includes('xamaal');

            const formattedExp = {
                id: e.id,
                project: e.project?.name || (isProjectOrLabor ? 'Factory Production' : 'General'),
                category: e.category || 'General',
                employeeOrVendor: e.employee?.fullName || e.vendor?.name || e.paidFrom || '-',
                description: e.description || e.note || '-',
                amount: Number(e.amount || 0)
            };

            if (isProjectOrLabor) {
                projectExpenses.push(formattedExp);
            } else {
                companyExpenses.push(formattedExp);
            }
        });

        // Add paid material purchases to project expenses
        purchases.forEach(p => {
            if (p.paymentStatus === 'PAID') {
                projectExpenses.push({
                    id: p.id,
                    project: 'Factory Material Ingestion',
                    category: 'Material',
                    employeeOrVendor: p.vendor?.name || 'Vendor',
                    description: `${p.materialName} (${p.quantity} ${p.unit})`,
                    amount: Number(p.totalPrice || 0)
                });
            }
        });

        const totalProjectExp = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalOpsExp = companyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalOutflows = totalProjectExp + totalOpsExp;

        const openingBalance = accountBalancesSummary.reduce((sum, a) => sum + a.previousBalance, 0);
        const closingBalance = accountBalancesSummary.reduce((sum, a) => sum + a.currentBalance, 0);

        return NextResponse.json({
            success: true,
            date: dateStr,
            refNumber,
            preparedBy,
            statement: {
                openingBalance,
                totalProjectExp,
                totalOpsExp,
                totalOutflows,
                closingBalance
            },
            accountBalancesSummary,
            projectExpenses,
            companyExpenses,
            sales
        });
    } catch (error: any) {
        console.error('Error fetching daily report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
