import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get a specific bill of material

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billOfMaterialId = params.id;

    const billOfMaterial = await prisma.billOfMaterial.findFirst({
      where: {
        id: billOfMaterialId,
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
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!billOfMaterial) {
      return NextResponse.json(
        { error: 'Bill of material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(billOfMaterial);
  } catch (error) {
    console.error('Error fetching bill of material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill of material' },
      { status: 500 }
    );
  }
}

// PUT - Update a bill of material
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billOfMaterialId = params.id;
    const body = await request.json();
    const {
      materialName,
      quantity,
      unit,
      costPerUnit,
      totalCost,
      notes,
      productId,
    } = body;

    // Validate required fields
    if (!materialName || !quantity || !costPerUnit) {
      return NextResponse.json(
        { error: 'Material name, quantity, and cost per unit are required' },
        { status: 400 }
      );
    }

    // Check if bill of material exists
    const existingBillOfMaterial = await prisma.billOfMaterial.findFirst({
      where: {
        id: billOfMaterialId,
        companyId: session.user.companyId,
      },
    });

    if (!existingBillOfMaterial) {
      return NextResponse.json(
        { error: 'Bill of material not found' },
        { status: 404 }
      );
    }

    // Update bill of material
    const updatedBillOfMaterial = await prisma.billOfMaterial.update({
      where: {
        id: billOfMaterialId,
      },
      data: {
        materialName,
        quantity: parseFloat(quantity),
        unit: unit || 'pcs',
        costPerUnit: parseFloat(costPerUnit),
        totalCost: parseFloat(totalCost) || parseFloat(quantity) * parseFloat(costPerUnit),
        notes,
        productId: productId || null,
      },
    });

    return NextResponse.json(updatedBillOfMaterial);
  } catch (error) {
    console.error('Error updating bill of material:', error);
    return NextResponse.json(
      { error: 'Failed to update bill of material' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bill of material
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billOfMaterialId = params.id;

    // Check if bill of material exists
    const existingBillOfMaterial = await prisma.billOfMaterial.findFirst({
      where: {
        id: billOfMaterialId,
        companyId: session.user.companyId,
      },
    });

    if (!existingBillOfMaterial) {
      return NextResponse.json(
        { error: 'Bill of material not found' },
        { status: 404 }
      );
    }

    // Delete bill of material


    await prisma.billOfMaterial.delete({
      where: {
        id: billOfMaterialId,
      },
    });

    return NextResponse.json({ message: 'Bill of material deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill of material:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill of material' },
      { status: 500 }
    );
  }
}

