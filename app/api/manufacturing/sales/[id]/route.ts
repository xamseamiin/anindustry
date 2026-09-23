// app/api/manufacturing/sales/[id]/route.ts - AN-Industory Single Sale API
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { salePaymentCorrection } from '@/lib/sale-payment-correction';

export const dynamic = 'force-dynamic';

// Correct recorded payment/customer without moving physical stock a second time.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true, role: true } });
    if (!user?.companyId || !['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'MANUFACTURING_ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: 'Maamule ayaa saxaya lacagta iibka.' }, { status: 403 });
    }
    const companyId = user.companyId;
    try {
        const body = await req.json();
        const reason = String(body.reason || '').trim();
        if (reason.length < 5) throw new Error('Fadlan qor sababta sixitaanka.');
        const sale = await prisma.$transaction(async tx => {
            const current = await tx.sale.findFirst({ where: { companyId, OR: [{ id: params.id }, { invoiceNumber: params.id }] }, include: { paymentAllocations: true } });
            if (!current || current.status !== 'Completed') throw new Error('Iib dhammaystiran lama helin.');
            if (String(body.updatedAt) !== current.updatedAt.toISOString()) throw new Error('Iibkan waa la cusboonaysiiyey. Dib u fur ka hor sixitaanka.');
            if (current.paymentAllocations.length) throw new Error('Iibkan wuxuu ku xiran yahay incoming payments; marka hore lacagahaas waa in la waafajiyaa.');
            if (!current.accountId) throw new Error('Iibkan account lacag-bixineed kuma xirna.');
            const closed = await tx.financialPeriod.findFirst({ where: { companyId, isClosed: true, startDate: { lte: current.createdAt }, endDate: { gte: current.createdAt } } });
            if (closed) throw new Error('Muddada maaliyadeed ee iibkan waa xiran tahay.');
            const change = salePaymentCorrection(current.total, current.paidAmount, body.paidAmount);
            const customerId = body.customerId ? String(body.customerId) : null;
            const customer = customerId ? await tx.customer.findFirst({ where: { id: customerId, companyId } }) : null;
            if (customerId && !customer) throw new Error('Customer lama helin.');
            if (change.debt > 0 && (!customer || !String(customer.phone || customer.phoneNumber || '').trim())) {
                throw new Error('Daynta ku xir customer diiwaangashan oo leh telefoon.');
            }
            const transactions = await tx.transaction.findMany({ where: { companyId, type: 'INCOME', description: { in: [`Iibka ${current.invoiceNumber}`, `Iibka #${current.invoiceNumber}`] } } });
            if (transactions.length !== 1 || transactions[0].accountId !== current.accountId || transactions[0].reversedAt || Math.abs(Number(transactions[0].amount) - current.paidAmount) > 0.001) {
                throw new Error('Lacagta account-ka iyo iibku isma waafaqaan; reconciliation ayaa loo baahan yahay.');
            }
            await tx.account.update({ where: { id: current.accountId }, data: { balance: { increment: change.balanceChange } } });
            await tx.transaction.update({ where: { id: transactions[0].id }, data: {
                amount: change.paidAmount, customerId,
                category: change.debt > 0 ? 'Sales Deposit / Dayn Qayb Bixin' : 'Sales Income',
                note: `${transactions[0].note || ''}\nPayment correction: ${reason}. Paid ${current.paidAmount} -> ${change.paidAmount}; debt ${change.debt}.`
            } });
            const updated = await tx.sale.update({ where: { id: current.id }, data: {
                customerId, paidAmount: change.paidAmount, paymentStatus: change.paymentStatus,
                paymentMethod: change.paidAmount === 0 ? 'CREDIT' : current.paymentMethod === 'CREDIT' ? 'BANK_TRANSFER' : current.paymentMethod,
                notes: `${current.notes || ''}\n[PaymentCorrection] ${reason}; paid ${current.paidAmount} -> ${change.paidAmount}.`
            }, include: { items: true, customer: true, account: true, user: { select: { fullName: true } } } });
            await tx.auditLog.create({ data: { companyId, userId: session.user.id, action: 'CORRECT_SALE_PAYMENT', entity: 'Sale', entityId: current.id, details: JSON.stringify({ reason, before: { customerId: current.customerId, paidAmount: current.paidAmount, paymentStatus: current.paymentStatus }, after: { customerId, ...change }, accountId: current.accountId, transactionBefore: transactions[0] }) } });
            return updated;
        }, { isolationLevel: 'Serializable', timeout: 20000 });
        return NextResponse.json({ sale });
    } catch (error: any) {
        return NextResponse.json({ error: error.code === 'P2034' ? 'Xogta waa isbeddeshay; dib u fur oo isku day.' : error.message || 'Sixitaanku ma kaydsamin.' }, { status: 400 });
    }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const sale = await prisma.sale.findFirst({
            where: {
                OR: [
                    { id: id },
                    { invoiceNumber: id }
                ]
            },
            include: {
                customer: true,
                items: true,
                account: true,
                user: {
                    select: { fullName: true }
                }
            }
        });

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        return NextResponse.json({ sale });
    } catch (error) {
        console.error('Error fetching sale details:', error);
        return NextResponse.json({ error: 'Failed to fetch sale details' }, { status: 500 });
    }
}

// DELETE /api/manufacturing/sales/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const sale = await prisma.sale.findFirst({
            where: {
                companyId: user.companyId,
                OR: [
                    { id },
                    { invoiceNumber: id }
                ]
            },
            include: { items: true }
        });

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

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
                error: `Muddada maaliyadeed ee iibkan ku jiro (${closedPeriod.name}) waa mid xiran. Sale lama tirtiri karo.`
            }, { status: 403 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const stockRestoredByProduct = new Map<string, number>();
            for (const item of sale.items) {
                stockRestoredByProduct.set(
                    item.productId,
                    (stockRestoredByProduct.get(item.productId) || 0) + Number(item.quantity)
                );
            }

            for (const [productId, quantity] of stockRestoredByProduct) {
                await tx.factoryMaterial.update({
                    where: { id: productId },
                    data: {
                        inStock: {
                            increment: quantity
                        }
                    }
                });
            }

            const capQuantity = Number(sale.notes?.match(/\[CapDeducted:(\d+(?:\.\d+)?)\]/)?.[1] || 0);
            if (capQuantity > 0) {
                const capMaterial = await tx.factoryMaterial.findFirst({
                    where: {
                        companyId: user.companyId,
                        name: { equals: 'Fur', mode: 'insensitive' }
                    },
                    select: { id: true }
                });
                if (!capMaterial) throw new Error('Fur stock record lama helin; sale-ka lama tirtirin si stock-gu uusan u khaldin.');
                await tx.factoryMaterial.update({
                    where: { id: capMaterial.id },
                    data: { inStock: { increment: capQuantity } }
                });
            }

            const saleIncomeTransactions = await tx.transaction.findMany({
                where: {
                    companyId: user.companyId,
                    type: 'INCOME',
                    description: {
                        in: [`Iibka ${sale.invoiceNumber}`, `Iibka #${sale.invoiceNumber}`]
                    }
                },
                select: {
                    id: true,
                    accountId: true,
                    amount: true
                }
            });

            const balanceReversalsByAccount = new Map<string, number>();
            for (const transaction of saleIncomeTransactions) {
                if (!transaction.accountId) continue;
                balanceReversalsByAccount.set(
                    transaction.accountId,
                    (balanceReversalsByAccount.get(transaction.accountId) || 0) + Number(transaction.amount)
                );
            }

            for (const [accountId, amount] of balanceReversalsByAccount) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            decrement: amount
                        }
                    }
                });
            }

            const deletedTransactions = await tx.transaction.deleteMany({
                where: {
                    id: {
                        in: saleIncomeTransactions.map(transaction => transaction.id)
                    }
                }
            });

            await tx.sale.delete({
                where: { id: sale.id }
            });

            return {
                restoredItems: sale.items.length,
                restoredQuantity: sale.items.reduce((sum, item) => sum + Number(item.quantity), 0),
                restoredCaps: capQuantity,
                deletedTransactions: deletedTransactions.count,
                reversedAmount: saleIncomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0)
            };
        });

        await logAudit({
            action: 'DELETE_SALE',
            entity: 'Sale',
            entityId: sale.id,
            details: `Deleted sale ${sale.invoiceNumber}. Restored ${result.restoredQuantity} items and ${result.restoredCaps} caps, deleted ${result.deletedTransactions} income transaction(s), reversed ${result.reversedAmount.toLocaleString()} ETB from account balances.`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({
            success: true,
            message: 'Sale deleted, inventory restored, sales transaction removed, and account balance reversed.',
            ...result
        });
    } catch (error) {
        console.error('Error deleting sale:', error);
        return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
    }
}
