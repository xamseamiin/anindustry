import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch all bill of materials for the company

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
  const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billOfMaterials = await prisma.billOfMaterial.findMany({
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
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(billOfMaterials);
  } catch (error) {
    console.error('Error fetching bill of materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill of materials' },
      { status: 500 }
    );
  }
}

// POST - Create a new bill of material
export async function POST(request: NextRequest) {
  try {
  const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      materialName,
      quantity,
      unit,
      costPerUnit,
      totalCost,
      notes,
      productionOrderId,
      productId,
    } = body;

    // Validate required fields
    if (!materialName || !quantity || !costPerUnit || !productionOrderId) {
      return NextResponse.json(
        { error: 'Material name, quantity, cost per unit, and production order ID are required' },
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

    // Create bill of material


    const billOfMaterial = await prisma.billOfMaterial.create({
      data: {
        materialName,
        quantity: parseFloat(quantity),
        unit: unit || 'pcs',
        costPerUnit: parseFloat(costPerUnit),
        totalCost: parseFloat(totalCost) || parseFloat(quantity) * parseFloat(costPerUnit),
        notes,
        companyId: session.user.companyId,
        productionOrderId,
        productId: productId || null,
      },
    });

    return NextResponse.json(billOfMaterial, { status: 201 });
  } catch (error) {
    console.error('Error creating bill of material:', error);
    return NextResponse.json(
      { error: 'Failed to create bill of material' },
      { status: 500 }
    );
  }
}

