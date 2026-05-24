// app/api/manufacturing/sales/refund/route.ts - AN-Industory Sales Reversal API
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
        const { saleId, accountId } = body;

        if (!saleId || !accountId) {
            return NextResponse.json({ error: 'Fadlan dooro Sale ID iyo Account ID.' }, { status: 400 });
        }

        // Fetch the Sale
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: { items: true }
        });

        if (!sale) {
            return NextResponse.json({ error: 'Araaqidda iibka lama helin.' }, { status: 404 });
        }

        if (sale.status === 'Refunded') {
            return NextResponse.json({ error: 'Iibkan horay ayaa loo celiyay (Refunded).' }, { status: 400 });
        }

        // Check closed financial periods
        const closedPeriod = await prisma.financialPeriod.findFirst({
            where: {
                companyId: user.companyId,
                isClosed: true,
                startDate: { lte: sale.createdAt },
                endDate: { gte: sale.createdAt }
            }
        });

        if (closedPeriod) {
            return NextResponse.json({ 
                error: `Muddada maaliyadeed ee iibkan ku jiro (${closedPeriod.name}) waa mid xiran. Refund lama samayn karo.` 
            }, { status: 403 });
        }

        // Execute atomic transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Mark Sale as Refunded
            const updatedSale = await tx.sale.update({
                where: { id: saleId },
                data: {
                    status: 'Refunded',
                    paymentStatus: 'Refunded'
                }
            });

            // 2. Put Finished Goods Stock Back in FactoryMaterial
            for (const item of sale.items) {
                await tx.factoryMaterial.update({
                    where: { id: item.productId },
                    data: {
                        inStock: {
                            increment: item.quantity
                        }
                    }
                });
            }

            // 3. Deduct Refunded Cash from Chosen Account
            if (sale.paidAmount > 0) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            decrement: sale.paidAmount
                        }
                    }
                });
            }

            // 4. Delete the original sale income Transaction (as requested: "la tirtiro")
            await tx.transaction.deleteMany({
                where: {
                    companyId: user.companyId,
                    description: {
                        in: [`Iibka ${sale.invoiceNumber}`, `Iibka #${sale.invoiceNumber}`]
                    }
                }
            });

            return updatedSale;
        });

        // Audit Log
        await logAudit({
            action: 'REFUND_SALE',
            entity: 'Sale',
            entityId: sale.id,
            details: `Refunded sale ${sale.invoiceNumber}. Restocked ${sale.items.length} items. Deducted ${sale.paidAmount} ETB from account ${accountId}`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({ success: true, message: 'Iibka waa la celiyay, alaabtiina bakhaarkaa lagu celiyay.', sale: result });
    } catch (error) {
        console.error('Error refunding sale:', error);
        return NextResponse.json({ error: 'Reversal failed: ' + (error as Error).message }, { status: 500 });
    }
}
