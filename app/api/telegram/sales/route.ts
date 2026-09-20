import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';
type PaymentAllocationInput = { incomingPaymentId: string; amount: number };
type SaleItemInput = { productId: string; quantity: number; unitPrice: number };

function identityAllowed(initData: string) {
  const identity = verifyTelegramInitData(initData || '');
  if (process.env.APP_ENV === 'local') return identity || { id: process.env.TELEGRAM_USER_ID || 'local-admin' };
  return identity && isTelegramFinancialAdmin(identity as any) ? identity : null;
}
function money(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

export async function GET() {
  try {
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const [products, customers, accounts] = await Promise.all([
      prisma.factoryMaterial.findMany({ where: { companyId, inStock: { gt: 0 } }, select: { id: true, name: true, sku: true, inStock: true, sellingPrice: true, unit: true }, orderBy: { name: 'asc' }, take: 250 }),
      prisma.customer.findMany({ where: { companyId }, select: { id: true, name: true, phone: true, phoneNumber: true }, orderBy: { name: 'asc' }, take: 250 }),
      prisma.account.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, balance: true, currency: true }, orderBy: { name: 'asc' } })
    ]);
    let incomingPayments: any[] = [];
    try {
      incomingPayments = await prisma.incomingPayment.findMany({ where: { companyId, status: { in: ['UNMATCHED', 'PARTIALLY_ALLOCATED'] } }, include: { account: { select: { id: true, name: true } } }, orderBy: { receivedAt: 'desc' }, take: 100 });
    } catch (error) {
      console.warn('Incoming payment queue unavailable until its migration is applied.', error);
    }
    return NextResponse.json({
      products: products.map(p => ({ ...p, inStock: Number(p.inStock), sellingPrice: Number(p.sellingPrice) })),
      customers,
      accounts: accounts.map(a => ({ ...a, balance: Number(a.balance) })),
      incomingPayments: incomingPayments.map(payment => {
        const amount = money(payment.amount);
        const allocatedAmount = money(payment.allocatedAmount);
        return { id: payment.id, accountId: payment.accountId, accountName: payment.account.name, provider: payment.provider, providerReference: payment.providerReference, senderName: payment.senderName, senderPhone: payment.senderPhone, amount, allocatedAmount, availableAmount: Math.max(0, money(amount - allocatedAmount)), receivedAt: payment.receivedAt };
      })
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database lama la xiriirin.' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identity = identityAllowed(String(body.initData || ''));
    if (!identity) return NextResponse.json({ error: 'Telegram admin access is required.' }, { status: 403 });
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const userId = process.env.TELEGRAM_USER_ID || String((identity as any).id);
    const items: SaleItemInput[] = Array.isArray(body.items) ? body.items.map((item: any): SaleItemInput => ({ productId: String(item.productId || ''), quantity: Number(item.quantity), unitPrice: money(item.unitPrice) })) : [];
    const allocationInputs: PaymentAllocationInput[] = Array.isArray(body.paymentAllocations) ? body.paymentAllocations.map((payment: any) => ({ incomingPaymentId: String(payment.incomingPaymentId || ''), amount: money(payment.amount) })) : [];
    if (!companyId || !items.length || items.some(item => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.unitPrice <= 0)) return NextResponse.json({ error: 'Product, quantity iyo price waa qasab.' }, { status: 400 });
    if (allocationInputs.some(payment => !payment.incomingPaymentId || payment.amount <= 0)) return NextResponse.json({ error: 'Lacagta la dooranayo waa inay leedahay amount sax ah.' }, { status: 400 });
    if (new Set(allocationInputs.map(payment => payment.incomingPaymentId)).size !== allocationInputs.length) return NextResponse.json({ error: 'Hal incoming payment hal mar oo keliya ayaad sale-kan ku xiriirin kartaa.' }, { status: 400 });
    const subtotal = money(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    const requestedPaidAmount = Math.max(0, Math.min(money(body.paidAmount), subtotal));
    const result = await prisma.$transaction(async tx => {
      const materials = await tx.factoryMaterial.findMany({ where: { companyId, id: { in: items.map(item => item.productId) } }, select: { id: true, name: true, inStock: true, purchasePrice: true } });
      const materialMap = new Map(materials.map(material => [material.id, material]));
      for (const item of items) {
        const material = materialMap.get(item.productId);
        if (!material) throw new Error('Product-ka inventory-ga kama helin.');
        if (Number(material.inStock) < item.quantity) throw new Error(material.name + ' stock kuma filna.');
      }
      if (body.customerId) {
        const customer = await tx.customer.findFirst({ where: { id: String(body.customerId), companyId }, select: { id: true } });
        if (!customer) throw new Error('Customer-ka lama helin.');
      }
      let paidAmount = requestedPaidAmount;
      let saleAccountId = body.accountId ? String(body.accountId) : null;
      let resolvedAllocations: Array<{ incomingPaymentId: string; amount: number; accountId: string; originalAmount: number; originalAllocated: number }> = [];
      if (allocationInputs.length) {
        const incomingPayments = await tx.incomingPayment.findMany({ where: { companyId, id: { in: allocationInputs.map(payment => payment.incomingPaymentId) }, status: { in: ['UNMATCHED', 'PARTIALLY_ALLOCATED'] } }, select: { id: true, accountId: true, amount: true, allocatedAmount: true } });
        const paymentMap = new Map(incomingPayments.map(payment => [payment.id, payment]));
        if (paymentMap.size !== allocationInputs.length) throw new Error('Mid ka mid ah lacagaha la doortay lama heli karo ama hore ayaa loo meeleeyay.');
        resolvedAllocations = allocationInputs.map(input => {
          const payment = paymentMap.get(input.incomingPaymentId)!;
          const originalAmount = money(payment.amount);
          const originalAllocated = money(payment.allocatedAmount);
          if (input.amount > money(originalAmount - originalAllocated) + 0.001) throw new Error('Amount-ka aad dooratay wuxuu ka badan yahay lacagta aan weli la meeleyn.');
          return { incomingPaymentId: payment.id, amount: input.amount, accountId: payment.accountId, originalAmount, originalAllocated };
        });
        paidAmount = money(resolvedAllocations.reduce((sum, payment) => sum + payment.amount, 0));
        if (paidAmount > subtotal + 0.001) throw new Error('Lacagta la meeleynayo kama badnaan karto total-ka sale-ka.');
        const accountIds = [...new Set(resolvedAllocations.map(payment => payment.accountId))];
        saleAccountId = accountIds.length === 1 ? accountIds[0] : null;
      } else if (paidAmount > 0 && saleAccountId) {
        const account = await tx.account.findFirst({ where: { id: saleAccountId, companyId, isActive: true }, select: { id: true } });
        if (!account) throw new Error('Account-ka lama helin.');
      }
      const paymentStatus = paidAmount >= subtotal ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
      const invoiceNumber = 'AN-TG-' + Date.now().toString().slice(-8);
      const sale = await tx.sale.create({
        data: {
          invoiceNumber, userId, companyId, customerId: body.customerId || null, accountId: saleAccountId,
          subtotal, tax: 0, total: subtotal, paidAmount, paymentMethod: String(body.paymentMethod || 'CASH'), paymentStatus, status: 'Completed',
          notes: String(body.note || 'Telegram Mini App sale'),
          items: { create: items.map(item => { const material = materialMap.get(item.productId)!; return { productId: material.id, productName: material.name, quantity: item.quantity, unitPrice: item.unitPrice, total: item.quantity * item.unitPrice, costPrice: Number(material.purchasePrice || 0), totalCost: Number(material.purchasePrice || 0) * item.quantity }; }) },
          ...(resolvedAllocations.length ? { paymentAllocations: { create: resolvedAllocations.map(payment => ({ incomingPaymentId: payment.incomingPaymentId, amount: payment.amount })) } } : {})
        },
        include: { items: true, paymentAllocations: true }
      });
      for (const item of items) {
        const updated = await tx.factoryMaterial.updateMany({ where: { id: item.productId, companyId, inStock: { gte: item.quantity } }, data: { inStock: { decrement: item.quantity } } });
        if (updated.count !== 1) throw new Error('Stock-ku isbeddelay; fadlan mar kale isku day.');
      }
      if (resolvedAllocations.length) {
        for (const payment of resolvedAllocations) {
          const nextAllocatedAmount = money(payment.originalAllocated + payment.amount);
          await tx.incomingPayment.update({ where: { id: payment.incomingPaymentId }, data: { allocatedAmount: nextAllocatedAmount, status: nextAllocatedAmount >= payment.originalAmount - 0.001 ? 'ALLOCATED' : 'PARTIALLY_ALLOCATED' } });
        }
      } else if (paidAmount > 0 && saleAccountId) {
        // Matched payments entered the account on arrival; never credit them twice here.
        await tx.account.update({ where: { id: saleAccountId }, data: { balance: { increment: paidAmount } } });
        await tx.transaction.create({ data: { description: 'Iibka ' + invoiceNumber, amount: paidAmount, type: 'INCOME', accountId: saleAccountId, companyId, userId, customerId: body.customerId || null, transactionDate: new Date(), category: paymentStatus === 'Partial' ? 'Sales Deposit / Dayn Qayb Bixin' : 'Sales Income', note: 'Telegram Mini App · ' + paymentStatus } });
      }
      return sale;
    });
    return NextResponse.json({ success: true, sale: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sale lama kaydin.' }, { status: 500 });
  }
}
