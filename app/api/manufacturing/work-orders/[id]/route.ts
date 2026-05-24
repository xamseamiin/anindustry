import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get a specific work order

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workOrderId = params.id;

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
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
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work order' },
      { status: 500 }
    );
  }
}

// PUT - Update a work order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workOrderId = params.id;
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
      assignedToId,
    } = body;

    // Validate required fields
    if (!stage || !description) {
      return NextResponse.json(
        { error: 'Stage and description are required' },
        { status: 400 }
      );
    }

    // Check if work order exists
    const existingWorkOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId,
      },
    });

    if (!existingWorkOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
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

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: {
        id: workOrderId,
      },
      data: {
        stage,
        description,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        actualHours: actualHours ? parseFloat(actualHours) : null,
        status: status || 'PENDING',
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        notes,
        assignedToId: assignedToId || null,
      },
    });

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { error: 'Failed to update work order' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a work order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workOrderId = params.id;

    // Check if work order exists
    const existingWorkOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId,
      },
    });

    if (!existingWorkOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Delete work order


    await prisma.workOrder.delete({
      where: {
        id: workOrderId,
      },
    });

    return NextResponse.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json(
      { error: 'Failed to delete work order' },
      { status: 500 }
    );
  }
}

