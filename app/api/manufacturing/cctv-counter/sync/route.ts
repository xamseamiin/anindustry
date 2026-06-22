import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Authenticate Session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch User Company Details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized: No associated company' }, { status: 401 });
    }

    const companyId = user.companyId;

    // 3. Parse Request Body
    const body = await req.json();
    const { productId, quantity, packSize, type, cameraName } = body;

    if (!productId || !quantity || !packSize || !type) {
      return NextResponse.json({ error: 'productId, quantity, packSize, and type are required' }, { status: 400 });
    }

    // Calculate total items to adjust (packs * items_per_pack)
    const multiplier = type === 'IN' ? 1 : -1;
    const itemAdjustment = Number(quantity) * Number(packSize) * multiplier;

    // Check if the material/product exists in FactoryMaterial
    const material = await prisma.factoryMaterial.findUnique({
      where: { id: productId }
    });

    if (!material || material.companyId !== companyId) {
      return NextResponse.json({ error: 'Material not found or unauthorized' }, { status: 404 });
    }

    // 4. Update Stock in FactoryMaterial
    const updatedMaterial = await prisma.factoryMaterial.update({
      where: { id: productId },
      data: {
        inStock: {
          increment: itemAdjustment
        }
      }
    });

    // 5. Create Audit Log
    const movementDescription = type === 'IN' ? 'wax soo galay' : 'wax baxay';
    await logAudit({
      action: 'CCTV_AI_SYNC',
      entity: 'FactoryMaterial',
      entityId: productId,
      details: `Kamarada CCTV (${cameraName || 'CCTV_Camera'}): Waxaa la diiwaan-geliyay ${quantity} baakadood oo ah (cabbirka ${packSize} xabo) oo ${movementDescription}. Stock-ga hadda waa ${updatedMaterial.inStock} ${updatedMaterial.unit}.`,
      userId: session.user.id,
      companyId: companyId
    });

    return NextResponse.json({
      success: true,
      updatedStock: updatedMaterial.inStock,
      materialName: updatedMaterial.name,
      message: 'Stock updated successfully via CCTV AI Counter'
    });

  } catch (error: any) {
    console.error('CCTV Inventory Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
