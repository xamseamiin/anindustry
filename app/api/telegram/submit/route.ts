import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyReceiptImageWithAI } from '@/lib/receipt-ai';
import { EXPENSE_STATES, makeIdempotencyKey } from '@/lib/financial-workflow';
import { readReceiptImage, storeReceiptImage } from '@/lib/receipt-storage';

export const dynamic = 'force-dynamic';
const MATERIAL_SUBCATEGORIES = ['Spare Parts', 'Raw Materials', 'Packaging', 'Tools & Equipment', 'Other Materials'];

function cleanNoteForTelegram(note: string) {
    if (!note) return '';
    return note
        .replace(/\[Account:\s*[^\]]+\]/g, '')
        .replace(/\[AccountId:\s*[^\]]+\]/g, '')
        .replace(/\[TelegramId:\s*[^\]]+\]/g, '')
        .replace(/\[Dalbaday:\s*[^\]]+\]/g, '')
        .replace(/\[ReceiptUrl:\s*[^\]]+\]/g, '')
        .replace(/\[SupplierReceiptUrl:\s*[^\]]+\]/g, '')
        .replace(/\[PurchaseReceiptUrl:\s*[^\]]+\]/g, '')
        .replace(/\[SupplierReceiptHash:\s*[^\]]+\]/g, '')
        .replace(/\[PurchaseReceiptHash:\s*[^\]]+\]/g, '')
        .trim();
}

async function sendTelegramMessage(token: string, chatId: string, text: string, receiptUrl?: string, replyMarkup?: any) {
    try {
        if (receiptUrl) {
            const image = await readReceiptImage(receiptUrl);
            if (image) {
                const formData = new FormData();
                formData.append('chat_id', chatId);
                formData.append('caption', text);
                formData.append('parse_mode', 'HTML');
                if (replyMarkup) {
                    formData.append('reply_markup', JSON.stringify(replyMarkup));
                }
                const blob = new Blob([Uint8Array.from(image.buffer)], { type: image.mimeType });
                formData.append('photo', blob, `receipt.${image.mimeType.split('/')[1] || 'jpg'}`);

                const url = `https://api.telegram.org/bot${token}/sendPhoto`;
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    const data = await response.json();
                    return data.result?.message_id || null;
                }
            }
        }
        
        // Fallback to text message
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const payload: any = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        };
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = await res.json();
            return data.result?.message_id || null;
        }
        return null;
    } catch (err) {
        console.error('Error sending telegram message:', err);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        const userId = process.env.TELEGRAM_USER_ID;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const defaultChatId = process.env.TELEGRAM_CHAT_ID || '';

        if (!companyId || !userId) {
            return NextResponse.json({ error: 'System not fully configured' }, { status: 500 });
        }

        const formData = await request.formData();
        const type = formData.get('type') as string; // 'SALARY', 'EXPENSE', 'RAW_MATERIAL'
        const accountId = formData.get('accountId') as string;
        const amountInput = formData.get('amount') as string;
        const note = (formData.get('note') as string) || '';
        const employeeId = formData.get('employeeId') as string;
        const categoryId = formData.get('categoryId') as string;
        const customChatId = formData.get('chatId') as string;
        const receiptFile = formData.get('receiptFile') as File | null;
        const purchaseReceiptFile = formData.get('purchaseReceiptFile') as File | null;
        const clientRequestId = (formData.get('clientRequestId') as string) || '';

        // Raw Material custom fields
        const vendorId = formData.get('vendorId') as string;
        const newVendorName = formData.get('newVendorName') as string;
        const materialId = formData.get('materialId') as string;
        const materialName = formData.get('materialName') as string;
        const newMaterialName = formData.get('newMaterialName') as string;
        const quantityInput = formData.get('quantity') as string;
        const unitPriceInput = formData.get('unitPrice') as string;
        const sparePartItemName = (formData.get('sparePartItemName') as string || '').trim();
        const sparePartVendorName = (formData.get('sparePartVendorName') as string || '').trim();
        const materialsSubcategory = (formData.get('materialsSubcategory') as string || 'Spare Parts').trim();
        const sparePartItemsRaw = formData.get('sparePartItems') as string | null;
        let sparePartItems: Array<{ itemName: string; quantity: number; unitPrice: number; total: number }> = [];
        if (sparePartItemsRaw) {
            try {
                const parsedItems = JSON.parse(sparePartItemsRaw);
                if (!Array.isArray(parsedItems) || parsedItems.length > 100) throw new Error('Liiska alaabta Spare Parts-ku sax ma aha.');
                sparePartItems = parsedItems.map((item: any) => ({
                    itemName: String(item?.name ?? item?.itemName ?? '').trim(),
                    quantity: Number(item?.quantity ?? item?.qty),
                    unitPrice: Number(item?.unitPrice ?? item?.price),
                    total: Number(item?.total ?? item?.lineTotal)
                }));
            } catch (error: any) {
                return NextResponse.json({ error: error.message || 'Liiska alaabta rasiidka lama akhrin.' }, { status: 400 });
            }
        } else if (sparePartItemName) {
            // Accept older Mini App clients which still submit one spare-part name.
            const legacyTotal = Number(amountInput) || 0;
            const legacyQuantity = Number(quantityInput) || 1;
            sparePartItems = [{
                itemName: sparePartItemName,
                quantity: legacyQuantity,
                unitPrice: Number(unitPriceInput) || legacyTotal / legacyQuantity,
                total: legacyTotal
            }];
        }
        const purchaseReceiptHash = (formData.get('purchaseReceiptHash') as string || '').trim();

        // Custom expense fields
        const transportType = formData.get('transportType') as string;
        const equipmentName = formData.get('equipmentName') as string;
        const rentalPeriod = formData.get('rentalPeriod') as string;
        const consultantName = formData.get('consultantName') as string;
        const consultancyType = formData.get('consultancyType') as string;
        const billType = formData.get('billType') as string;

        // Payment recipient fields
        let paymentPhone = formData.get('paymentPhone') as string || '';
        let recipientName = formData.get('recipientName') as string || '';

        // If salary request, auto-populate from employee record if missing
        if (type === 'SALARY' && employeeId) {
            try {
                const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
                if (employee) {
                    if (!recipientName) recipientName = employee.fullName;
                    if (!paymentPhone) paymentPhone = employee.phone || employee.phoneNumber || '';
                }
            } catch (e) {
                console.error("Error auto-populating employee info in submit route:", e);
            }
        }

        // Requester metadata
        const requesterName = formData.get('requesterName') as string || 'WebApp User';
        const requesterId = formData.get('requesterId') as string || '';
        const idempotencyKey = makeIdempotencyKey('telegram-submit', [companyId, requesterId, clientRequestId || `${type}:${accountId}:${amountInput}:${note}`]);
        const completedRequest = await prisma.idempotencyRecord.findUnique({ where: { key: idempotencyKey } });
        if (completedRequest?.status === 'COMPLETED') {
            return NextResponse.json({ success: true, data: completedRequest.response, duplicatePrevented: true });
        }

        const chatId = customChatId || defaultChatId;

        // 1. Handle File Upload & AI Vision Verification
        let receiptUrl = '';
        let purchaseReceiptUrl = '';
        let aiVerificationResult: any = null;

        if (receiptFile && receiptFile.size > 0) {
            const buffer = Buffer.from(await receiptFile.arrayBuffer());
            if (!new Set(['image/jpeg', 'image/png', 'image/webp']).has(receiptFile.type)) {
                return NextResponse.json({ error: 'Rasiidka JPG, PNG ama WEBP ha noqdo.' }, { status: 400 });
            }
            if (buffer.length > 10 * 1024 * 1024) return NextResponse.json({ error: 'Rasiidku kama weynaan karo 10MB.' }, { status: 400 });
            receiptUrl = await storeReceiptImage({ buffer, mimeType: receiptFile.type, folder: 'receipts', nameHint: receiptFile.name });

            // Trigger AI Vision scan with Google Gemini 1.5/2.0 Flash
            const expectedAmount = parseFloat(amountInput) || (parseFloat(quantityInput) * parseFloat(unitPriceInput)) || 0;
            if (expectedAmount > 0) {
                try {
                    aiVerificationResult = await verifyReceiptImageWithAI(buffer, expectedAmount, paymentPhone);
                    if (aiVerificationResult.isVerified && !aiVerificationResult.isMatch) {
                        return NextResponse.json({ 
                            error: aiVerificationResult.message || 'Rasiidka aad soo gelisay iyo lacagta/lambarka la dalbay isma laha!' 
                        }, { status: 400 });
                    }
                } catch (aiErr) {
                    console.error('AI Receipt Vision Verification Error:', aiErr);
                }
            }
        }

        if (purchaseReceiptFile && purchaseReceiptFile.size > 0) {
            if (!new Set(['image/jpeg', 'image/png', 'image/webp']).has(purchaseReceiptFile.type)) {
                return NextResponse.json({ error: 'Rasiidka alaabta JPG, PNG ama WEBP ha noqdo.' }, { status: 400 });
            }
            if (purchaseReceiptFile.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Rasiidka alaabta kama weynaan karo 10MB.' }, { status: 400 });
            purchaseReceiptUrl = await storeReceiptImage({
                buffer: Buffer.from(await purchaseReceiptFile.arrayBuffer()),
                mimeType: purchaseReceiptFile.type,
                folder: 'purchase_receipts',
                nameHint: purchaseReceiptFile.name
            });
        }

        // Build requester tags (Preserve requester name permanently)
        const requesterTag = `[Dalbaday: ${requesterName}] [TelegramId: ${requesterId}]`;
        let finalNote = note ? `${note}\n${requesterTag}` : requesterTag;
        if (purchaseReceiptUrl) finalNote += `\n[SupplierReceiptUrl: ${purchaseReceiptUrl}]`;
        if (purchaseReceiptHash) finalNote += `\n[SupplierReceiptHash:${purchaseReceiptHash}]`;
        if (sparePartItems.length) finalNote += `\n[SparePartsItems:${encodeURIComponent(JSON.stringify(sparePartItems))}]`;
        if (paymentPhone) finalNote += `\n[PaymentPhone: ${paymentPhone}]`;
        if (recipientName) finalNote += `\n[RecipientName: ${recipientName}]`;
        if (aiVerificationResult && aiVerificationResult.isVerified) {
            finalNote += `\n[AI-Verified: ${aiVerificationResult.isMatch ? 'Match' : 'Mismatch'}]`;
            if (aiVerificationResult.extractedAmount !== null) {
                finalNote += ` [ExtractedAmount: ${aiVerificationResult.extractedAmount}]`;
            }
            if (aiVerificationResult.transactionId) {
                finalNote += ` [TxId: ${aiVerificationResult.transactionId}]`;
            }
        }

        const isRawMaterial = type === 'RAW_MATERIAL';
        const isSpareParts = type === 'EXPENSE' && ['MATERIALS', 'SPARE_PARTS'].includes(categoryId);

        // 2. Perform database transaction
        const result = await prisma.$transaction(async (tx) => {
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account) throw new Error('Koontada la doortay lama helin.');
            if (!/e-?birr\s+merchant/i.test(account.name)) throw new Error('Kharashyada hadda E-Birr Merchant oo keliya ayaa laga bixin karaa.');
            const availableBalance = Number(account.balance) - Number(account.reservedBalance);

            if (accountId && !finalNote.includes('[AccountId:')) {
                finalNote = `${finalNote}\n[Account: ${account.name}] [AccountId: ${accountId}]`;
            }

            if (isRawMaterial) {
                // Determine supplier/vendor
                let finalVendorId = vendorId;
                let supplierName = '';
                if (!finalVendorId && newVendorName) {
                    const newVendor = await tx.shopVendor.create({
                        data: {
                            name: newVendorName,
                            type: 'SUPPLIER',
                            companyId
                        }
                    });
                    finalVendorId = newVendor.id;
                    supplierName = newVendor.name;
                } else if (finalVendorId) {
                    const vendor = await tx.shopVendor.findUnique({ where: { id: finalVendorId } });
                    if (vendor) {
                        supplierName = vendor.name;
                    }
                }

                if (!finalVendorId) throw new Error('Supplier-ka kharashka la siinayo waa qasab.');

                const finalMatName = materialName || newMaterialName || 'Raw Material';
                const finalMatUnit = 'pcs';
                const mpQty = parseFloat(quantityInput) || 1;
                const mpPrice = parseFloat(unitPriceInput) || 0;
                const mpTotal = mpQty * mpPrice;

                // Create or update inventory
                let material = await tx.factoryMaterial.findFirst({
                    where: { name: finalMatName, companyId }
                });

                if (!material) {
                    material = await tx.factoryMaterial.create({
                        data: {
                            companyId,
                            userId,
                            name: finalMatName,
                            sku: `RAW-${Math.random().toString(36).substring(7).toUpperCase()}`,
                            category: 'Raw Material',
                            unit: finalMatUnit,
                            inStock: mpQty,
                            minStock: 10,
                            purchasePrice: mpPrice,
                            sellingPrice: 0,
                            location: 'Warehouse'
                        }
                    });
                } else {
                    await tx.factoryMaterial.update({
                        where: { id: material.id },
                        data: {
                            inStock: { increment: mpQty },
                            purchasePrice: mpPrice
                        }
                    });
                }

                // If receipt is uploaded, it is paid. Else unpaid.
                const isPaid = !!receiptUrl || formData.get('isPaid') === 'true';
                if (isPaid && mpTotal > availableBalance) throw new Error(`Haraaga la isticmaali karo waa ${availableBalance.toLocaleString()} ETB.`);
                let purchaseNotes = finalNote;
                if (receiptUrl) {
                    purchaseNotes = `${purchaseNotes}\n[ReceiptUrl: ${receiptUrl}]`;
                }
                if (purchaseReceiptUrl) purchaseNotes += `\n[PurchaseReceiptUrl: ${purchaseReceiptUrl}]`;

                const purchase = await tx.materialPurchase.create({
                    data: {
                        companyId,
                        materialName: finalMatName,
                        quantity: mpQty,
                        unit: finalMatUnit,
                        unitPrice: mpPrice,
                        totalPrice: mpTotal,
                        vendorId: finalVendorId,
                        purchaseDate: new Date(),
                        notes: purchaseNotes,
                        paidAmount: isPaid ? mpTotal : 0,
                        paymentStatus: isPaid ? 'PAID' : 'UNPAID'
                    }
                });

                let updatedBalance = account.balance;
                if (isPaid) {
                    // Decrement account
                    const updatedAcc = await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { decrement: mpTotal } }
                    });
                    updatedBalance = updatedAcc.balance;

                    // Log transaction
                    await tx.transaction.create({
                        data: {
                            companyId,
                            amount: mpTotal,
                            type: 'EXPENSE',
                            description: `Deynbixinta: ${finalMatName} (Ref: PAY-${finalMatName})`,
                            note: `Deynbixinta #${finalMatName} (Telegram WebApp Ingestion)`,
                            transactionDate: new Date(),
                            accountId: accountId,
                            receiptUrl: receiptUrl || null
                        }
                    });
                }

                return {
                    id: purchase.id,
                    isPurchase: true,
                    materialName: finalMatName,
                    materialUnit: finalMatUnit,
                    quantity: mpQty,
                    unitPrice: mpPrice,
                    totalPrice: mpTotal,
                    supplierName,
                    accountName: account.name,
                    accountBalance: updatedBalance,
                    isPaid
                };
            }

            // Salary & Expense
            const amount = parseFloat(amountInput);
            if (isNaN(amount) || amount <= 0) throw new Error('Lacagta la galiyey sax ma aha.');

            let finalCategoryName = '';
            let finalDescription = '';
            let employeeName = '';

            if (type === 'SALARY') {
                const employee = await tx.employee.findUnique({ where: { id: employeeId } });
                if (!employee) throw new Error('Shaqaalaha la doortay lama helin.');

                employeeName = employee.fullName;
                finalCategoryName = 'Salaries';
                finalDescription = `Mushaharka: ${employee.fullName} (${note || 'Bixinta Mushaharka'})`;

                const employeeUpdateData: any = {};

                // If employee doesn't have a phone number, save it!
                if (paymentPhone && !employee.phone && !employee.phoneNumber) {
                    employeeUpdateData.phone = paymentPhone;
                    employeeUpdateData.phoneNumber = paymentPhone;
                }

                await tx.employee.update({
                    where: { id: employee.id },
                    data: employeeUpdateData
                });
            } else {
                const category = isSpareParts ? null : await tx.expenseCategory.findUnique({ where: { id: categoryId } });
                if (!isSpareParts && !category) throw new Error('Nooca kharashka lama helin.');

                finalCategoryName = isSpareParts ? 'Materials' : category!.name;
                if (isSpareParts) {
                    if (!MATERIAL_SUBCATEGORIES.includes(materialsSubcategory)) throw new Error('Nooca Materials-ka sax ma aha.');
                    if (!sparePartVendorName) throw new Error('Magaca supplier-ka Materials-ka waa qasab.');
                    if (!sparePartItems.length || sparePartItems.some(item => !item.itemName || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !Number.isFinite(item.total) || item.total <= 0)) {
                        throw new Error('Saf kasta oo Materials ah geli magac, qty, qiime iyo total sax ah.');
                    }
                    const lineItemsTotal = sparePartItems.reduce((sum, item) => sum + item.total, 0);
                    if (Math.abs(lineItemsTotal - amount) > 0.05) throw new Error('Wadarta guud waa inay la mid noqotaa wadarta safafka alaabta.');
                    const itemSummary = sparePartItems.map(item => `${item.itemName} (${item.quantity} × ${item.unitPrice.toLocaleString()} = ${item.total.toLocaleString()} ETB)`).join('; ');
                    finalDescription = `Materials (${materialsSubcategory}): ${itemSummary} · ${sparePartVendorName}${note ? ` — ${note}` : ''}`;
                } else if (finalCategoryName === 'Transport & Fuel' && transportType) {
                    finalDescription = `${finalCategoryName} (${transportType}): ${note}`;
                } else if (finalCategoryName === 'Equipment Rental' && equipmentName) {
                    finalDescription = `${finalCategoryName} (${equipmentName} - ${rentalPeriod || ''}): ${note}`;
                } else if (finalCategoryName === 'Consultancy & Service' && consultantName) {
                    finalDescription = `${finalCategoryName} (${consultantName} - ${consultancyType || ''}): ${note}`;
                } else if (finalCategoryName === 'Bills' && billType) {
                    finalDescription = `${finalCategoryName} (${billType}): ${note}`;
                } else {
                    finalDescription = `${finalCategoryName}: ${note}`;
                }
            }

            const isPaid = !!receiptUrl || formData.get('isPaid') === 'true';
            if (isPaid && amount > availableBalance) throw new Error(`Haraaga la isticmaali karo waa ${availableBalance.toLocaleString()} ETB.`);
            const needsApproval = amount >= 5000;
            const initialWorkflowStatus = isPaid
                ? EXPENSE_STATES.PAID
                : amount > availableBalance
                    ? EXPENSE_STATES.INSUFFICIENT_FUNDS
                    : needsApproval
                        ? EXPENSE_STATES.PENDING_APPROVAL
                        : EXPENSE_STATES.AWAITING_RECEIPT;
            const expense = await tx.expense.create({
                data: {
                    companyId,
                    userId,
                    description: finalDescription,
                    amount: amount,
                    category: finalCategoryName,
                    categoryId: type === 'EXPENSE' && !isSpareParts ? categoryId : null,
                    employeeId: type === 'SALARY' ? employeeId : null,
                    accountId: accountId,
                    paidFrom: account.name,
                    supplierName: isSpareParts ? sparePartVendorName : null,
                    materials: isSpareParts ? { subCategory: materialsSubcategory, items: sparePartItems, supplierName: sparePartVendorName, receiptTotal: amount } : undefined,
                    approved: isPaid,
                    paymentStatus: isPaid ? 'PAID' : 'UNPAID',
                    paymentDate: isPaid ? new Date() : null,
                    receiptUrl: isSpareParts ? (purchaseReceiptUrl || receiptUrl || null) : (receiptUrl || null),
                    note: finalNote,
                    workflowStatus: initialWorkflowStatus,
                    idempotencyKey,
                    
                    // Custom fields
                    transportType: transportType || null,
                    equipmentName: equipmentName || null,
                    rentalPeriod: rentalPeriod || null,
                    consultantName: consultantName || null,
                    consultancyType: consultancyType || null,
                    subCategory: isSpareParts ? materialsSubcategory : billType || null
                }
            });

            let updatedBalance = account.balance;
            if (isPaid) {
                if (type === 'SALARY' && employeeId) {
                    await tx.employee.update({ where: { id: employeeId }, data: { salaryPaidThisMonth: { increment: amount } } });
                }
                const balanceBefore = Number(account.balance);
                const updatedAcc = await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: amount } }
                });
                updatedBalance = updatedAcc.balance;

                await tx.transaction.create({
                    data: {
                        companyId,
                        userId,
                        description: finalDescription,
                        amount: amount,
                        type: 'EXPENSE',
                        accountId: accountId,
                        expenseId: expense.id,
                        employeeId: type === 'SALARY' ? employeeId : null,
                        receiptUrl: receiptUrl || null,
                        idempotencyKey: `${idempotencyKey}:payment`,
                        balanceBefore,
                        balanceAfter: balanceBefore - amount
                    }
                });
            }

            return {
                id: expense.id,
                isPurchase: false,
                accountName: account.name,
                accountBalance: updatedBalance,
                employeeName,
                categoryName: finalCategoryName,
                isPaid
            };
        });

        // 3. Fetch E-Birr Merchant live balance - completely disabled as requested (only mid-line balance shown)
        const eBirrMerchantBalanceLine = '';

        // 4. Send Telegram Notification
        if (token && chatId && process.env.TELEGRAM_NOTIFICATIONS_DISABLED !== 'true') {
            const formattedDate = new Date().toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
            let telegramText = '';
            let replyMarkup: any = null;

            // Build requester info line
            let requesterLine = '';
            if (requesterId) {
                requesterLine = `🗣 <b>Soo Dalbay:</b> <a href="tg://user?id=${requesterId}">${requesterName}</a>\n`;
            } else if (requesterName) {
                requesterLine = `🗣 <b>Soo Dalbay:</b> ${requesterName}\n`;
            }

            // Build payment contact info line
            let paymentContactLine = '';
            if (recipientName && paymentPhone) {
                paymentContactLine = `👤 Loo dirayo: ${recipientName}\n📱 Lambarka: ${paymentPhone}\n`;
            } else if (paymentPhone) {
                paymentContactLine = `📱 Lambarka: ${paymentPhone}\n`;
            } else if (recipientName) {
                paymentContactLine = `👤 Loo dirayo: ${recipientName}\n`;
            }

            let aiStatusLine = '';
            if (aiVerificationResult && aiVerificationResult.isVerified) {
                if (aiVerificationResult.isMatch) {
                    aiStatusLine = `\n🤖 <b>AI Verification:</b> ✅ Rasiidka waa la xaqiijiyay (${aiVerificationResult.extractedAmount ? aiVerificationResult.extractedAmount.toLocaleString() + ' ETB' : 'Waafaqsan'})`;
                } else {
                    aiStatusLine = `\n🤖 <b>AI Verification:</b> ⚠️ Lacagta rasiidka ku qallan (${aiVerificationResult.extractedAmount ? aiVerificationResult.extractedAmount.toLocaleString() + ' ETB' : 'Lama helin'}) ka duwan tahay lacagta la codsaday (${aiVerificationResult.expectedAmount.toLocaleString()} ETB)!`;
                }
                if (aiVerificationResult.transactionId) {
                    aiStatusLine += ` (TxID: ${aiVerificationResult.transactionId})`;
                }
            }

            if (result.isPurchase) {
                if (result.isPaid) {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Diiwaangelinta Qalabka / Raw Material (Waala Bixiyey)</b>\n\n` +
                                   requesterLine +
                                   `🏭 Alaab-keenaha: ${result.supplierName}\n` +
                                   `📦 Name: ${result.materialName}\n` +
                                   `📊 Qty: ${result.quantity} ${result.materialUnit}\n` +
                                   `💵 Price: ${Number(result.unitPrice).toLocaleString()} ETB\n` +
                                   `💰 Total: ${Number(result.totalPrice).toLocaleString()} ETB\n` +
                                   paymentContactLine +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                   `📅 Taariikhda: ${formattedDate}` +
                                   aiStatusLine;
                // No keyboard buttons for paid procurement
                } else {
                    const reqApproval = Number(result.totalPrice) >= 5000 && ! (result as any).approved;
                    if (reqApproval) {
                        telegramText = `<b>AN-Industory</b>\n` +
                                       `<b>⏳ Codsiga Qalabka / Raw Material (Sugaya Oggolaanshaha Manager-ka)</b>\n\n` +
                                       requesterLine +
                                       `🏭 Alaab-keenaha: ${result.supplierName}\n` +
                                       `📦 Name: ${result.materialName}\n` +
                                       `📊 Qty: ${result.quantity} ${result.materialUnit}\n` +
                                       `💵 Price: ${Number(result.unitPrice).toLocaleString()} ETB\n` +
                                       `💰 Total: ${Number(result.totalPrice).toLocaleString()} ETB\n` +
                                       paymentContactLine +
                                       `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                       `📅 Taariikhda: ${formattedDate}\n\n` +
                                       `🛑 <b>Codsigan wuxuu u baahan yahay oggolaanshaha admin-ka madaama uu gaarayo ama ka badan yahay 5,000 ETB.</b>` +
                                       aiStatusLine;
                        replyMarkup = {
                            inline_keyboard: [
                                [
                                    { text: "✓ Oggolow (Approve)", callback_data: `approve_exp_${result.id}` },
                                    { text: "🛑 Diid (Reject)", callback_data: `reject_exp_${result.id}` }
                                ]
                            ]
                        };
                    } else {
                        telegramText = `<b>AN-Industory</b>\n` +
                                       `<b>📋 Codsiga Qalabka / Raw Material (Sugaya Rasiidka)</b>\n\n` +
                                       requesterLine +
                                       `🏭 Alaab-keenaha: ${result.supplierName}\n` +
                                       `📦 Name: ${result.materialName}\n` +
                                       `📊 Qty: ${result.quantity} ${result.materialUnit}\n` +
                                       `💵 Price: ${Number(result.unitPrice).toLocaleString()} ETB\n` +
                                       `💰 Total: ${Number(result.totalPrice).toLocaleString()} ETB\n` +
                                       paymentContactLine +
                                       `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                       `📅 Taariikhda: ${formattedDate}\n\n` +
                                       `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...` +
                                       aiStatusLine;
                        replyMarkup = {
                            inline_keyboard: [
                                [
                                    { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_mp_${result.id}` }
                                ]
                            ]
                        };
                    }
                }
            } else if (type === 'SALARY') {
                if (result.isPaid) {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Mushahar Bixin Guulaystay! (Waala Bixiyey)</b>\n\n` +
                                   requesterLine +
                                   `👤 Shaqaalaha: ${result.employeeName}\n` +
                                   `💵 Lacagta la bixiyey: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                   (paymentPhone ? `📱 Lambarka: ${paymentPhone}\n` : '') +
                                   `💳 Koontada: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note || 'Mushaharka bisha')}\n` +
                                   `📅 Taariikhda: ${formattedDate}` +
                                   aiStatusLine;
                // No keyboard buttons for paid salaries
                } else {
                    const reqApproval = parseFloat(amountInput) >= 5000 && ! (result as any).approved;
                    if (reqApproval) {
                        telegramText = `<b>AN-Industory</b>\n` +
                                       `<b>⏳ Codsiga Mushaharka (Sugaya Oggolaanshaha Manager-ka)</b>\n\n` +
                                       requesterLine +
                                       `👤 Shaqaalaha: ${result.employeeName}\n` +
                                       `💵 Lacagta la dalbay: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                       (paymentPhone ? `📱 Lambarka: ${paymentPhone}\n` : '') +
                                       `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                       `📝 Sharaxaad: ${cleanNoteForTelegram(note || 'Mushaharka bisha')}\n` +
                                       `📅 Taariikhda: ${formattedDate}\n\n` +
                                       `🛑 <b>Codsigan wuxuu u baahan yahay oggolaanshaha admin-ka madaama uu gaarayo ama ka badan yahay 5,000 ETB.</b>` +
                                       aiStatusLine;
                        replyMarkup = {
                            inline_keyboard: [
                                [
                                    { text: "✓ Oggolow (Approve)", callback_data: `approve_exp_${result.id}` },
                                    { text: "🛑 Diid (Reject)", callback_data: `reject_exp_${result.id}` }
                                ]
                            ]
                        };
                    } else {
                        telegramText = `<b>AN-Industory</b>\n` +
                                       `<b>📋 Codsiga Mushaharka (Sugaya Rasiidka)</b>\n\n` +
                                       requesterLine +
                                       `👤 Shaqaalaha: ${result.employeeName}\n` +
                                       `💵 Lacagta la dalbay: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                       (paymentPhone ? `📱 Lambarka: ${paymentPhone}\n` : '') +
                                       `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                       `📝 Sharaxaad: ${cleanNoteForTelegram(note || 'Mushaharka bisha')}\n` +
                                       `📅 Taariikhda: ${formattedDate}\n\n` +
                                       `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...` +
                                       aiStatusLine;
                        replyMarkup = {
                            inline_keyboard: [
                                [
                                    { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_${result.id}` }
                                ]
                            ]
                        };
                    }
                }
            } else {
                let customFieldsText = '';
                if (result.categoryName === 'Transport & Fuel' && transportType) {
                    customFieldsText = `🚗 Nooca Gadiidka: ${transportType}\n`;
                } else if (result.categoryName === 'Equipment Rental' && equipmentName) {
                    customFieldsText = `⚙️ Qalabka: ${equipmentName}\n📅 Muddada Kirada: ${rentalPeriod || ''}\n`;
                } else if (result.categoryName === 'Consultancy & Service' && consultantName) {
                    customFieldsText = `👤 La-taliyaha: ${consultantName}\n📋 Adeegga: ${consultancyType || ''}\n`;
                } else if (result.categoryName === 'Materials') {
                    const sparePartsLines = sparePartItems.map((item, index) => `${index + 1}. ${item.itemName} · Qty ${item.quantity} × ${item.unitPrice.toLocaleString()} = ${item.total.toLocaleString()} ETB`).join('\n');
                    customFieldsText = `📦 Nooca: ${materialsSubcategory}\n🏭 Alaab-keenaha: ${sparePartVendorName}\n🔧 Agabka la soo iibsaday:\n${sparePartsLines}\n`;
                } else if (result.categoryName === 'Bills' && billType) {
                    customFieldsText = `🧾 Nooca Biilka: ${billType}\n`;
                }

                if (result.isPaid) {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Diiwaangelinta Kharashka (Waala Bixiyey)</b>\n\n` +
                                   requesterLine +
                                   `📂 Qaybta: ${result.categoryName}\n` +
                                   `💵 Lacagta la bixiyey: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                   customFieldsText +
                                   paymentContactLine +
                                   `💳 Koontada: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                   `📅 Taariikhda: ${formattedDate}` +
                                   aiStatusLine;
                // No keyboard buttons for paid expenses
                } else {
                    const reqApproval = parseFloat(amountInput) >= 5000 && ! (result as any).approved;
                    if (reqApproval) {
                        telegramText = `<b>AN-Industory</b>\n` +
                                       `<b>⏳ Codsiga Kharashka (Sugaya Oggolaanshaha Manager-ka)</b>\n\n` +
                                       requesterLine +
                                       `📂 Qaybta: ${result.categoryName}\n` +
                                       `💵 Lacagta la dalbay: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                       customFieldsText +
                                       paymentContactLine +
                                       `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                       `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                       `📅 Taariikhda: ${formattedDate}\n\n` +
                                       `🛑 <b>Codsigan wuxuu u baahan yahay oggolaanshaha admin-ka madaama uu gaarayo ama ka badan yahay 5,000 ETB.</b>` +
                                       aiStatusLine;
                        replyMarkup = {
                            inline_keyboard: [
                                [
                                    { text: "✓ Oggolow (Approve)", callback_data: `approve_exp_${result.id}` },
                                    { text: "🛑 Diid (Reject)", callback_data: `reject_exp_${result.id}` }
                                ]
                            ]
                        };
                    } else {
                        telegramText = `<b>AN-Industory</b>\n` +
                                       `<b>📋 Codsiga Kharashka (Sugaya Rasiidka)</b>\n\n` +
                                       requesterLine +
                                       `📂 Qaybta: ${result.categoryName}\n` +
                                       `💵 Lacagta la dalbay: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                       customFieldsText +
                                       paymentContactLine +
                                       `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                       `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                       `📅 Taariikhda: ${formattedDate}\n\n` +
                                       `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...` +
                                       aiStatusLine;
                        replyMarkup = {
                            inline_keyboard: [
                                [
                                    { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_${result.id}` }
                                ]
                            ]
                        };
                    }
                }
            }

            const requestedAmount = result.isPurchase ? Number(result.totalPrice) : parseFloat(amountInput);
            const availableBalance = Number(result.accountBalance);
            const insufficientFunds = !result.isPaid && requestedAmount > availableBalance;
            if (insufficientFunds) {
                telegramText += `\n\n⚠️ <b>HARAAGA KOONTADU KUMA FILNA</b>\n` +
                    `Koontada waxaa ku jira: <b>${availableBalance.toLocaleString()} ETB</b>\n` +
                    `Dalabku wuxuu u baahan yahay: <b>${requestedAmount.toLocaleString()} ETB</b>\n` +
                    `Waxaa dhiman: <b>${(requestedAmount - availableBalance).toLocaleString()} ETB</b>\n\n` +
                    `Fadlan marka hore lacag ku shub koontada. Rasiid lama gelin karo ilaa haraagu ku filnaado.`;

                if (requestedAmount < 5000) {
                    replyMarkup = {
                        inline_keyboard: [[{
                            text: "🔄 Hubi Haraaga / Gali Rasiidka",
                            callback_data: result.isPurchase ? `rcpt_mp_${result.id}` : `rcpt_${result.id}`
                        }]]
                    };
                }
            }

            const sentMsgId = await sendTelegramMessage(token, chatId, telegramText, (receiptUrl || purchaseReceiptUrl) || undefined, replyMarkup);
            if (sentMsgId && result.id) {
                try {
                    if (result.isPurchase) {
                        const purchase = await prisma.materialPurchase.findUnique({ where: { id: result.id }, select: { notes: true } });
                        const oldNotes = purchase?.notes || '';
                        const notes = `${oldNotes.replace(/\[TelegramChatId:\s*[^\]]+\]/g, '').replace(/\[TelegramMessageId:\s*[^\]]+\]/g, '').trim()}\n[TelegramChatId: ${chatId}] [TelegramMessageId: ${sentMsgId}]`.trim();
                        await prisma.materialPurchase.update({ where: { id: result.id }, data: { notes } });
                    } else {
                    await prisma.expense.update({
                        where: { id: result.id },
                        data: { telegramMessageId: sentMsgId, telegramChatId: chatId }
                    });
                    }
                } catch (_) { /* non-critical */ }
            }
        }

        await prisma.idempotencyRecord.upsert({
            where: { key: idempotencyKey },
            create: { key: idempotencyKey, scope: 'TELEGRAM_SUBMIT', companyId, status: 'COMPLETED', response: JSON.parse(JSON.stringify(result)) },
            update: { status: 'COMPLETED', response: JSON.parse(JSON.stringify(result)) }
        });
        return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
        console.error('Error submitting Telegram transaction:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
