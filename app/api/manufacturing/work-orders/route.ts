import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch all work orders for the company

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
  const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workOrders = await prisma.workOrder.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    );
  }
}

// POST - Create a new work order
export async function POST(request: NextRequest) {
  try {
  const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      stage,
      description,
      estimatedHours,
      actualHours,
      status,
      startTime,
      endTime,
      notes,
      productionOrderId,
      assignedToId,
    } = body;

    // Validate required fields
    if (!stage || !description || !productionOrderId) {
      return NextResponse.json(
        { error: 'Stage, description, and production order ID are required' },
        { status: 400 }
      );
    }

    // Check if production order exists
    const productionOrder = await prisma.productionOrder.findFirst({
      where: {
        id: productionOrderId,
        companyId: session.user.companyId,
      },
    });

    if (!productionOrder) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // Check if assigned employee exists (if provided)
    if (assignedToId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: assignedToId,
          companyId: session.user.companyId,
        },
      });

      if (!employee) {
        return NextResponse.json(
          { error: 'Assigned employee not found' },
          { status: 404 }
        );
      }
    }

    // Create work order


    const workOrder = await prisma.workOrder.create({
      data: {
        stage,
        description,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        actualHours: actualHours ? parseFloat(actualHours) : null,
        status: status || 'PENDING',
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        notes,
        companyId: session.user.companyId,
        productionOrderId,
        assignedToId: assignedToId || null,
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    );
  }
}

