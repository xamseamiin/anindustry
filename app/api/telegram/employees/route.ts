import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        if (!companyId) {
            return NextResponse.json({ error: 'TELEGRAM_COMPANY_ID not configured in .env' }, { status: 400 });
        }

        const body = await req.json();
        const { fullName, role, phone, monthlySalary, department } = body;

        if (!fullName || !fullName.trim()) {
            return NextResponse.json({ error: 'Magaca shaqaalaha waa khasab' }, { status: 400 });
        }

        const employee = await prisma.employee.create({
            data: {
                companyId,
                fullName: fullName.trim(),
                role: (role && role.trim()) ? role.trim() : 'Worker',
                phone: phone ? phone.trim() : null,
                phoneNumber: phone ? phone.trim() : null,
                monthlySalary: monthlySalary ? parseFloat(monthlySalary) : 0,
                department: department ? department.trim() : 'General',
                isActive: true,
                salaryPaidThisMonth: 0
            }
        });

        const formattedEmployee = {
            id: employee.id,
            fullName: employee.fullName,
            role: employee.role,
            phone: employee.phone || employee.phoneNumber || '',
            phoneNumber: employee.phoneNumber || employee.phone || '',
            monthlySalary: Number(employee.monthlySalary || 0),
            salaryPaidThisMonth: 0,
            paidThisMonth: 0,
            dueThisMonth: Number(employee.monthlySalary || 0)
        };

        return NextResponse.json({
            success: true,
            employee: formattedEmployee
        });
    } catch (error: any) {
        console.error('Error adding employee from Telegram:', error);
        return NextResponse.json({ error: error.message || 'Failed to add employee' }, { status: 500 });
    }
}
