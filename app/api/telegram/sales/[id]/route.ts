// app/api/telegram/sales/[id]/route.ts - AN-Industory Telegram Sale Edit & Delete API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTelegramPermission } from '@/lib/telegram-access';

export const dynamic = 'force-dynamic';

function money(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

// DELETE /api/telegram/sales/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    const access = await requireTelegramPermission(initData, 'addSales');
    if (!access) {
      return NextResponse.json({ error: 'Sales delete fasax uma lihid.' }, { status: 403 });
    }
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const { id } = params;

    const sale = await prisma.sale.findFirst({
      where: { companyId, OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true, paymentAllocations: true }
    });

    if (!sale) return NextResponse.json({ error: 'Iibka lama helin.' }, { status: 404 });

    const closedPeriod = await prisma.financialPeriod.findFirst({
      where: {
        companyId,
        isClosed: true,
        startDate: { lte: sale.createdAt },
        endDate: { gte: sale.createdAt }
      }
    });
    if (closedPeriod) {
      return NextResponse.json({ error: 'Muddada maaliyadeed ee iibkan ku jiro waa xiran tahay.' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Restore physical stock
      for (const item of sale.items) {
        await tx.factoryMaterial.update({
          where: { id: item.productId },
          data: { inStock: { increment: item.quantity } }
        });
      }

      // Revert account balances
      const transactions = await tx.transaction.findMany({
        where: {
          companyId,
          type: 'INCOME',
          description: { in: [`Iibka ${sale.invoiceNumber}`, `Iibka #${sale.invoiceNumber}`] }
        }
      });

      for (const t of transactions) {
        if (t.accountId) {
          await tx.account.update({
            where: { id: t.accountId },
            data: { balance: { decrement: Number(t.amount) } }
          });
        }
      }

      await tx.transaction.deleteMany({
        where: { id: { in: transactions.map(t => t.id) } }
      });

      await tx.sale.delete({ where: { id: sale.id } });
    });

    return NextResponse.json({ success: true, message: 'Iibka waa la tirtiray, stock-kiina waa la soo celiyey.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tirtiridu ma fashilantay.' }, { status: 500 });
  }
}

// PUT /api/telegram/sales/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const initData = String(body.initData || req.headers.get('x-telegram-init-data') || '');
    const access = await requireTelegramPermission(initData, 'addSales');
    if (!access) {
      return NextResponse.json({ error: 'Sales edit fasax uma lihid.' }, { status: 403 });
    }

    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const userId = process.env.TELEGRAM_USER_ID || String(access.identity.id);
    const { id } = params;

    const sale = await prisma.sale.findFirst({
      where: { companyId, OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true }
    });

    if (!sale) return NextResponse.json({ error: 'Iibka lama helin.' }, { status: 404 });

    const closedPeriod = await prisma.financialPeriod.findFirst({
      where: {
        companyId,
        isClosed: true,
        startDate: { lte: sale.createdAt },
        endDate: { gte: sale.createdAt }
      }
    });
    if (closedPeriod) {
      return NextResponse.json({ error: 'Muddada maaliyadeed ee iibkan ku jiro waa xiran tahay.' }, { status: 403 });
    }

    const customerId = body.customerId ? String(body.customerId) : null;
    const accountId = body.accountId ? String(body.accountId) : null;
    const paymentMethod = String(body.paymentMethod || 'CASH');
    const saleDate = body.saleDate ? new Date(body.saleDate) : sale.createdAt;

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const normalizedItems = rawItems.map((item: any) => ({
      productId: String(item.productId || ''),
      productName: String(item.productName || '').trim(),
      quantity: Number(item.quantity) || 1,
      unitPrice: money(item.unitPrice),
      total: (Number(item.quantity) || 1) * money(item.unitPrice)
    }));

    if (!normalizedItems.length || normalizedItems.some((i: any) => !i.productId || i.quantity <= 0)) {
      return NextResponse.json({ error: 'Safka alaabta waa inuu sax yahay.' }, { status: 400 });
    }

    const subtotal = normalizedItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = subtotal;
    const paidAmountInput = body.paidAmount !== undefined && body.paidAmount !== '' ? money(body.paidAmount) : (paymentMethod === 'CREDIT' ? 0 : total);
    const paidAmount = Math.min(total, Math.max(0, paidAmountInput));
    const paymentStatus = paidAmount >= total ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Credit';

    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Revert previous stock
      for (const item of sale.items) {
        await tx.factoryMaterial.update({
          where: { id: item.productId },
          data: { inStock: { increment: item.quantity } }
        });
      }

      // 2. Revert previous income transaction & account balance
      const oldTx = await tx.transaction.findFirst({
        where: {
          companyId,
          type: 'INCOME',
          description: { in: [`Iibka ${sale.invoiceNumber}`, `Iibka #${sale.invoiceNumber}`] }
        }
      });

      if (oldTx && oldTx.accountId) {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { decrement: Number(oldTx.amount) } }
        });
        await tx.transaction.delete({ where: { id: oldTx.id } });
      }

      // 3. Delete old items
      await tx.saleItem.deleteMany({ where: { saleId: sale.id } });

      // 4. Decrement new stock
      for (const item of normalizedItems) {
        await tx.factoryMaterial.update({
          where: { id: item.productId },
          data: { inStock: { decrement: item.quantity } }
        });
      }

      // 5. Update Sale record
      const updated = await tx.sale.update({
        where: { id: sale.id },
        data: {
          customerId,
          accountId: paymentMethod === 'CREDIT' ? null : accountId,
          paymentMethod,
          subtotal,
          total,
          paidAmount: paymentMethod === 'CASH' || paymentMethod === 'CARD' ? total : paidAmount,
          paymentStatus,
          status: 'Completed',
          createdAt: saleDate,
          items: {
            create: normalizedItems.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total
            }))
          }
        },
        include: { items: true, customer: true, account: true }
      });

      // 6. Create new transaction if paid
      if (accountId && paidAmount > 0 && paymentMethod !== 'CREDIT') {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: paidAmount } }
        });
        await tx.transaction.create({
          data: {
            description: `Iibka ${sale.invoiceNumber}`,
            amount: paidAmount,
            type: 'INCOME',
            accountId,
            companyId,
            userId,
            customerId: customerId || null,
            transactionDate: saleDate,
            category: paymentStatus === 'Partial' ? 'Sales Deposit / Dayn Qayb Bixin' : 'Sales Income',
            note: `Updated via Telegram Mini App (${paymentMethod})`
          }
        });
      }

      return updated;
    });

    return NextResponse.json({ sale: updatedSale, message: 'Iibka waa la cusboonaysiiyey.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cusboonaysiintu ma fashilantay.' }, { status: 500 });
  }
}
