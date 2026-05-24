// app/api/manufacturing/sales/bulk/route.ts - AN-Industory Optimized Bulk Sales Engine
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

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
        const { sales, accountId } = body;

        if (!sales || !Array.isArray(sales) || sales.length === 0) {
            return NextResponse.json({ error: 'No sales data provided' }, { status: 400 });
        }

        if (accountId) {
            const accountExists = await prisma.account.findUnique({
                where: { id: accountId }
            });
            if (!accountExists) {
                return NextResponse.json({ error: 'Deposit account not found' }, { status: 400 });
            }
        }

        // Execute all sales atomically with an extended timeout to avoid transaction crashes
        const results = await prisma.$transaction(async (tx) => {
            const processedSales = [];

            // 1. Preload customers list to avoid query loops
            const allCustomers = await tx.customer.findMany({
                where: { companyId: user.companyId }
            });
            const customerMap = new Map(allCustomers.map(c => [c.name.toLowerCase().trim(), c]));

            // 2. Provision 1L and 0.5L products if not present
            let material1L = await tx.factoryMaterial.findFirst({
                where: {
                    companyId: user.companyId,
                    category: 'Finished Goods',
                    OR: [
                        { name: { equals: '1L', mode: 'insensitive' } },
                        { name: { contains: '1L', mode: 'insensitive' } },
                        { name: { contains: '1 Litre', mode: 'insensitive' } },
                        { name: { contains: '1-L', mode: 'insensitive' } }
                    ]
                }
            });
            if (!material1L) {
                material1L = await tx.factoryMaterial.create({
                    data: {
                        companyId: user.companyId,
                        userId: session.user.id,
                        name: '1L',
                        sku: `FG-1L-${Math.random().toString(36).substring(7).toUpperCase()}`,
                        category: 'Finished Goods',
                        unit: 'pcs',
                        inStock: 1000000, // Large stock for seamless entry
                        minStock: 10,
                        purchasePrice: 12,
                        sellingPrice: 20
                    }
                });
            }

            let material05L = await tx.factoryMaterial.findFirst({
                where: {
                    companyId: user.companyId,
                    category: 'Finished Goods',
                    OR: [
                        { name: { equals: '0.5L', mode: 'insensitive' } },
                        { name: { contains: '0.5L', mode: 'insensitive' } },
                        { name: { contains: '0.5 Litre', mode: 'insensitive' } },
                        { name: { contains: '500ml', mode: 'insensitive' } },
                        { name: { contains: '0.5-L', mode: 'insensitive' } }
                    ]
                }
            });
            if (!material05L) {
                material05L = await tx.factoryMaterial.create({
                    data: {
                        companyId: user.companyId,
                        userId: session.user.id,
                        name: '0.5L',
                        sku: `FG-05L-${Math.random().toString(36).substring(7).toUpperCase()}`,
                        category: 'Finished Goods',
                        unit: 'pcs',
                        inStock: 1000000,
                        minStock: 10,
                        purchasePrice: 8,
                        sellingPrice: 15
                    }
                });
            }

            for (const item of sales) {
                const customerName = (item.customerName || 'Walk-in Customer').trim();
                const date = new Date(item.date || Date.now());
                const qty1L = Number(item.qty1L) || 0;
                const price1L = Number(item.price1L) || 0;
                const qty05L = Number(item.qty05L) || 0;
                const price05L = Number(item.price05L) || 0;
                const paidAmount = Number(item.paidAmount) || 0;

                const total1L = qty1L * price1L;
                const total05L = qty05L * price05L;
                const grandTotal = total1L + total05L;

                if (grandTotal <= 0) continue; // Skip empty rows

                // Find or register Customer using our local in-memory cache
                const cleanedCustomerName = customerName.toLowerCase().trim();
                let customer = customerMap.get(cleanedCustomerName);
                if (!customer) {
                    customer = await tx.customer.create({
                        data: {
                            name: customerName,
                            companyId: user.companyId,
                            userId: session.user.id,
                            phone: '',
                            address: ''
                        }
                    });
                    customerMap.set(cleanedCustomerName, customer);
                }

                // Calculate payment status
                const paymentStatus = paidAmount >= grandTotal ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
                const invoiceNumber = `AN-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

                // Create Sale record
                const sale = await tx.sale.create({
                    data: {
                        invoiceNumber,
                        userId: session.user.id,
                        companyId: user.companyId,
                        customerId: customer.id,
                        accountId: accountId || null,
                        subtotal: grandTotal,
                        tax: 0,
                        total: grandTotal,
                        paidAmount: paidAmount,
                        paymentStatus,
                        status: 'Completed',
                        createdAt: date,
                        items: {
                            create: [
                                ...(qty1L > 0 ? [{
                                    productId: material1L.id,
                                    productName: '1L',
                                    quantity: qty1L,
                                    unitPrice: price1L,
                                    total: total1L,
                                    costPrice: Number(material1L.purchasePrice),
                                    totalCost: Number(material1L.purchasePrice) * qty1L
                                }] : []),
                                ...(qty05L > 0 ? [{
                                    productId: material05L.id,
                                    productName: '0.5L',
                                    quantity: qty05L,
                                    unitPrice: price05L,
                                    total: total05L,
                                    costPrice: Number(material05L.purchasePrice),
                                    totalCost: Number(material05L.purchasePrice) * qty05L
                                }] : [])
                            ]
                        }
                    }
                });

                // Deduct Inventory Stock
                if (qty1L > 0) {
                    await tx.factoryMaterial.update({
                        where: { id: material1L.id },
                        data: { inStock: { decrement: qty1L } }
                    });
                }
                if (qty05L > 0) {
                    await tx.factoryMaterial.update({
                        where: { id: material05L.id },
                        data: { inStock: { decrement: qty05L } }
                    });
                }

                // Update Bank Account Balance & Record Transaction
                if (accountId && paidAmount > 0) {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { increment: paidAmount } }
                    });

                    await tx.transaction.create({
                        data: {
                            description: `Iibka (Bulk): #${invoiceNumber} - ${customerName}`,
                            amount: paidAmount,
                            type: 'INCOME',
                            accountId: accountId,
                            companyId: user.companyId,
                            userId: session.user.id,
                            customerId: customer.id
                        }
                    });
                }

                processedSales.push(sale);
            }

            return processedSales;
        }, {
            maxWait: 30000,
            timeout: 120000 // Extended to 2 minutes for massive excel sheets
        });

        // Audit the bulk operation
        await logAudit({
            action: 'CREATE_SALE_BULK',
            entity: 'Sale',
            entityId: session.user.id,
            details: `Successfully processed ${results.length} sales in bulk.`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error('Error creating bulk sales:', error);
        return NextResponse.json({ error: 'Failed to create bulk sales: ' + error.message }, { status: 500 });
    }
}
