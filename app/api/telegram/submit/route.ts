import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function cleanNoteForTelegram(note: string) {
    if (!note) return '';
    return note
        .replace(/\[Account:\s*[^\]]+\]/g, '')
        .replace(/\[AccountId:\s*[^\]]+\]/g, '')
        .replace(/\[TelegramId:\s*[^\]]+\]/g, '')
        .replace(/\[Dalbaday:\s*[^\]]+\]/g, '')
        .replace(/\[ReceiptUrl:\s*[^\]]+\]/g, '')
        .trim();
}

async function sendTelegramMessage(token: string, chatId: string, text: string, receiptUrl?: string, replyMarkup?: any) {
    try {
        if (receiptUrl) {
            const absolutePath = path.join(process.cwd(), 'public', receiptUrl);
            if (fs.existsSync(absolutePath)) {
                const formData = new FormData();
                formData.append('chat_id', chatId);
                formData.append('caption', text);
                formData.append('parse_mode', 'HTML');
                if (replyMarkup) {
                    formData.append('reply_markup', JSON.stringify(replyMarkup));
                }
                const fileBuffer = fs.readFileSync(absolutePath);
                const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
                formData.append('photo', blob, 'receipt.jpg');

                const url = `https://api.telegram.org/bot${token}/sendPhoto`;
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) return;
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
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error('Error sending telegram message:', err);
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

        // Raw Material custom fields
        const vendorId = formData.get('vendorId') as string;
        const newVendorName = formData.get('newVendorName') as string;
        const materialId = formData.get('materialId') as string;
        const materialName = formData.get('materialName') as string;
        const newMaterialName = formData.get('newMaterialName') as string;
        const quantityInput = formData.get('quantity') as string;
        const unitPriceInput = formData.get('unitPrice') as string;

        // Custom expense fields
        const transportType = formData.get('transportType') as string;
        const equipmentName = formData.get('equipmentName') as string;
        const rentalPeriod = formData.get('rentalPeriod') as string;
        const consultantName = formData.get('consultantName') as string;
        const consultancyType = formData.get('consultancyType') as string;

        // Requester metadata
        const requesterName = formData.get('requesterName') as string || 'WebApp User';
        const requesterId = formData.get('requesterId') as string || '';

        const chatId = customChatId || defaultChatId;

        // 1. Handle File Upload
        let receiptUrl = '';
        if (receiptFile && receiptFile.size > 0) {
            const buffer = Buffer.from(await receiptFile.arrayBuffer());
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
            
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const cleanFileName = `${Date.now()}-${receiptFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const filePath = path.join(uploadsDir, cleanFileName);
            fs.writeFileSync(filePath, buffer);
            receiptUrl = `/uploads/receipts/${cleanFileName}`;
        }

        // Build requester tags
        const requesterTag = `[Dalbaday: ${requesterName}] [TelegramId: ${requesterId}]`;
        let finalNote = note ? `${note}\n${requesterTag}` : requesterTag;

        const isRawMaterial = type === 'RAW_MATERIAL';

        // 2. Perform database transaction
        const result = await prisma.$transaction(async (tx) => {
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account) throw new Error('Koontada la doortay lama helin.');

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
                let purchaseNotes = finalNote;
                if (receiptUrl) {
                    purchaseNotes = `${purchaseNotes}\n[ReceiptUrl: ${receiptUrl}]`;
                }

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

                await tx.employee.update({
                    where: { id: employee.id },
                    data: { salaryPaidThisMonth: { increment: amount } }
                });
            } else {
                const category = await tx.expenseCategory.findUnique({ where: { id: categoryId } });
                if (!category) throw new Error('Nooca kharashka lama helin.');

                finalCategoryName = category.name;
                if (finalCategoryName === 'Transport & Fuel' && transportType) {
                    finalDescription = `${category.name} (${transportType}): ${note}`;
                } else if (finalCategoryName === 'Equipment Rental' && equipmentName) {
                    finalDescription = `${category.name} (${equipmentName} - ${rentalPeriod || ''}): ${note}`;
                } else if (finalCategoryName === 'Consultancy & Service' && consultantName) {
                    finalDescription = `${category.name} (${consultantName} - ${consultancyType || ''}): ${note}`;
                } else {
                    finalDescription = `${category.name}: ${note}`;
                }
            }

            const isPaid = !!receiptUrl || formData.get('isPaid') === 'true';
            const expense = await tx.expense.create({
                data: {
                    companyId,
                    userId,
                    description: finalDescription,
                    amount: amount,
                    category: finalCategoryName,
                    categoryId: type === 'EXPENSE' ? categoryId : null,
                    employeeId: type === 'SALARY' ? employeeId : null,
                    accountId: accountId,
                    paidFrom: account.name,
                    approved: isPaid,
                    paymentStatus: isPaid ? 'PAID' : 'UNPAID',
                    paymentDate: isPaid ? new Date() : null,
                    receiptUrl: receiptUrl || null,
                    note: finalNote,
                    
                    // Custom fields
                    transportType: transportType || null,
                    equipmentName: equipmentName || null,
                    rentalPeriod: rentalPeriod || null,
                    consultantName: consultantName || null,
                    consultancyType: consultancyType || null
                }
            });

            let updatedBalance = account.balance;
            if (isPaid) {
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
                        receiptUrl: receiptUrl || null
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

        // 3. Send Telegram Notification
        if (token && chatId) {
            const formattedDate = new Date().toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
            let telegramText = '';
            let replyMarkup: any = null;

            if (result.isPurchase) {
                if (result.isPaid) {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Diiwaangelinta Qalabka / Raw Material (Procurement - Paid)</b>\n\n` +
                                   `🏭 Alaab-keenaha: ${result.supplierName}\n` +
                                   `📦 Name: ${result.materialName}\n` +
                                   `📊 Qty: ${result.quantity} ${result.materialUnit}\n` +
                                   `💵 Price: ${Number(result.unitPrice).toLocaleString()} ETB\n` +
                                   `💰 Total: ${Number(result.totalPrice).toLocaleString()} ETB\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                   `📅 Taariikhda: ${formattedDate}`;
                // No keyboard buttons for paid procurement
                } else {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Diiwaangelinta Qalabka / Raw Material (Procurement)</b>\n\n` +
                                   `🏭 Alaab-keenaha: ${result.supplierName}\n` +
                                   `📦 Name: ${result.materialName}\n` +
                                   `📊 Qty: ${result.quantity} ${result.materialUnit}\n` +
                                   `💵 Price: ${Number(result.unitPrice).toLocaleString()} ETB\n` +
                                   `💰 Total: ${Number(result.totalPrice).toLocaleString()} ETB\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                   `📅 Taariikhda: ${formattedDate}\n\n` +
                                   `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
                    replyMarkup = {
                        inline_keyboard: [
                            [
                                { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_mp_${result.id}` }
                            ]
                        ]
                    };
                }
            } else if (type === 'SALARY') {
                if (result.isPaid) {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Mushahar Bixin Guulaystay!</b>\n\n` +
                                   `👤 Shaqaalaha: ${result.employeeName}\n` +
                                   `💵 Lacagta: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                   `💳 Koontada: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note || 'Mushaharka bisha')}\n` +
                                   `📅 Taariikhda: ${formattedDate}`;
                // No keyboard buttons for paid salaries
                } else {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Diiwaangelinta Mushaharka (Sugaya Rasiidka)</b>\n\n` +
                                   `👤 Shaqaalaha: ${result.employeeName}\n` +
                                   `💵 Lacagta la bixiyey: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                   `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note || 'Mushaharka bisha')}\n` +
                                   `📅 Taariikhda: ${formattedDate}\n\n` +
                                   `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
                    replyMarkup = {
                        inline_keyboard: [
                            [
                                { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_${result.id}` }
                            ]
                        ]
                    };
                }
            } else {
                let customFieldsText = '';
                if (result.categoryName === 'Transport & Fuel' && transportType) {
                    customFieldsText = `🚗 Nooca Gadiidka: ${transportType}\n`;
                } else if (result.categoryName === 'Equipment Rental' && equipmentName) {
                    customFieldsText = `⚙️ Qalabka: ${equipmentName}\n📅 Muddada Kirada: ${rentalPeriod || ''}\n`;
                } else if (result.categoryName === 'Consultancy & Service' && consultantName) {
                    customFieldsText = `👤 La-taliyaha: ${consultantName}\n📋 Adeegga: ${consultancyType || ''}\n`;
                }

                if (result.isPaid) {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Diiwaangelinta Kharashka Guulaystay!</b>\n\n` +
                                   `📂 Qaybta: ${result.categoryName}\n` +
                                   `💵 Lacagta: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                   customFieldsText +
                                   `💳 Koontada: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                   `📅 Taariikhda: ${formattedDate}`;
                // No keyboard buttons for paid expenses
                } else {
                    telegramText = `<b>AN-Industory</b>\n` +
                                   `<b>✅ Diiwaangelinta Kharashka (Sugaya Rasiidka)</b>\n\n` +
                                   `📂 Qaybta: ${result.categoryName}\n` +
                                   `💵 Lacagta la bixiyey: ${parseFloat(amountInput).toLocaleString()} ETB\n` +
                                   customFieldsText +
                                   `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                                   `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                                   `📅 Taariikhda: ${formattedDate}\n\n` +
                                   `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
                    replyMarkup = {
                        inline_keyboard: [
                            [
                                { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_${result.id}` }
                            ]
                        ]
                    };
                }
            }

            await sendTelegramMessage(token, chatId, telegramText, receiptUrl || undefined, replyMarkup);
        }

        return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
        console.error('Error submitting Telegram transaction:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
