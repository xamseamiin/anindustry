import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';


export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ employees: [] });
        }

        const employees = await prisma.employee.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                companyLaborRecords: true,
                laborRecords: true
            }
        });

        let totalUnpaidWages = 0;

        const formattedEmployees = employees.map(emp => {
            // Calculate unpaid for this employee
            let unpaid = 0;
            if (emp.monthlySalary) {
                unpaid += Number(emp.monthlySalary) - Number(emp.salaryPaidThisMonth || 0);
            }
            emp.companyLaborRecords.forEach(r => {
                unpaid += Number(r.agreedWage || 0) - Number(r.paidAmount || 0);
            });
            emp.laborRecords.forEach(r => {
                unpaid += Number(r.agreedWage || 0) - Number(r.paidAmount || 0);
            });

            if (emp.isActive) {
                totalUnpaidWages += unpaid;
            }

            return {
                id: emp.id,
                name: emp.fullName,
                role: emp.role,
                department: emp.department || 'General',
                status: emp.isActive ? 'Active' : 'Inactive',
                shift: 'Morning'
            };
        });

        return NextResponse.json({ 
            employees: formattedEmployees,
            stats: {
                totalUnpaidWages
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { fullName, role, department, phone, monthlySalary } = body;

        const employee = await prisma.employee.create({
            data: {
                companyId: user.companyId,
                fullName,
                role,
                department,
                phone, // Ensure schema has this
                monthlySalary: monthlySalary ? parseFloat(monthlySalary) : 0,
                salaryPaidThisMonth: 0,
            }
        });

        return NextResponse.json({ success: true, employee });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}
