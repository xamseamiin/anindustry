// app/api/manufacturing/sales/route.ts - AN-Industory Sales Engine
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const normalizedProductName = (value: unknown) => String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('liter', 'l')
    .replace('litre', 'l');

const productUsesCap = (name: unknown) => {
    const normalized = normalizedProductName(name);
    return normalized === '1l' || normalized === '0.5l' || normalized === '500ml';
};

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ orders: [] });
        }

        const sales = await prisma.sale.findMany({
            where: { companyId: user.companyId },
            include: {
                customer: true,
                items: true,
                account: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend
        const formattedSales = sales.map(sale => ({
            id: sale.id,
            invoiceNumber: sale.invoiceNumber,
            customer: sale.customer?.name || 'Walk-in Customer',
            date: sale.createdAt.toISOString().split('T')[0],
            total: Number(sale.total),
            paidAmount: Number(sale.paidAmount),
            status: sale.paymentStatus,
            account: sale.account?.name || 'Cash',
            items: sale.items.reduce((sum, item) => sum + item.quantity, 0),
            breakdown: sale.items.map(item => `${item.productName}: ${item.quantity.toLocaleString()}`).join(', ')
        }));

        return NextResponse.json({ orders: formattedSales });
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { customerId, items, date, accountId, paymentMethod = 'CASH', receiptUrl } = body;
        const receiptNumber = String(body.receiptNumber || '').trim().slice(0, 100);
        const receiptHash = String(body.receiptHash || '').trim().toLowerCase();

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'At least one sale item is required.' }, { status: 400 });
        }

        if (receiptHash && !/^[a-f0-9]{64}$/.test(receiptHash)) {
            return NextResponse.json({ error: 'Receipt hash is invalid.' }, { status: 400 });
        }

        const normalizedItems = items.map((item: any) => ({
            productId: String(item.productId || ''),
            productName: String(item.productName || '').trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
        }));
        if (normalizedItems.some((item: any) => !item.productId || !item.productName || !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice <= 0)) {
            return NextResponse.json({ error: 'Product, quantity iyo unit price waa inay sax yihiin; quantity-gu waa inuu noqdaa tiro dhan.' }, { status: 400 });
        }

        const subtotal = normalizedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const requestedTotal = Number(body.total);
        const total = Number.isFinite(requestedTotal) && requestedTotal >= 0 && requestedTotal <= subtotal
            ? requestedTotal
            : subtotal;
        const normalizedPaidAmount = Math.max(0, Math.min(Number(body.paidAmount) || 0, total));
        const paymentStatus = body.paymentStatus || (normalizedPaidAmount >= total ? 'Paid' : normalizedPaidAmount > 0 ? 'Partial' : 'Unpaid');
        if (normalizedPaidAmount > 0 && !accountId) {
            return NextResponse.json({ error: 'Lacag la bixiyay waxay u baahan tahay account lagu shubo.' }, { status: 400 });
        }
        const invoiceNumber = `AN-${Date.now().toString().slice(-6)}`;
        const saleDate = new Date(date || Date.now());
        if (Number.isNaN(saleDate.getTime())) {
            return NextResponse.json({ error: 'Taariikhda sale-ka ma saxna.' }, { status: 400 });
        }

        // Check for Closed Fiscal Period
        const closedPeriod = await prisma.financialPeriod.findFirst({
            where: {
                companyId: user.companyId,
                isClosed: true,
                startDate: { lte: saleDate },
                endDate: { gte: saleDate }
            }
        });

        if (closedPeriod) {
            return NextResponse.json({ 
                error: `Muddada maaliyadeed ee ${closedPeriod.name} waa mid xiran. Waxba laguma kordhin karo.` 
            }, { status: 403 });
        }

        // Use a transaction to ensure atomic updates
        const result = await prisma.$transaction(async (tx) => {
            const customer = customerId
                ? await tx.customer.findFirst({ where: { id: customerId, companyId: user.companyId }, select: { id: true } })
                : null;
            if (!customer) throw new Error('Customer-ka lama helin ama shirkaddan kama tirsana.');

            if (accountId) {
                const account = await tx.account.findFirst({ where: { id: accountId, companyId: user.companyId }, select: { id: true } });
                if (!account) throw new Error('Account-ka lacagta lagu shubayo lama helin.');
            }

            if (receiptHash || receiptNumber) {
                const duplicateConditions: any[] = [];
                if (receiptHash) duplicateConditions.push({ notes: { contains: `[ReceiptHash:${receiptHash}]` } });
                if (receiptNumber) duplicateConditions.push({ notes: { contains: `[ReceiptNumber:${receiptNumber}]` } });
                const duplicate = await tx.sale.findFirst({
                    where: { companyId: user.companyId, OR: duplicateConditions },
                    select: { invoiceNumber: true }
                });
                if (duplicate) throw new Error(`Rasiidhkan hore ayaa loo diiwaangeliyay (${duplicate.invoiceNumber}).`);
            }

            // Fetch material cost prices (purchasePrice) from FactoryMaterial
            const productIds = normalizedItems.map((item: any) => item.productId);
            const dbMaterials = await tx.factoryMaterial.findMany({
                where: { id: { in: productIds }, companyId: user.companyId },
                select: { id: true, name: true, purchasePrice: true, inStock: true }
            });
            const materialMap = new Map(dbMaterials.map(m => [m.id, m]));

            const missingProductIds = productIds.filter((id: string) => !id || !materialMap.has(id));
            if (missingProductIds.length > 0) {
                throw new Error('Fadlan product kasta inventory-ga saxda ah ka dooro ka hor intaadan save-gareyn.');
            }

            const requestedByProduct = new Map<string, number>();
            for (const item of normalizedItems) {
                requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + item.quantity);
            }
            for (const [productId, quantity] of requestedByProduct) {
                const material = materialMap.get(productId)!;
                if (Number(material.inStock) < quantity) {
                    throw new Error(`${material.name} stock kuma filna. Jira: ${Number(material.inStock).toLocaleString()}, la iibinayo: ${quantity.toLocaleString()}.`);
                }
            }

            const capQuantity = normalizedItems.reduce((sum: number, item: any) => {
                const material = materialMap.get(item.productId);
                return sum + (material && productUsesCap(material.name) ? item.quantity : 0);
            }, 0);
            const capMaterial = capQuantity > 0
                ? await tx.factoryMaterial.findFirst({
                    where: { companyId: user.companyId, name: { equals: 'Fur', mode: 'insensitive' } },
                    select: { id: true, name: true, inStock: true, purchasePrice: true }
                })
                : null;
            if (capQuantity > 0 && !capMaterial) throw new Error('Fur stock record lama helin.');
            if (capMaterial && Number(capMaterial.inStock) < capQuantity) {
                throw new Error(`Fur stock kuma filna. Jira: ${Number(capMaterial.inStock).toLocaleString()}, loo baahan yahay: ${capQuantity.toLocaleString()}.`);
            }

            const noteParts = [
                receiptNumber ? `[ReceiptNumber:${receiptNumber}]` : '',
                receiptHash ? `[ReceiptHash:${receiptHash}]` : '',
                `[CapDeducted:${capQuantity}]`
            ].filter(Boolean);

            // 1. Create the Sale
            const sale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    userId: session.user.id,
                    companyId: user.companyId,
                    customerId: customerId || null,
                    accountId: accountId || null,
                    receiptUrl: receiptUrl || null,
                    notes: noteParts.join(' '),
                    subtotal,
                    tax: 0,
                    total: total,
                    paidAmount: normalizedPaidAmount,
                    paymentMethod,
                    paymentStatus,
                    status: 'Completed',
                    createdAt: saleDate,
                    items: {
                        create: normalizedItems.map((item: any) => {
                            const material = materialMap.get(item.productId);
                            const bottleCost = Number(material?.purchasePrice || 0);
                            const capCost = material && productUsesCap(material.name)
                                ? Number(capMaterial?.purchasePrice || 0)
                                : 0;
                            const cost = bottleCost + capCost;
                            return {
                                productId: item.productId, // This now relates to FactoryMaterial
                                productName: item.productName,
                                quantity: Number(item.quantity),
                                unitPrice: Number(item.unitPrice),
                                total: Number(item.quantity) * Number(item.unitPrice),
                                costPrice: cost,
                                totalCost: cost * Number(item.quantity)
                            };
                        })
                    }
                }
            });

            // 2. Deduct Stock from FactoryMaterial
            for (const [productId, quantity] of requestedByProduct) {
                const updated = await tx.factoryMaterial.updateMany({
                    where: { id: productId, companyId: user.companyId, inStock: { gte: quantity } },
                    data: { inStock: { decrement: quantity } }
                });
                if (updated.count !== 1) throw new Error('Stock-ga ayaa isbeddelay intii sale-ka la kaydinayay; fadlan mar kale isku day.');
            }
            if (capMaterial && capQuantity > 0) {
                const updatedCap = await tx.factoryMaterial.updateMany({
                    where: { id: capMaterial.id, companyId: user.companyId, inStock: { gte: capQuantity } },
                    data: { inStock: { decrement: capQuantity } }
                });
                if (updatedCap.count !== 1) throw new Error('Fur stock-ga ayaa isbeddelay intii sale-ka la kaydinayay; fadlan mar kale isku day.');
            }

            // 3. Update Account Balance and create Transaction if paidAmount > 0
            if (accountId && normalizedPaidAmount > 0) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            increment: normalizedPaidAmount
                        }
                    }
                });

                await tx.transaction.create({
                    data: {
                        description: `Iibka ${invoiceNumber}`,
                        amount: normalizedPaidAmount,
                        type: 'INCOME',
                        accountId: accountId,
                        companyId: user.companyId,
                        userId: session.user.id,
                        customerId: customerId || null,
                        transactionDate: saleDate,
                        receiptUrl: receiptUrl || null,
                        category: paymentStatus === 'Partial' ? 'Sales Deposit / Dayn Qayb Bixin' : 'Sales Income',
                        note: paymentStatus === 'Partial'
                            ? `Partial sale payment. Remaining customer debt: ${(total - normalizedPaidAmount).toLocaleString()} ETB`
                            : `Sale payment recorded through ${paymentMethod}`
                    }
                });
            }

            return sale;
        });

        // Log Audit Action
        await logAudit({
            action: 'CREATE_SALE',
            entity: 'Sale',
            entityId: result.id,
            details: `Created sale ${invoiceNumber} for ${total.toLocaleString()} ETB`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({ success: true, sale: result });
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json({ error: 'Failed to create sale: ' + (error as Error).message }, { status: 500 });
    }
}
