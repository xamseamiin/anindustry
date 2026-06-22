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
                orderBy: { fullName: 'asc' }
            }),
            prisma.account.findMany({
                where: { companyId, isActive: true },
                orderBy: { name: 'asc' }
            }),
            prisma.expenseCategory.findMany({
                where: { companyId },
                orderBy: { name: 'asc' }
            }),
            prisma.shopVendor.findMany({
                where: { companyId },
                orderBy: { name: 'asc' }
            }),
            prisma.factoryMaterial.findMany({
                where: { companyId },
                orderBy: { name: 'asc' }
            })
        ]);

        return NextResponse.json({
            employees: employees.map(e => ({
                id: e.id,
                fullName: e.fullName,
                role: e.role,
                monthlySalary: Number(e.monthlySalary || 0),
                paidThisMonth: Number(e.salaryPaidThisMonth || 0),
                dueThisMonth: Math.max(0, Number(e.monthlySalary || 0) - Number(e.salaryPaidThisMonth || 0))
            })),
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

