import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get production schedule and capacity planning

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
  const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'weekly'; // daily, weekly, monthly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const companyId = session.user.companyId;

    switch (view) {
      case 'daily':
        return await getDailySchedule(companyId, startDate, endDate);
      case 'weekly':
        return await getWeeklySchedule(companyId, startDate, endDate);
      case 'monthly':
        return await getMonthlySchedule(companyId, startDate, endDate);
      case 'capacity':
        return await getCapacityPlanning(companyId);
      default:
        return await getWeeklySchedule(companyId, startDate, endDate);
    }
  } catch (error) {
    console.error('Error fetching production schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production schedule' },
      { status: 500 }
    );
  }
}

// POST - Update production schedule
export async function POST(request: NextRequest) {
  try {
  const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productionOrderId, startDate, dueDate, priority, assignedEmployees } = body;

    if (!productionOrderId) {
      return NextResponse.json(
        { error: 'Production order ID is required' },
        { status: 400 }
      );
    }

    // Verify production order exists
    const productionOrder = await prisma.productionOrder.findFirst({
      where: {
        id: productionOrderId,
        companyId: session.user.companyId
      }
    });

    if (!productionOrder) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // Update production order schedule
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        startDate: startDate ? new Date(startDate) : productionOrder.startDate,
        dueDate: dueDate ? new Date(dueDate) : productionOrder.dueDate,
        priority: priority || productionOrder.priority
      }
    });

    // Update work order assignments if provided
    if (assignedEmployees && assignedEmployees.length > 0) {
      const workOrders = await prisma.workOrder.findMany({
        where: {
          productionOrderId,
          companyId: session.user.companyId
        }
      });

      for (let i = 0; i < workOrders.length && i < assignedEmployees.length; i++) {
        await prisma.workOrder.update({
          where: { id: workOrders[i].id },
          data: {
            assignedToId: assignedEmployees[i]
          }
        });
      }
    }

    return NextResponse.json({
      message: 'Production schedule updated successfully',
      productionOrder: updatedOrder
    });
  } catch (error) {
    console.error('Error updating production schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update production schedule' },
      { status: 500 }
    );
  }
}

// Get daily production schedule
async function getDailySchedule(companyId: string, startDate?: string | null, endDate?: string | null) {
  const date = startDate ? new Date(startDate) : new Date();
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const dailyOrders = await prisma.productionOrder.findMany({
    where: {
      companyId,
      OR: [
        {
          startDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        {
          dueDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        {
          status: 'IN_PROGRESS'
        }
      ]
    },
    include: {
      workOrders: {
        include: {
          assignedTo: { select: { fullName: true, role: true } }
        }
      },
      customer: { select: { name: true } }
    },
    orderBy: { priority: 'desc' }
  });

  const schedule = dailyOrders.map((order: any) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    productName: order.productName,
    quantity: order.quantity,
    status: order.status,
    priority: order.priority,
    startDate: order.startDate,
    dueDate: order.dueDate,
    customer: order.customer?.name || 'N/A',
  workOrders: order.workOrders.map((wo: any) => ({
      id: wo.id,
      stage: wo.stage,
      estimatedHours: wo.estimatedHours,
      assignedTo: wo.assignedTo?.fullName || 'Unassigned',
      status: wo.status
    })),
  totalEstimatedHours: order.workOrders.reduce((sum: number, wo: any) => sum + wo.estimatedHours, 0)
  }));

  return NextResponse.json({
    view: 'daily',
    date: startOfDay.toISOString().split('T')[0],
    schedule,
    summary: {
      totalOrders: schedule.length,
  totalHours: schedule.reduce((sum: number, order: any) => sum + order.totalEstimatedHours, 0),
  inProgress: schedule.filter((o: any) => o.status === 'IN_PROGRESS').length,
  planned: schedule.filter((o: any) => o.status === 'PLANNED').length
    }
  });
}

// Get weekly production schedule
async function getWeeklySchedule(companyId: string, startDate?: string | null, endDate?: string | null) {
  const start = startDate ? new Date(startDate) : new Date();
  const weekStart = new Date(start.setDate(start.getDate() - start.getDay()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weeklyOrders = await prisma.productionOrder.findMany({
    where: {
      companyId,
      OR: [
        {
          startDate: {
            gte: weekStart,
            lte: weekEnd
          }
        },
        {
          dueDate: {
            gte: weekStart,
            lte: weekEnd
          }
        },
        {
          status: 'IN_PROGRESS'
        }
      ]
    },
    include: {
      workOrders: {
        include: {
          assignedTo: { select: { fullName: true, role: true } }
        }
      },
      customer: { select: { name: true } }
    },
    orderBy: { priority: 'desc' }
  });

  // Group by day
  const weeklySchedule = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    
  const dayOrders = weeklyOrders.filter((order: any) => {
      const orderStart = order.startDate ? new Date(order.startDate) : null;
      const orderDue = order.dueDate ? new Date(order.dueDate) : null;
      
      return (orderStart && orderStart.toDateString() === day.toDateString()) ||
             (orderDue && orderDue.toDateString() === day.toDateString()) ||
             (order.status === 'IN_PROGRESS');
    });

    return {
      date: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('en-US', { weekday: 'long' }),
  orders: dayOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        productName: order.productName,
        quantity: order.quantity,
        status: order.status,
        priority: order.priority,
        customer: order.customer?.name || 'N/A',
  totalHours: order.workOrders.reduce((sum: number, wo: any) => sum + wo.estimatedHours, 0)
      })),
      totalHours: dayOrders.reduce((sum: number, order: any) => 
        sum + order.workOrders.reduce((woSum: number, wo: any) => woSum + wo.estimatedHours, 0), 0
      )
    };
  });

  return NextResponse.json({
    view: 'weekly',
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    schedule: weeklySchedule,
    summary: {
      totalOrders: weeklyOrders.length,
  totalHours: weeklySchedule.reduce((sum: number, day: any) => sum + day.totalHours, 0),
  averageHoursPerDay: weeklySchedule.reduce((sum: number, day: any) => sum + day.totalHours, 0) / 7
    }
  });
}

// Get monthly production schedule
async function getMonthlySchedule(companyId: string, startDate?: string | null, endDate?: string | null) {
  const start = startDate ? new Date(startDate) : new Date();
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);

  const monthlyOrders = await prisma.productionOrder.findMany({
    where: {
      companyId,
      OR: [
        {
          startDate: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        {
          dueDate: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        {
          status: 'IN_PROGRESS'
        }
      ]
    },
    include: {
      workOrders: true,
      customer: { select: { name: true } }
    },
    orderBy: { priority: 'desc' }
  });

  // Group by week
  const weeklyGroups = [];
  let currentWeek = new Date(monthStart);
  
  while (currentWeek <= monthEnd) {
    const weekEnd = new Date(currentWeek);
    weekEnd.setDate(currentWeek.getDate() + 6);
    
  const weekOrders = monthlyOrders.filter((order: any) => {
      const orderStart = order.startDate ? new Date(order.startDate) : null;
      const orderDue = order.dueDate ? new Date(order.dueDate) : null;
      
      return (orderStart && orderStart >= currentWeek && orderStart <= weekEnd) ||
             (orderDue && orderDue >= currentWeek && orderDue <= weekEnd) ||
             (order.status === 'IN_PROGRESS');
    });

    weeklyGroups.push({
      weekStart: currentWeek.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      orders: weekOrders.length,
      totalHours: weekOrders.reduce((sum: number, order: any) => 
        sum + order.workOrders.reduce((woSum: number, wo: any) => woSum + wo.estimatedHours, 0), 0
      )
    });

    currentWeek.setDate(currentWeek.getDate() + 7);
  }

  return NextResponse.json({
    view: 'monthly',
    monthStart: monthStart.toISOString().split('T')[0],
    monthEnd: monthEnd.toISOString().split('T')[0],
    weeklyBreakdown: weeklyGroups,
    summary: {
      totalOrders: monthlyOrders.length,
  totalHours: weeklyGroups.reduce((sum: number, week: any) => sum + week.totalHours, 0),
  averageHoursPerWeek: weeklyGroups.reduce((sum: number, week: any) => sum + week.totalHours, 0) / weeklyGroups.length
    }
  });
}

// Get capacity planning data
async function getCapacityPlanning(companyId: string) {
  // Get all employees and their work capacity
  const employees = await prisma.employee.findMany({
    where: { companyId },
    include: {
      workOrders: {
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        },
        include: {
          productionOrder: { select: { orderNumber: true, productName: true } }
        }
      }
    }
  });

  // Get pending production orders


  const pendingOrders = await prisma.productionOrder.findMany({
    where: {
      companyId,
      status: { in: ['PLANNED', 'IN_PROGRESS'] }
    },
    include: {
      workOrders: true
    }
  });

  const employeeCapacity = employees.map((employee: any) => {
    const currentWorkload = employee.workOrders.reduce((sum: number, wo: any) => sum + wo.estimatedHours, 0);
    const maxCapacity = 40; // 40 hours per week
    const availableCapacity = Math.max(0, maxCapacity - currentWorkload);
    
    return {
      id: employee.id,
      name: employee.fullName,
      role: employee.role,
      currentWorkload,
      maxCapacity,
      availableCapacity,
      utilizationPercentage: (currentWorkload / maxCapacity) * 100,
  assignedOrders: employee.workOrders.map((wo: any) => ({
        orderNumber: wo.productionOrder?.orderNumber,
        productName: wo.productionOrder?.productName,
        stage: wo.stage,
        estimatedHours: wo.estimatedHours
      }))
    };
  });

  const totalCapacity = employeeCapacity.reduce((sum: number, emp: any) => sum + emp.maxCapacity, 0);
  const totalWorkload = employeeCapacity.reduce((sum: number, emp: any) => sum + emp.currentWorkload, 0);
  const totalAvailable = totalCapacity - totalWorkload;

  const pendingWorkload = pendingOrders.reduce((sum: number, order: any) => 
    sum + order.workOrders.reduce((woSum: number, wo: any) => woSum + wo.estimatedHours, 0), 0
  );

  return NextResponse.json({
    view: 'capacity',
    employeeCapacity,
    capacitySummary: {
      totalCapacity,
      totalWorkload,
      totalAvailable,
      pendingWorkload,
      overallUtilization: totalCapacity > 0 ? (totalWorkload / totalCapacity) * 100 : 0,
      canHandlePendingWork: totalAvailable >= pendingWorkload
    },
    recommendations: {
      needsMoreStaff: totalAvailable < pendingWorkload,
      optimalStaffing: Math.ceil(pendingWorkload / 40), // 40 hours per employee
  bottleneckEmployees: employeeCapacity.filter((emp: any) => emp.utilizationPercentage > 90)
    }
  });
}

