// app/api/manufacturing/accounting/payables/route.ts - Accounts Payable Engine
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all outstanding vendor payables from BOTH PurchaseOrders AND MaterialPurchases
export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();

        // 1. Fetch PurchaseOrders with unpaid balances (existing logic)
        const unpaidPurchaseOrders = await prisma.purchaseOrder.findMany({
            where: {
                companyId,
                paymentStatus: { notIn: ['Paid', 'PAID'] }
            },
            include: {
                vendor: { select: { name: true, phone: true, phoneNumber: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const poPayables = unpaidPurchaseOrders
            .filter(p => (p.total - p.paidAmount) > 0.01)
            .map(p => ({
                id: p.id,
                source: 'PurchaseOrder' as const,
                purchaseNumber: p.poNumber,
                materialName: `PO #${p.poNumber}`,
                vendorName: p.vendor?.name || 'Vendor',
                vendorPhone: p.vendor?.phone || p.vendor?.phoneNumber || '',
                totalPrice: p.total,
                paidAmount: p.paidAmount,
                debtAmount: p.total - p.paidAmount,
                status: p.paymentStatus,
                date: p.createdAt
            }));

        // 2. Fetch MaterialPurchases with unpaid balances (NEW)
        const unpaidMaterialPurchases = await prisma.materialPurchase.findMany({
            where: {
                companyId,
                paymentStatus: { notIn: ['PAID'] }
            },
            include: {
                vendor: { select: { name: true, phone: true, phoneNumber: true } }
            },
            orderBy: { purchaseDate: 'desc' }
        });

        const mpPayables = unpaidMaterialPurchases
            .filter(p => (p.totalPrice - (p.paidAmount || 0)) > 0.01)
            .map(p => ({
                id: p.id,
                source: 'MaterialPurchase' as const,
                purchaseNumber: p.invoiceNumber || `MP-${p.id.slice(0, 6).toUpperCase()}`,
                materialName: p.materialName,
                vendorName: p.vendor?.name || 'Vendor',
                vendorPhone: p.vendor?.phone || p.vendor?.phoneNumber || '',
                totalPrice: p.totalPrice,
                paidAmount: p.paidAmount || 0,
                debtAmount: p.totalPrice - (p.paidAmount || 0),
                status: p.paymentStatus || 'UNPAID',
                date: p.purchaseDate
            }));

        // 3. Combine both sources
        const payables = [...poPayables, ...mpPayables].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json({ payables });
    } catch (error: any) {
        console.error('Error fetching payables:', error);
        return NextResponse.json({ message: 'Error fetching payables', error: error.message }, { status: 500 });
    }
}

// POST: Pay vendor bill - handles both PurchaseOrder and MaterialPurchase sources
export async function POST(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const body = await request.json();
        const { purchaseId, amountPaid, accountId, note, source } = body;

        const paymentAmount = parseFloat(amountPaid);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return NextResponse.json({ message: 'Qadarku waa inuu ahaadaa tiro ka weyn eber.' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Check account balance first
            const accountToCheck = await tx.account.findFirst({
                where: { id: accountId, companyId }
            });
            if (!accountToCheck || accountToCheck.balance < paymentAmount) {
                throw new Error(`Khasnadda ama Bank-ga la doortay kuma filna lacag ku filan (Haraaga: ${accountToCheck?.balance?.toLocaleString() || 0} ETB).`);
            }

            let updatedRecord: any;
            let refNumber = '';

            if (source === 'MaterialPurchase') {
                // Handle MaterialPurchase payment
                const purchase = await tx.materialPurchase.findFirst({
                    where: { id: purchaseId, companyId }
                });
                if (!purchase) throw new Error('Diiwaanka lama heli karo.');

                const remainingDebt = purchase.totalPrice - (purchase.paidAmount || 0);
                if (paymentAmount > remainingDebt + 0.01) {
                    throw new Error(`Lacagta badan: deynta waa ${remainingDebt.toLocaleString()} ETB.`);
                }

                const newPaid = (purchase.paidAmount || 0) + paymentAmount;
                const newStatus = Math.abs(purchase.totalPrice - newPaid) < 0.1 ? 'PAID' : 'PARTIAL';

                updatedRecord = await tx.materialPurchase.update({
                    where: { id: purchaseId },
                    data: { paidAmount: newPaid, paymentStatus: newStatus }
                });
                refNumber = purchase.invoiceNumber || purchase.materialName;
            } else {
                // Handle PurchaseOrder payment (existing logic)
                const purchase = await tx.purchaseOrder.findFirst({
                    where: { id: purchaseId, companyId }
                });
                if (!purchase) throw new Error('Diiwaanka alaab-iibsiga lama heli karo.');

                const remainingDebt = purchase.total - purchase.paidAmount;
                if (paymentAmount > remainingDebt + 0.01) {
                    throw new Error(`Lacagta badan: deynta waa ${remainingDebt.toLocaleString()} ETB.`);
                }

                const newPaid = purchase.paidAmount + paymentAmount;
                const newStatus = Math.abs(purchase.total - newPaid) < 0.1 ? 'Paid' : 'Partial';

                updatedRecord = await tx.purchaseOrder.update({
                    where: { id: purchaseId },
                    data: { paidAmount: newPaid, paymentStatus: newStatus }
                });
                refNumber = purchase.poNumber;
            }

            // Decrement account balance
            const account = await tx.account.update({
                where: { id: accountId },
                data: { balance: { decrement: paymentAmount } }
            });

            // Log Transaction
            const transaction = await tx.transaction.create({
                data: {
                    companyId,
                    amount: paymentAmount,
                    type: 'EXPENSE',
                    description: `Deynbixinta: ${refNumber} (Ref: PAY-${refNumber})`,
                    note: note || `Deynbixinta #${refNumber}`,
                    transactionDate: new Date(),
                    accountId,
                    userId
                }
            });

            return { updatedRecord, account, transaction };
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Lacagta deynta ah waa la bixiyey si guul leh!',
            data: result
        });
    } catch (error: any) {
        console.error('Error paying vendor bill:', error);
        return NextResponse.json({ message: error.message || 'Error paying vendor bill' }, { status: 500 });
    }
}
