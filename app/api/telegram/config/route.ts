import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        if (!companyId) {
            return NextResponse.json({ error: 'TELEGRAM_COMPANY_ID not configured in .env' }, { status: 400 });
        }

        const [employees, accounts, categories, vendors, materials] = await Promise.all([
            prisma.employee.findMany({
                where: { companyId, isActive: true },
                select: { id: true, fullName: true, role: true, phone: true, phoneNumber: true, monthlySalary: true, salaryPaidThisMonth: true },
                orderBy: { fullName: 'asc' }
            }),
            prisma.account.findMany({
                where: { companyId, isActive: true },
                select: { id: true, name: true, balance: true, currency: true },
                orderBy: { name: 'asc' }
            }),
            prisma.expenseCategory.findMany({
                where: { companyId },
                select: { id: true, name: true, type: true },
                orderBy: { name: 'asc' }
            }),
            prisma.shopVendor.findMany({
                where: { companyId },
                select: { id: true, name: true, type: true },
                orderBy: { name: 'asc' }
            }),
            prisma.factoryMaterial.findMany({
                where: { companyId },
                select: { id: true, name: true, unit: true, inStock: true, purchasePrice: true },
                orderBy: { name: 'asc' }
            })
        ]);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch paid salary expenses in current month for dynamic employee salary calculations
        const paidSalaryExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                paymentStatus: 'PAID',
                createdAt: { gte: startOfMonth }
            },
            select: { employeeId: true, amount: true, description: true }
        });

        const employeePaidMap: Record<string, number> = {};
        paidSalaryExpenses.forEach(exp => {
            if (exp.employeeId) {
                employeePaidMap[exp.employeeId] = (employeePaidMap[exp.employeeId] || 0) + Number(exp.amount);
            }
            employees.forEach(emp => {
                if (exp.description && exp.description.toLowerCase().includes(emp.fullName.toLowerCase())) {
                    // Avoid double counting if employeeId was already set
                    if (!exp.employeeId) {
                        employeePaidMap[emp.id] = (employeePaidMap[emp.id] || 0) + Number(exp.amount);
                    }
                }
            });
        });

        return NextResponse.json({
            employees: employees.map(e => {
                const paidThisMonth = employeePaidMap[e.id] !== undefined ? employeePaidMap[e.id] : Number(e.salaryPaidThisMonth || 0);
                return {
                    id: e.id,
                    fullName: e.fullName,
                    role: e.role,
                    phone: e.phone || e.phoneNumber || '',
                    monthlySalary: Number(e.monthlySalary || 0),
                    paidThisMonth,
                    dueThisMonth: Math.max(0, Number(e.monthlySalary || 0) - paidThisMonth)
                };
            }),
            accounts: accounts.map(a => ({
                id: a.id,
                name: a.name,
                balance: a.balance,
                currency: a.currency
            })),
            categories: categories.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type
            })),
            vendors: vendors.map(v => ({
                id: v.id,
                name: v.name,
                type: v.type
            })),
            materials: materials.map(m => ({
                id: m.id,
                name: m.name,
                unit: m.unit,
                inStock: m.inStock,
                purchasePrice: m.purchasePrice
            }))
        });
    } catch (e: any) {
        console.error('Error fetching telegram config:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
