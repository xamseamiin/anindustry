import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

        const employee = await prisma.employee.findUnique({
            where: { id: params.id, companyId: user.companyId },
            include: {
                companyLaborRecords: {
                    orderBy: { dateWorked: 'desc' },
                },
                laborRecords: {
                    include: { project: true },
                    orderBy: { dateWorked: 'desc' },
                },
                sales: {
                    orderBy: { createdAt: 'desc' },
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Calculations for Daily Workers
        let totalDailyEarned = 0;
        let totalDailyPaid = 0;

        employee.companyLaborRecords.forEach(record => {
            totalDailyEarned += Number(record.agreedWage || 0);
            totalDailyPaid += Number(record.paidAmount || 0);
        });

        employee.laborRecords.forEach(record => {
            totalDailyEarned += Number(record.agreedWage || 0);
            totalDailyPaid += Number(record.paidAmount || 0);
        });

        const dailyBalance = totalDailyEarned - totalDailyPaid;

        // Calculations for Commission (assuming 5% for display, or just total sales)
        const totalSalesAmount = employee.sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        
        // Return complete data
        return NextResponse.json({ 
            success: true, 
            employee: {
                ...employee,
                dailyCalculations: {
                    totalEarned: totalDailyEarned,
                    totalPaid: totalDailyPaid,
                    balance: dailyBalance
                },
                monthlyCalculations: {
                    monthlySalary: Number(employee.monthlySalary || 0),
                    salaryPaidThisMonth: Number(employee.salaryPaidThisMonth || 0),
                    balance: Number(employee.monthlySalary || 0) - Number(employee.salaryPaidThisMonth || 0)
                },
                commissionCalculations: {
                    totalSales: totalSalesAmount,
                }
            } 
        });
    } catch (error) {
        console.error('Error fetching employee details:', error);
        return NextResponse.json({ error: 'Failed to fetch employee details' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
        const { fullName, role, department, phone, monthlySalary, isActive } = body;

        const updatedEmployee = await prisma.employee.update({
            where: { id: params.id, companyId: user.companyId },
            data: {
                fullName,
                role,
                department,
                phone,
                monthlySalary: monthlySalary ? parseFloat(monthlySalary) : 0,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json({ success: true, employee: updatedEmployee });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

