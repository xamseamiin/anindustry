// app/api/manufacturing/accounting/receivables/route.ts - Accounts Receivable Engine
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all outstanding customer debts (Sales with unpaid balances)
export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();

        const unpaidSales = await prisma.sale.findMany({
            where: {
                companyId,
                paymentStatus: { notIn: ['Paid', 'PAID', 'Refunded', 'REFUNDED'] }
            },
            include: {
                customer: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter out any sales where paidAmount is technically equal to total due to float rounding
        const receivables = unpaidSales.filter(s => (s.total - s.paidAmount) > 0.01).map(s => ({
            id: s.id,
            invoiceNumber: s.invoiceNumber,
            customerName: s.customer?.name || 'Vaan-aqoon Macmiilka',
            customerPhone: s.customer?.phone || '',
            total: s.total,
            paidAmount: s.paidAmount,
            debtAmount: s.total - s.paidAmount,
            status: s.paymentStatus,
            date: s.createdAt
        }));

        return NextResponse.json({ receivables });
    } catch (error: any) {
        console.error('Error fetching receivables:', error);
        return NextResponse.json({ message: 'Error fetching receivables', error: error.message }, { status: 500 });
    }
}

// POST: Collect customer payment and atomically update sales, bank accounts & transaction ledger
export async function POST(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const body = await request.json();
        const { saleId, amountCollected, accountId, note } = body;

        const collectionAmount = parseFloat(amountCollected);
        if (isNaN(collectionAmount) || collectionAmount <= 0) {
            return NextResponse.json({ message: 'Qadarku waa inuu ahaadaa tiro ka weyn eber.' }, { status: 400 });
        }

        // Perform transaction atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Sale
            const sale = await tx.sale.findFirst({
                where: { id: saleId, companyId }
            });

            if (!sale) {
                throw new Error('Invoice-ka lama heli karo.');
            }

            const remainingDebt = sale.total - sale.paidAmount;
            if (collectionAmount > remainingDebt + 0.01) {
                throw new Error(`Lacagta aad ururinayso (${collectionAmount.toLocaleString()} ETB) waxay ka badantahay deynta halkan taal (${remainingDebt.toLocaleString()} ETB).`);
            }

            const newPaidAmount = sale.paidAmount + collectionAmount;
            const newStatus = Math.abs(sale.total - newPaidAmount) < 0.1 ? 'Paid' : 'Partial';

            // 2. Update Sale Payment status
            const updatedSale = await tx.sale.update({
                where: { id: saleId },
                data: {
                    paidAmount: newPaidAmount,
                    paymentStatus: newStatus
                }
            });

            // 3. Increment Bank/Cash Account Balance
            const account = await tx.account.update({
                where: { id: accountId },
                data: {
                    balance: { increment: collectionAmount }
                }
            });

            // 4. Log Transaction in Buugga Guud
            const transaction = await tx.transaction.create({
                data: {
                    companyId,
                    amount: collectionAmount,
                    type: 'INCOME',
                    description: `Deymoshub: Invoice #${sale.invoiceNumber} (Ref: COL-${sale.invoiceNumber})`,
                    note: note || `Deymoshubka invoice #${sale.invoiceNumber}`,
                    transactionDate: new Date(),
                    accountId,
                    userId
                }
            });

            return { updatedSale, account, transaction };
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Lacagta deynta ah waa la ururiyey si guul leh, koontada iyo buugga xisaabaadkana waa la cusboonaysiiyey!',
            data: result
        });
    } catch (error: any) {
        console.error('Error collecting receivable payment:', error);
        return NextResponse.json({ message: error.message || 'Error collecting payment' }, { status: 500 });
    }
}
