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
        
        // Calculations for production percentage workers
        const completedWorkOrders = await prisma.workOrder.findMany({
            where: {
                assignedToId: params.id,
                status: 'COMPLETED',
                productionOrder: { status: 'COMPLETED' }
            },
            include: {
                productionOrder: {
                    include: { product: true }
                }
            },
            orderBy: { endTime: 'desc' }
        });

        const productionEarningsList = completedWorkOrders.map(wo => {
            const qty = wo.productionOrder.quantity;
            const price = Number(wo.productionOrder.product?.sellingPrice || wo.productionOrder.product?.standardCost || 2.0);
            const value = qty * price;
            const rate = employee.productionRate || 0.0;
            const earned = value * (rate / 100);
            return {
                id: wo.id,
                date: wo.endTime || wo.createdAt,
                productName: wo.productionOrder.productName,
                quantity: qty,
                sellingPrice: price,
                totalValue: value,
                rate: rate,
                earned: earned
            };
        });

        const totalProductionEarned = productionEarningsList.reduce((sum, item) => sum + item.earned, 0);

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
                },
                productionCalculations: {
                    totalEarned: totalProductionEarned,
                    earningsList: productionEarningsList
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
        const { fullName, role, department, phone, monthlySalary, isActive, isPercentageLinked, productionRate } = body;

        const updatedEmployee = await prisma.employee.update({
            where: { id: params.id, companyId: user.companyId },
            data: {
                fullName,
                role,
                department,
                phone,
                monthlySalary: monthlySalary ? parseFloat(monthlySalary) : 0,
                isActive: isActive ?? true,
                isPercentageLinked: isPercentageLinked === true || isPercentageLinked === 'true',
                productionRate: productionRate ? parseFloat(productionRate) : 0.0
            }
        });

        return NextResponse.json({ success: true, employee: updatedEmployee });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

