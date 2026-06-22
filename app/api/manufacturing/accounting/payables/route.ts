// app/api/manufacturing/accounting/payables/route.ts - Accounts Payable Engine
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all outstanding vendor payables from BOTH PurchaseOrders AND MaterialPurchases, AND Transaction-based debts
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

        // 2. Fetch MaterialPurchases with unpaid balances (existing logic)
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

        // 3. Fetch manual debts from Transactions (NEW)
        const debtTakenTransactions = await prisma.transaction.findMany({
            where: {
                companyId,
                type: 'DEBT_TAKEN',
                OR: [
                    { category: null },
                    { category: { not: 'Material Purchase Debt' } }
                ],
                AND: [
                    {
                        OR: [
                            { customerId: { not: null } },
                            { vendorId: { not: null } }
                        ]
                    }
                ]
            },
            include: {
                customer: { select: { name: true, phone: true } },
                vendor: { select: { name: true, phone: true, phoneNumber: true } }
            },
            orderBy: { transactionDate: 'asc' }
        });

        const debtRepaidTransactions = await prisma.transaction.findMany({
            where: {
                companyId,
                type: 'DEBT_REPAID'
            },
            orderBy: { transactionDate: 'asc' }
        });

        // Calculate paid amount for each DEBT_TAKEN transaction
        const paidAmounts: Record<string, number> = {};
        debtTakenTransactions.forEach(t => {
            paidAmounts[t.id] = 0;
        });

        const processedRepaidIds = new Set<string>();

        // Step 1: Explicit matching by ID in description or note
        debtRepaidTransactions.forEach(repaid => {
            const matchedTaken = debtTakenTransactions.find(taken => 
                (repaid.description && repaid.description.includes(taken.id)) ||
                (repaid.note && repaid.note.includes(taken.id)) ||
                (repaid.description && repaid.description.includes(`DEBT-REPAY-${taken.id}`))
            );
            
            if (matchedTaken) {
                paidAmounts[matchedTaken.id] += Number(repaid.amount);
                processedRepaidIds.add(repaid.id);
            }
        });

        // Step 2: FIFO matching for remaining (unlinked) repayments by customer/vendor
        const unlinkedRepayments = debtRepaidTransactions.filter(r => !processedRepaidIds.has(r.id));
        const customerRepayments: Record<string, number> = {};
        const vendorRepayments: Record<string, number> = {};

        unlinkedRepayments.forEach(repaid => {
            const amount = Number(repaid.amount);
            if (repaid.customerId) {
                customerRepayments[repaid.customerId] = (customerRepayments[repaid.customerId] || 0) + amount;
            } else if (repaid.vendorId) {
                vendorRepayments[repaid.vendorId] = (vendorRepayments[repaid.vendorId] || 0) + amount;
            }
        });

        debtTakenTransactions.forEach(taken => {
            const totalTxAmount = Number(taken.amount);
            const alreadyPaid = paidAmounts[taken.id];
            let remainingToPay = totalTxAmount - alreadyPaid;
            
            if (remainingToPay <= 0) return;
            
            if (taken.customerId && customerRepayments[taken.customerId] > 0) {
                const availableRepayment = customerRepayments[taken.customerId];
                const applied = Math.min(remainingToPay, availableRepayment);
                paidAmounts[taken.id] += applied;
                customerRepayments[taken.customerId] -= applied;
            } else if (taken.vendorId && vendorRepayments[taken.vendorId] > 0) {
                const availableRepayment = vendorRepayments[taken.vendorId];
                const applied = Math.min(remainingToPay, availableRepayment);
                paidAmounts[taken.id] += applied;
                vendorRepayments[taken.vendorId] -= applied;
            }
        });

        const txPayables = debtTakenTransactions
            .map(t => {
                const total = Number(t.amount);
                const paid = paidAmounts[t.id] || 0;
                const debt = total - paid;
                
                let partyName = 'Vendor/Customer';
                let partyPhone = '';
                if (t.customer) {
                    partyName = t.customer.name;
                    partyPhone = t.customer.phone || '';
                } else if (t.vendor) {
                    partyName = t.vendor.name;
                    partyPhone = t.vendor.phone || t.vendor.phoneNumber || '';
                }
                
                return {
                    id: t.id,
                    source: 'Transaction' as const,
                    purchaseNumber: t.description.match(/\(Ref:\s*([^)]+)\)/i)?.[1] || `DEBT-${t.id.slice(0, 6).toUpperCase()}`,
                    materialName: t.description || 'Dayn Qaadasho',
                    vendorName: partyName,
                    vendorPhone: partyPhone,
                    totalPrice: total,
                    paidAmount: paid,
                    debtAmount: debt,
                    status: debt <= 0.01 ? 'PAID' : paid > 0.01 ? 'PARTIAL' : 'UNPAID',
                    date: t.transactionDate
                };
            })
            .filter(p => p.debtAmount > 0.01);

        // 4. Combine all sources
        const payables = [...poPayables, ...mpPayables, ...txPayables].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json({ payables });
    } catch (error: any) {
        console.error('Error fetching payables:', error);
        return NextResponse.json({ message: 'Error fetching payables', error: error.message }, { status: 500 });
    }
}

// POST: Pay vendor bill - handles PurchaseOrder, MaterialPurchase, and Transaction sources
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
                    where: { id: purchaseId, companyId },
                    include: { vendor: true }
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
            } else if (source === 'Transaction') {
                // Handle repayment of a debt taken transaction
                const debtTx = await tx.transaction.findFirst({
                    where: { id: purchaseId, companyId }
                });
                if (!debtTx) throw new Error('Diiwaanka daynta lama heli karo.');

                // Calculate current paid amount for this specific DEBT_TAKEN transaction
                const previousRepayments = await tx.transaction.findMany({
                    where: {
                        companyId,
                        type: 'DEBT_REPAID',
                        OR: [
                            { description: { contains: `DEBT-REPAY-${debtTx.id}` } },
                            { note: { contains: debtTx.id } }
                        ]
                    }
                });

                const totalPreviousPaid = previousRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
                const remainingDebt = Number(debtTx.amount) - totalPreviousPaid;

                if (paymentAmount > remainingDebt + 0.01) {
                    throw new Error(`Lacagta badan: deynta hadda u dhiman waa ${remainingDebt.toLocaleString()} ETB.`);
                }

                refNumber = debtTx.description.match(/\(Ref:\s*([^)]+)\)/i)?.[1] || `DEBT-${debtTx.id.slice(0, 6).toUpperCase()}`;

                // Create DEBT_REPAID transaction
                updatedRecord = await tx.transaction.create({
                    data: {
                        companyId,
                        amount: paymentAmount,
                        type: 'DEBT_REPAID',
                        description: `Deynbixinta: Dayn Qaadasho (Ref: DEBT-REPAY-${debtTx.id})`,
                        note: note || `Repayment for debt transaction #${debtTx.id}`,
                        transactionDate: new Date(),
                        accountId,
                        customerId: debtTx.customerId,
                        vendorId: debtTx.vendorId,
                        userId
                    }
                });

                // Decrement account balance
                const account = await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: paymentAmount } }
                });

                return { updatedRecord, account, transaction: updatedRecord };
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

            // Decrement account balance for PO / MP
            const account = await tx.account.update({
                where: { id: accountId },
                data: { balance: { decrement: paymentAmount } }
            });

            // Log Transaction for PO / MP
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

        // If the payable is a MaterialPurchase and is fully paid, update Telegram in real-time
        if (source === 'MaterialPurchase' && result.updatedRecord && result.updatedRecord.paymentStatus === 'PAID') {
            const purchase = result.updatedRecord;
            const telegramMetadata = purchase.notes || '';
            const chatIdMatch = telegramMetadata.match(/\[TelegramChatId:\s*([^\]]+)\]/);
            const messageIdMatch = telegramMetadata.match(/\[TelegramMessageId:\s*([^\]]+)\]/);

            if (chatIdMatch && messageIdMatch) {
                const chatId = chatIdMatch[1];
                const messageId = parseInt(messageIdMatch[1]);
                if (!isNaN(messageId)) {
                    const cleanNote = (purchase.notes || '')
                        .replace(/\[TelegramChatId:\s*[^\]]+\]/g, '')
                        .replace(/\[TelegramMessageId:\s*[^\]]+\]/g, '')
                        .replace(/\[TelegramId:\s*\d+\]/g, '')
                        .replace(/\[Dalbaday:\s*[^\]]+\]/g, '')
                        .replace(/\[AccountId:\s*[^\]]+\]/g, '')
                        .replace(/\[Account:\s*[^\]]+\]/g, '')
                        .replace(/\[ReceiptUrl:\s*[^\]]+\]/g, '')
                        .trim();

                    const formattedDate = new Date(purchase.purchaseDate || purchase.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });

                    const captionText = `<b>AN-Industory</b>\n` +
                                        `<b>✅ Diiwaangelinta Qalabka / Raw Material (Procurement)</b>\n\n` +
                                        `🏭 Alaab-keenaha: ${purchase.vendor ? purchase.vendor.name : 'Unknown'}\n` +
                                        `📦 Name: ${purchase.materialName}\n` +
                                        `📊 Qty: ${purchase.quantity} ${purchase.unit}\n` +
                                        `💵 Price: ${Number(purchase.unitPrice).toLocaleString()} ETB\n` +
                                        `💰 Total: ${Number(purchase.totalPrice).toLocaleString()} ETB\n` +
                                        `📝 Sharaxaad: ${cleanNote}\n` +
                                        `📅 Taariikhda: ${formattedDate}\n\n` +
                                        `✅ Rasiidka waa la galiyey oo haraaga waa laga jaray.`;

                    const hasPhoto = telegramMetadata.includes('[ReceiptUrl:');
                    try {
                        const { telegramSender } = await import('@/lib/telegram-sender');
                        await telegramSender.updateMessageToPaid(chatId, messageId, captionText, hasPhoto);
                    } catch (err) {
                        console.error("Error updating payables paid Telegram message:", err);
                    }
                }
            }
        }

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
