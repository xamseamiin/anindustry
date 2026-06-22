// app/api/manufacturing/production-orders/[id]/route.ts - Single Production Order API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/production-orders/[id] - Soo deji amarka warshadaha gaar ah

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    const order = await prisma.productionOrder.findFirst({
      where: { id, companyId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            standardCost: true,
            sellingPrice: true
          }
        },
        billOfMaterials: {
          orderBy: { createdAt: 'asc' }
        },
        workOrders: {
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ message: 'Amarka warshadaha lama helin.' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka amarka warshadaha ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/manufacturing/production-orders/[id] - Cusboonaysii amarka warshadaha
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    // Verify order exists and belongs to company
    const existingOrder = await prisma.productionOrder.findFirst({
      where: { id, companyId },
      include: {
        billOfMaterials: true
      }
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Amarka warshadaha lama helin.' }, { status: 404 });
    }

    // Check if Status is changing to COMPLETED
    const isCompleting = body.status === 'COMPLETED' && existingOrder.status !== 'COMPLETED';

    if (isCompleting) {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id || 'SYSTEM';

      // Run logic in a transaction
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // 1. Deduct Raw Materials
        for (const bom of existingOrder.billOfMaterials) {
          // Find correct inventory item by name
          const materialItem = await tx.factoryMaterial.findFirst({
            where: {
              name: bom.materialName,
              companyId
            }
          });

          if (materialItem) {
            await tx.factoryMaterial.update({
              where: { id: materialItem.id },
              data: { inStock: { decrement: bom.quantity * existingOrder.quantity } }
            });
          }
        }

        // 2. Add Finished Goods
        const productItem = await tx.factoryMaterial.findFirst({
          where: {
            name: existingOrder.productName,
            companyId
          }
        });

        if (productItem) {
          await tx.factoryMaterial.update({
            where: { id: productItem.id },
            data: { inStock: { increment: existingOrder.quantity } }
          });
        } else {
          // Create if not exists (Auto-create finished good in inventory)
          await tx.factoryMaterial.create({
            data: {
              name: existingOrder.productName,
              sku: `FG-${Math.random().toString(36).substring(7).toUpperCase()}`,
              category: 'Finished Goods',
              unit: 'pcs',
              inStock: existingOrder.quantity,
              minStock: 0,
              purchasePrice: 0,
              sellingPrice: 0,
              companyId,
              userId: userId
            }
          });
        }

        // 3. Update Order Status
        return await tx.productionOrder.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date(),
            notes: body.notes || existingOrder.notes
          },
          include: {
            customer: { select: { id: true, name: true } },
            billOfMaterials: true,
            workOrders: true
          }
        });
      });

      // Log Audit Action (Completion)
      if (session?.user?.id) {
        await logAudit({
          action: 'COMPLETE_PRODUCTION_ORDER',
          entity: 'ProductionOrder',
          entityId: id,
          details: `Completed order ${existingOrder.orderNumber} for ${existingOrder.productName}`,
          userId: session.user.id,
          companyId,
          userAgent: request.headers.get('user-agent') || undefined
        });
      }

      return NextResponse.json(
        {
          message: 'Amarka waa la dhammeeyay, kaydkana waa la cusboonaysiiyay!',
          order: updatedOrder
        },
        { status: 200 }
      );

    } else {
      // Standard Update (Not Completing) details
      const updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          orderNumber: body.orderNumber,
          productName: body.productName,
          quantity: body.quantity ? parseInt(body.quantity) : undefined,
          status: body.status,
          priority: body.priority,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          notes: body.notes,
          customerId: body.customerId,
          productId: body.productId,
        },
        include: {
          customer: { select: { id: true, name: true } },
          billOfMaterials: true,
          workOrders: true
        }
      });

      // Log Audit Action (Update)
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await logAudit({
          action: 'UPDATE_PRODUCTION_ORDER',
          entity: 'ProductionOrder',
          entityId: id,
          details: `Updated production order ${updatedOrder.orderNumber} (Status: ${updatedOrder.status})`,
          userId: session.user.id,
          companyId,
          userAgent: request.headers.get('user-agent') || undefined
        });
      }

      return NextResponse.json(
        {
          message: 'Amarka warshadaha si guul leh ayaa la cusboonaysiiyay!',
          order: updatedOrder
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error(`Cilad ayaa dhacday marka amarka warshadaha ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/manufacturing/production-orders/[id] - Tirtir amarka warshadaha
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    // Verify order exists and belongs to company
    const existingOrder = await prisma.productionOrder.findFirst({
      where: { id, companyId }
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Amarka warshadaha lama helin.' }, { status: 404 });
    }

    // Delete order (cascade will handle related records)
    await prisma.productionOrder.delete({
      where: { id }
    });

    // Log Audit Action (Delete)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await logAudit({
        action: 'DELETE_PRODUCTION_ORDER',
        entity: 'ProductionOrder',
        entityId: id,
        details: `Deleted production order ${existingOrder.orderNumber} for ${existingOrder.productName}`,
        userId: session.user.id,
        companyId,
        userAgent: request.headers.get('user-agent') || undefined
      });
    }

    return NextResponse.json(
      { message: 'Amarka warshadaha si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka amarka warshadaha ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
