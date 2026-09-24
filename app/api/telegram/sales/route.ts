import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';
type PaymentAllocationInput = { incomingPaymentId: string; amount: number };
type SaleItemInput = { productId: string; quantity: number; unitPrice: number; customerId?: string | null };
type CustomerCorrectionInput = { observedName: string; customerId: string };

function identityAllowed(initData: string) {
  const identity = verifyTelegramInitData(initData || '');
  if (process.env.APP_ENV === 'local') return identity || { id: process.env.TELEGRAM_USER_ID || 'local-admin' };
  return identity && isTelegramFinancialAdmin(identity as any) ? identity : null;
}
function money(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}
function normalizeCustomerName(value: unknown) {
  return String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const nairobiStart = (offset = 0) => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day') + offset, -3));
};

export async function GET(request: Request) {
  try {
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const params = new URL(request.url).searchParams;
    if (params.get('history') === '1') {
      if (!identityAllowed(request.headers.get('x-telegram-init-data') || '')) return NextResponse.json({ error: 'Fadlan Telegram-ka ka fur ama login samee.' }, { status: 403 });
      const page = Math.max(1, Math.min(100000, Number(params.get('page')) || 1));
      const search = (params.get('search') || '').trim().slice(0, 100);
      const where = { companyId, ...(search ? { OR: [{ invoiceNumber: { contains: search, mode: 'insensitive' as const } }, { customer: { name: { contains: search, mode: 'insensitive' as const } } }, { items: { some: { productName: { contains: search, mode: 'insensitive' as const } } } }] } : {}) };
      const todayStart = nairobiStart();
      const tomorrowStart = nairobiStart(1);
      const monthStart = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1, -3));
      const [rows, total, statsRows] = await Promise.all([
        prisma.sale.findMany({ where, skip: (Math.floor(page) - 1) * 25, take: 25, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, invoiceNumber: true, createdAt: true, total: true, paidAmount: true, currency: true, status: true, paymentStatus: true, customer: { select: { name: true } }, account: { select: { name: true } }, items: { select: { productName: true, quantity: true, unitPrice: true, total: true } } } }),
        prisma.sale.count({ where }),
        prisma.sale.findMany({ where: { companyId, status: 'Completed', createdAt: { gte: monthStart, lt: tomorrowStart } }, select: { total: true, createdAt: true, items: { select: { quantity: true } } } })
      ]);
      const quantity = (items: any[]) => items.reduce((sum, sale) => sum + sale.items.reduce((line: number, item: any) => line + Number(item.quantity || 0), 0), 0);
      const todayRows = statsRows.filter(row => row.createdAt >= todayStart && row.createdAt < tomorrowStart);
      return NextResponse.json({ rows, total, page: Math.floor(page), pageSize: 25, stats: { totalSales: statsRows.length, totalQuantity: quantity(statsRows), todaySales: todayRows.length, todayQuantity: quantity(todayRows), monthValue: statsRows.reduce((sum, row) => sum + Number(row.total || 0), 0), todayValue: todayRows.reduce((sum, row) => sum + Number(row.total || 0), 0) } }, { headers: { 'Cache-Control': 'no-store' } });
    }
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
    const items: SaleItemInput[] = Array.isArray(body.items) ? body.items.map((item: any): SaleItemInput => ({ productId: String(item.productId || ''), quantity: Number(item.quantity), unitPrice: money(item.unitPrice), customerId: item.customerId ? String(item.customerId) : null })) : [];
    const allocationInputs: PaymentAllocationInput[] = Array.isArray(body.paymentAllocations) ? body.paymentAllocations.map((payment: any) => ({ incomingPaymentId: String(payment.incomingPaymentId || ''), amount: money(payment.amount) })) : [];
    if (!companyId || !items.length || items.some(item => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.unitPrice <= 0)) return NextResponse.json({ error: 'Product, quantity iyo price waa qasab.' }, { status: 400 });
    if (allocationInputs.some(payment => !payment.incomingPaymentId || payment.amount <= 0)) return NextResponse.json({ error: 'Lacagta la dooranayo waa inay leedahay amount sax ah.' }, { status: 400 });
    if (new Set(allocationInputs.map(payment => payment.incomingPaymentId)).size !== allocationInputs.length) return NextResponse.json({ error: 'Hal incoming payment hal mar oo keliya ayaad sale-kan ku xiriirin kartaa.' }, { status: 400 });
    const subtotal = money(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    const itemGroups = [...items.reduce((groups, item) => {
      const customerId = item.customerId || (body.customerId ? String(body.customerId) : null);
      const group = groups.get(customerId || '') || { customerId, items: [] as SaleItemInput[], subtotal: 0 };
      group.items.push(item);
      group.subtotal = money(group.subtotal + item.quantity * item.unitPrice);
      groups.set(customerId || '', group);
      return groups;
    }, new Map<string, { customerId: string | null; items: SaleItemInput[]; subtotal: number }>()).values()];
    const requestedPaidAmount = Math.max(0, Math.min(money(body.paidAmount), subtotal));
    let recognitionMemoryAvailable = true;
    if (Array.isArray(body.customerCorrections) && body.customerCorrections.length) {
      try {
        await prisma.salesReceiptCorrection.findFirst({ where: { companyId }, select: { id: true } });
      } catch (error) {
        recognitionMemoryAvailable = false;
        console.warn('Customer spelling corrections will not be learned until the sales receipt correction migration is applied.', error);
      }
    }
    const result = await prisma.$transaction(async tx => {
      const materials = await tx.factoryMaterial.findMany({ where: { companyId, id: { in: items.map(item => item.productId) } }, select: { id: true, name: true, inStock: true, purchasePrice: true } });
      const materialMap = new Map(materials.map(material => [material.id, material]));
      for (const item of items) {
        const material = materialMap.get(item.productId);
        if (!material) throw new Error('Product-ka inventory-ga kama helin.');
        if (Number(material.inStock) < item.quantity) throw new Error(material.name + ' stock kuma filna.');
      }
      const correctionCustomerIds = Array.isArray(body.customerCorrections)
        ? body.customerCorrections.map((correction: any) => String(correction?.customerId || '').trim()).filter(Boolean)
        : [];
      const customerIds = [...new Set([...itemGroups.map(group => group.customerId).filter(Boolean), ...correctionCustomerIds])] as string[];
      const customersById = new Map<string, { id: string; name: string; phone: string | null; phoneNumber: string | null }>();
      if (customerIds.length) {
        const customerRows = await tx.customer.findMany({ where: { id: { in: customerIds }, companyId }, select: { id: true, name: true, phone: true, phoneNumber: true } });
        if (customerRows.length !== customerIds.length) throw new Error('Customer-ka mid ka mid ah lama helin.');
        customerRows.forEach(customer => customersById.set(customer.id, customer));
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
      const saleNotes = `${String(body.note || 'Telegram Mini App sale')}\n${body.receiptHash ? `[ReceiptHash:${String(body.receiptHash)}]` : ''}`.trim();
      let remainingPaid = paidAmount;
      let allocationIndex = 0;
      let allocationRemaining = resolvedAllocations[0]?.amount || 0;
      const groupPaymentAmounts: number[] = [];
      const groupAllocations: Array<Array<{ incomingPaymentId: string; amount: number; accountId: string }>> = [];
      for (let groupIndex = 0; groupIndex < itemGroups.length; groupIndex += 1) {
        const group = itemGroups[groupIndex];
        const proportionalPaid = groupIndex === itemGroups.length - 1
          ? remainingPaid
          : Math.min(group.subtotal, money(paidAmount * group.subtotal / subtotal));
        const groupPaid = Math.min(group.subtotal, proportionalPaid);
        groupPaymentAmounts.push(groupPaid);
        remainingPaid = money(remainingPaid - groupPaid);
        let need = resolvedAllocations.length ? groupPaid : 0;
        const allocationsForGroup: Array<{ incomingPaymentId: string; amount: number; accountId: string }> = [];
        while (need > 0.001 && allocationIndex < resolvedAllocations.length) {
          const source = resolvedAllocations[allocationIndex];
          const chunk = money(Math.min(need, allocationRemaining));
          if (chunk > 0) allocationsForGroup.push({ incomingPaymentId: source.incomingPaymentId, amount: chunk, accountId: source.accountId });
          need = money(need - chunk);
          allocationRemaining = money(allocationRemaining - chunk);
          if (allocationRemaining <= 0.001) {
            allocationIndex += 1;
            allocationRemaining = resolvedAllocations[allocationIndex]?.amount || 0;
          }
        }
        groupAllocations.push(allocationsForGroup);
      }
      for (let index = 0; index < itemGroups.length; index += 1) {
        const group = itemGroups[index];
        if (group.subtotal - groupPaymentAmounts[index] <= 0.01) continue;
        const customer = group.customerId ? customersById.get(group.customerId) : null;
        if (!customer) throw new Error('Iibka daynta waa in customer la diiwaangeliyey lagu xiraa.');
        if (!String(customer.phone || customer.phoneNumber || '').trim()) throw new Error(`Lambarka customer-ka ${customer.name} waa khasab marka dayn/credit la gelinayo.`);
      }

      const corrections = Array.isArray(body.customerCorrections) ? body.customerCorrections as CustomerCorrectionInput[] : [];
      let learnedCorrections = 0;
      for (const correction of (recognitionMemoryAvailable ? corrections.slice(0, 50) : [])) {
        const observedName = String(correction?.observedName || '').trim();
        const customerId = String(correction?.customerId || '').trim();
        const normalizedObservedName = normalizeCustomerName(observedName);
        const correctedCustomer = customersById.get(customerId);
        if (normalizedObservedName.length < 3 || !correctedCustomer || normalizedObservedName === normalizeCustomerName(correctedCustomer.name)) continue;
        await tx.salesReceiptCorrection.upsert({
          where: { companyId_normalizedObservedName: { companyId, normalizedObservedName } },
          create: { companyId, observedName, normalizedObservedName, correctedCustomerName: correctedCustomer.name },
          update: { observedName, correctedCustomerName: correctedCustomer.name, correctionCount: { increment: 1 } }
        });
        learnedCorrections += 1;
      }
      const baseInvoice = 'AN-TG-' + Date.now().toString().slice(-8);
      const sales = [];
      for (let index = 0; index < itemGroups.length; index += 1) {
        const group = itemGroups[index];
        const groupPaid = groupPaymentAmounts[index];
        const paymentStatus = groupPaid >= group.subtotal ? 'Paid' : groupPaid > 0 ? 'Partial' : 'Unpaid';
        const groupAccountIds = [...new Set(groupAllocations[index].map(payment => payment.accountId))];
        const groupAccountId = resolvedAllocations.length ? (groupAccountIds.length === 1 ? groupAccountIds[0] : null) : saleAccountId;
        const invoiceNumber = itemGroups.length === 1 ? baseInvoice : `${baseInvoice}-${index + 1}`;
        sales.push(await tx.sale.create({
          data: {
            invoiceNumber, userId, companyId, customerId: group.customerId, accountId: groupAccountId,
            subtotal: group.subtotal, tax: 0, total: group.subtotal, paidAmount: groupPaid, paymentMethod: String(body.paymentMethod || 'CASH'), paymentStatus, status: 'Completed',
            notes: itemGroups.length > 1 ? `${saleNotes}\nReceipt group ${index + 1}/${itemGroups.length}` : saleNotes,
            receiptUrl: body.receiptUrl || null,
            items: { create: group.items.map(item => { const material = materialMap.get(item.productId)!; return { productId: material.id, productName: material.name, quantity: item.quantity, unitPrice: item.unitPrice, total: item.quantity * item.unitPrice, costPrice: Number(material.purchasePrice || 0), totalCost: Number(material.purchasePrice || 0) * item.quantity }; }) },
            ...(groupAllocations[index].length ? { paymentAllocations: { create: groupAllocations[index].map(payment => ({ incomingPaymentId: payment.incomingPaymentId, amount: payment.amount })) } } : {})
          },
          include: { items: true, paymentAllocations: true }
        }));
      }
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
        for (let index = 0; index < sales.length; index += 1) {
          const groupPaid = groupPaymentAmounts[index];
          if (groupPaid <= 0) continue;
          const sale = sales[index];
          await tx.transaction.create({ data: { description: 'Iibka ' + sale.invoiceNumber, amount: groupPaid, type: 'INCOME', accountId: saleAccountId, companyId, userId, customerId: sale.customerId, transactionDate: new Date(), category: groupPaid >= sale.total ? 'Sales Income' : 'Sales Deposit / Dayn Qayb Bixin', note: 'Telegram Mini App · ' + sale.paymentStatus } });
        }
      }
      return { sales, learnedCorrections };
    });
    return NextResponse.json({ success: true, sale: result.sales[0], sales: result.sales, learnedCorrections: result.learnedCorrections, recognitionMemoryAvailable });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sale lama kaydin.' }, { status: 500 });
  }
}
