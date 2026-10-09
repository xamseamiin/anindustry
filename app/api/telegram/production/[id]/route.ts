// app/api/telegram/production/[id]/route.ts - AN-Industory Telegram Production Edit & Delete API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTelegramPermission } from '@/lib/telegram-access';

export const dynamic = 'force-dynamic';

// DELETE /api/telegram/production/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    const access = await requireTelegramPermission(initData, 'addProduction');
    if (!access) return NextResponse.json({ error: 'Production delete fasax uma lihid.' }, { status: 403 });

    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const { id } = params;

    const order = await prisma.productionOrder.findFirst({
      where: { companyId, OR: [{ id }, { orderNumber: id }] }
    });

    if (!order) return NextResponse.json({ error: 'Production order lama helin.' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Revert finished product stock if completed
      if (order.status === 'COMPLETED' && order.productId) {
        await tx.factoryMaterial.updateMany({
          where: { companyId, name: order.productName },
          data: { inStock: { decrement: order.quantity } }
        });
      }
      await tx.workOrder.deleteMany({ where: { productionOrderId: order.id } });
      await tx.productionOrder.delete({ where: { id: order.id } });
    });

    return NextResponse.json({ success: true, message: 'Production order waa la tirtiray.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tirtiridu ma fashilantay.' }, { status: 500 });
  }
}

// PUT /api/telegram/production/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const initData = String(body.initData || req.headers.get('x-telegram-init-data') || '');
    const access = await requireTelegramPermission(initData, 'addProduction');
    if (!access) return NextResponse.json({ error: 'Production edit fasax uma lihid.' }, { status: 403 });

    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const { id } = params;

    const order = await prisma.productionOrder.findFirst({
      where: { companyId, OR: [{ id }, { orderNumber: id }] }
    });

    if (!order) return NextResponse.json({ error: 'Production order lama helin.' }, { status: 404 });

    const quantity = Number(body.quantity);
    const productName = body.productName ? String(body.productName).trim() : order.productName;
    const startDate = body.startDate ? new Date(body.startDate) : order.startDate;
    const status = body.status ? String(body.status) : order.status;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Tiradu waa inay ka weyn tahay 0.' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Revert stock difference if completed
      if (order.status === 'COMPLETED' && order.productId) {
        const qtyDiff = quantity - order.quantity;
        if (qtyDiff !== 0) {
          await tx.factoryMaterial.updateMany({
            where: { companyId, name: order.productName },
            data: { inStock: { increment: qtyDiff } }
          });
        }
      }

      return tx.productionOrder.update({
        where: { id: order.id },
        data: {
          quantity,
          productName,
          startDate,
          status,
          ...(body.priority ? { priority: String(body.priority) } : {})
        },
        include: { product: true, workOrders: true }
      });
    });

    return NextResponse.json({ production: updated, message: 'Production order waa la cusboonaysiiyey.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cusboonaysiintu ma fashilantay.' }, { status: 500 });
  }
}
