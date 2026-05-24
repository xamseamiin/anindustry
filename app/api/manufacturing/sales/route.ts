// app/api/manufacturing/sales/route.ts - AN-Industory Sales Engine
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

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
            items: sale.items.reduce((sum, item) => sum + item.quantity, 0)
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
        const { customerId, items, date, accountId, paidAmount, paymentStatus } = body;

        const total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const invoiceNumber = `AN-${Date.now().toString().slice(-6)}`;
        const saleDate = new Date(date || Date.now());

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
            // Fetch material cost prices (purchasePrice) from FactoryMaterial
            const productIds = items.map((item: any) => item.productId);
            const dbMaterials = await tx.factoryMaterial.findMany({
                where: { id: { in: productIds } },
                select: { id: true, purchasePrice: true }
            });
            const costMap = new Map(dbMaterials.map(m => [m.id, m.purchasePrice]));

            // 1. Create the Sale
            const sale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    userId: session.user.id,
                    companyId: user.companyId,
                    customerId: customerId || null,
                    accountId: accountId || null,
                    subtotal: total,
                    tax: 0,
                    total: total,
                    paidAmount: Number(paidAmount) || 0,
                    paymentStatus: paymentStatus || (Number(paidAmount) >= total ? 'Paid' : Number(paidAmount) > 0 ? 'Partial' : 'Unpaid'),
                    status: 'Completed',
                    createdAt: new Date(date || Date.now()),
                    items: {
                        create: items.map((item: any) => {
                            const cost = costMap.get(item.productId) || 0;
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
            for (const item of items) {
                await tx.factoryMaterial.update({
                    where: { id: item.productId },
                    data: {
                        inStock: {
                            decrement: Number(item.quantity)
                        }
                    }
                });
            }

            // 3. Update Account Balance and create Transaction if paidAmount > 0
            if (accountId && Number(paidAmount) > 0) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            increment: Number(paidAmount)
                        }
                    }
                });

                await tx.transaction.create({
                    data: {
                        description: `Iibka ${invoiceNumber}`,
                        amount: Number(paidAmount),
                        type: 'INCOME',
                        accountId: accountId,
                        companyId: user.companyId,
                        userId: session.user.id,
                        customerId: customerId || null
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
