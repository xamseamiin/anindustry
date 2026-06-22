const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const companyId = process.env.TELEGRAM_COMPANY_ID;
const creatorUserId = process.env.TELEGRAM_USER_ID;

if (!token) {
    console.error("❌ ERROR: TELEGRAM_BOT_TOKEN is not defined in .env file.");
    process.exit(1);
}

if (!companyId || !creatorUserId) {
    console.error("❌ ERROR: TELEGRAM_COMPANY_ID or TELEGRAM_USER_ID is not configured in .env.");
    process.exit(1);
}

const prisma = new PrismaClient();

let botUsername = 'AN_Industory_bot';

function getRequesterName(from) {
    if (!from) return 'Telegram User';
    const firstName = from.first_name || '';
    const lastName = from.last_name || '';
    const username = from.username ? `@${from.username}` : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    return username ? `${fullName} (${username})` : fullName;
}

function cleanNoteForTelegram(rawNote) {
    if (!rawNote) return '';
    return rawNote
        .replace(/\[TelegramId:\s*[^\]]*\]/g, '')
        .replace(/\[TelegramChatId:\s*[^\]]*\]/g, '')
        .replace(/\[TelegramMessageId:\s*[^\]]*\]/g, '')
        .replace(/\[AccountId:\s*[^\]]*\]/g, '')
        .replace(/\[Account:\s*[^\]]*\]/g, '')
        .replace(/\[Dalbaday:\s*[^\]]*\]/g, '')
        .replace(/\[ReceiptUrl:\s*[^\]]*\]/g, '')
        .trim();
}

async function verifyRequesterPermission(query, recordId, isPurchase = false) {
    try {
        let note = '';
        if (isPurchase) {
            const mp = await prisma.materialPurchase.findUnique({ where: { id: recordId } });
            note = mp ? mp.notes : '';
        } else {
            const exp = await prisma.expense.findUnique({ where: { id: recordId } });
            note = exp ? exp.note : '';
        }

        if (note) {
            const match = note.match(/\[TelegramId:\s*(\d+)\]/);
            if (match) {
                const creatorTelegramId = match[1];
                if (String(query.from.id) !== String(creatorTelegramId)) {
                    await sendBotRequest('answerCallbackQuery', {
                        callback_query_id: query.id,
                        text: "⚠️ Kaliya qofkii soo diray diiwaankan ayaa beddeli kara ama tirtiri kara!",
                        show_alert: true
                    });
                    return false;
                }
            }
        }
        return true;
    } catch (err) {
        console.error("Error in verifyRequesterPermission:", err);
        return true;
    }
}

console.log("🚀 Starting Conversational Telegram Bot...");
console.log(`📡 Polling active on Telegram Bot API (100% Native Mode)...`);

let offset = 0;
const userStates = {}; // In-memory session store: { "chatId_userId": { messageId: null, step: '...', data: {} } }

async function sendBotRequest(method, payload) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res && !res.ok) {
            console.error(`Telegram API Error (${method}):`, JSON.stringify(res));
        }
        return res;
    } catch (e) {
        console.error(`Error in sendBotRequest (${method}):`, e.message);
        return null;
    }
}

// Fetch bot details dynamically on start
sendBotRequest('getMe', {}).then(res => {
    if (res && res.ok) {
        botUsername = res.result.username;
        console.log(`🤖 Bot loaded: @${botUsername}`);
    }
});

// Configure bot's Menu Button globally to open the Web App
if (process.env.TELEGRAM_WEBAPP_URL) {
    sendBotRequest('setChatMenuButton', {
        menu_button: {
            type: 'web_app',
            text: 'an industry',
            web_app: {
                url: process.env.TELEGRAM_WEBAPP_URL
            }
        }
    }).then(res => {
        console.log("📱 WebApp menu button configured:", res);
    });
}

async function downloadTelegramFile(filePath, saveFileName) {
    try {
        const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to download file from Telegram');
        
        const buffer = Buffer.from(await res.arrayBuffer());
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
        
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const targetPath = path.join(uploadsDir, saveFileName);
        fs.writeFileSync(targetPath, buffer);
        return `/uploads/receipts/${saveFileName}`;
    } catch (err) {
        console.error('Error downloading receipt file:', err);
        return null;
    }
}

// Helper to edit the active wizard message or send a new one
async function editOrSendMessage(chatId, state, text, replyMarkup = null) {
    if (state && state.messageId) {
        const hasPhoto = state.hasPhoto;
        if (hasPhoto) {
            const res = await sendBotRequest('editMessageCaption', {
                chat_id: chatId,
                message_id: state.messageId,
                caption: text,
                parse_mode: 'HTML',
                reply_markup: replyMarkup || undefined
            });
            if (res && res.ok) return res;
        } else {
            const res = await sendBotRequest('editMessageText', {
                chat_id: chatId,
                message_id: state.messageId,
                text: text,
                parse_mode: 'HTML',
                reply_markup: replyMarkup || undefined
            });
            if (res && res.ok) return res;
        }
        
        // If first try failed (e.g. photo flag mismatch), try the other method
        const fallbackMethod = hasPhoto ? 'editMessageText' : 'editMessageCaption';
        const fallbackPayload = {
            chat_id: chatId,
            message_id: state.messageId,
            parse_mode: 'HTML',
            reply_markup: replyMarkup || undefined
        };
        if (hasPhoto) {
            fallbackPayload.text = text;
        } else {
            fallbackPayload.caption = text;
        }
        
        const fallbackRes = await sendBotRequest(fallbackMethod, fallbackPayload);
        if (fallbackRes && fallbackRes.ok) {
            state.hasPhoto = !hasPhoto; // Toggle the flag
            return fallbackRes;
        }
    }
    
    // Fallback or Initial Message
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup || undefined
    };
    const res = await sendBotRequest('sendMessage', payload);
    if (res && res.ok && state) {
        state.messageId = res.result.message_id;
        state.hasPhoto = false;
    }
    return res;
}

async function pollUpdates() {
    let delay = 10;
    try {
        const data = await sendBotRequest('getUpdates', { offset, timeout: 30 });
        if (data && data.ok && data.result.length > 0) {
            for (const update of data.result) {
                offset = update.update_id + 1;
                await handleUpdate(update);
            }
        }
    } catch (e) {
        console.error('Error during polling:', e.message);
        delay = 2000;
    }
    setTimeout(pollUpdates, delay);
}

async function handleUpdate(update) {
    // 1. Handle Callback Queries (Button Clicks)
    if (update.callback_query) {
        const query = update.callback_query;
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;

        // 1.1 Handle Dashboard/Menu Button Clicks (Public)
        if (data.startsWith('menu_')) {
            sendBotRequest('answerCallbackQuery', { callback_query_id: query.id });

            let categories = await prisma.expenseCategory.findMany({
                where: { companyId },
                orderBy: { name: 'asc' }
            });

            if (data === 'menu_expense') {
                const inlineKeyboard = [
                    [{ text: "👤 Bixinta Mushaharka (Salary)", callback_data: "cat_salary" }]
                ];
                categories.forEach(c => {
                    inlineKeyboard.push([{ text: `📂 ${c.name}`, callback_data: `cat_${c.id}` }]);
                });

                const newMsg = await sendBotRequest('sendMessage', {
                    chat_id: chatId,
                    text: `<b>Diiwaangelinta Kharashka / Mushaharka [Wada: ${query.from.first_name || 'User'}]:</b>\n\nDooro qaybta ku habboon badhamada hoose:`,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: inlineKeyboard }
                });

                if (newMsg && newMsg.ok) {
                    const stateKey = `${chatId}_${userId}`;
                    userStates[stateKey] = {
                        messageId: newMsg.result.message_id,
                        step: 'WAIT_CATEGORY',
                        ownerId: userId,
                        ownerName: query.from.first_name || 'User',
                        data: {}
                    };
                }
            } else if (data === 'menu_raw_material') {
                const rawMatCat = categories.find(c => c.name === 'Raw Material');
                if (!rawMatCat) {
                    await sendBotRequest('sendMessage', {
                        chat_id: chatId,
                        text: "❌ Qaybta 'Raw Material' laguma helin database-ka. Fadlan marka hore ku dar system-ka."
                    });
                    return;
                }

                const vendors = await prisma.shopVendor.findMany({
                    where: { companyId },
                    orderBy: { name: 'asc' }
                });

                const inlineKeyboard = [
                    [{ text: "➕ Kordhi Supplier Cusub (Add Supplier)", callback_data: "vendor_add" }]
                ];
                vendors.forEach(v => {
                    inlineKeyboard.push([{ text: `🏭 ${v.name}`, callback_data: `vendor_${v.id}` }]);
                });

                const newMsg = await sendBotRequest('sendMessage', {
                    chat_id: chatId,
                    text: `<b>Dalabka Raw Material [Wada: ${query.from.first_name || 'User'}]:</b>\n\n🏭 <b>Dooro Supplier-ka/Alaab-keenaha kharashkan la siinayo:</b>`,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: inlineKeyboard }
                });

                if (newMsg && newMsg.ok) {
                    const stateKey = `${chatId}_${userId}`;
                    userStates[stateKey] = {
                        messageId: newMsg.result.message_id,
                        step: 'WAIT_SUPPLIER_SELECT',
                        ownerId: userId,
                        ownerName: query.from.first_name || 'User',
                        data: {
                            type: 'EXPENSE',
                            categoryId: rawMatCat.id,
                            categoryName: rawMatCat.name
                        }
                    };
                }
            } else if (data === 'menu_salary') {
                const employees = await prisma.employee.findMany({
                    where: { companyId, isActive: true },
                    orderBy: { fullName: 'asc' }
                });

                const inlineKeyboard = [
                    [{ text: "➕ Kordhi Shaqaale Cusub (Add Employee)", callback_data: "emp_add" }]
                ];
                employees.forEach(e => {
                    inlineKeyboard.push([{ text: `${e.fullName} (${e.role})`, callback_data: `emp_${e.id}` }]);
                });

                const newMsg = await sendBotRequest('sendMessage', {
                    chat_id: chatId,
                    text: `<b>Bixinta Mushaharka [Wada: ${query.from.first_name || 'User'}]:</b>\n\n👤 <b>Dooro Shaqaalaha Mushaharka la siinayo:</b>`,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: inlineKeyboard }
                });

                if (newMsg && newMsg.ok) {
                    const stateKey = `${chatId}_${userId}`;
                    userStates[stateKey] = {
                        messageId: newMsg.result.message_id,
                        step: 'WAIT_EMPLOYEE',
                        ownerId: userId,
                        ownerName: query.from.first_name || 'User',
                        data: {
                            type: 'SALARY'
                        }
                    };
                }
            }
            return;
        }

        // Identify if this is a wizard callback
        const wizardPrefixes = ['cat_', 'emp_', 'vendor_', 'mat_', 'acc_', 'tr_', 'wizard_cancel'];
        const isWizardAction = wizardPrefixes.some(prefix => data.startsWith(prefix)) || data === 'emp_add' || data === 'vendor_add' || data === 'mat_add';

        let state = null;
        let stateKey = null;

        if (isWizardAction) {
            // Find the active state associated with this specific message
            for (const key in userStates) {
                if (userStates[key] && userStates[key].messageId === query.message.message_id) {
                    state = userStates[key];
                    stateKey = key;
                    break;
                }
            }

            if (state) {
                // Verify owner
                if (query.from.id !== state.ownerId) {
                    await sendBotRequest('answerCallbackQuery', {
                        callback_query_id: query.id,
                        text: `⚠️ Foomkan waxaa bilaabay ${state.ownerName || 'User'}. Kaliya isaga ayaa isticmaali kara!`,
                        show_alert: true
                    });
                    return;
                }
            } else {
                // No state found for this wizard message - session expired!
                await sendBotRequest('answerCallbackQuery', {
                    callback_query_id: query.id,
                    text: "⚠️ Session-ka foomkan waa dhamaaday. Fadlan ku qor /expense mar kale si aad u bilowdo.",
                    show_alert: true
                });
                // Delete orphaned message to keep chat clean
                sendBotRequest('deleteMessage', { chat_id: chatId, message_id: query.message.message_id });
                return;
            }
        } else {
            // Non-wizard actions like edit_, del_, rcpt_, cancel_rcpt_
            stateKey = `${chatId}_${userId}`;
            state = userStates[stateKey];
            
            // Check permissions for finished receipts
            if (data.startsWith('edit_') || data.startsWith('del_') || data.startsWith('rcpt_') || data.startsWith('cancel_rcpt_')) {
                let recordId = '';
                let isPurchase = false;
                if (data.startsWith('edit_mp_')) { recordId = data.substring(8); isPurchase = true; }
                else if (data.startsWith('edit_')) recordId = data.substring(5);
                else if (data.startsWith('del_mp_')) { recordId = data.substring(7); isPurchase = true; }
                else if (data.startsWith('del_')) recordId = data.substring(4);
                else if (data.startsWith('rcpt_mp_')) { recordId = data.substring(8); isPurchase = true; }
                else if (data.startsWith('rcpt_')) recordId = data.substring(5);
                else if (data.startsWith('cancel_rcpt_mp_')) { recordId = data.substring(15); isPurchase = true; }
                else if (data.startsWith('cancel_rcpt_')) recordId = data.substring(12);

                const hasPermission = await verifyRequesterPermission(query, recordId, isPurchase);
                if (!hasPermission) return;
            }
        }

        // Answer callback query to prevent button loading spinner (non-blocking for sonic speed)
        sendBotRequest('answerCallbackQuery', { callback_query_id: query.id });

        if (data.startsWith('cat_')) {
            const categoryType = data.substring(4); // 'salary' or categoryId

            if (!state) {
                stateKey = `${chatId}_${userId}`;
                userStates[stateKey] = {
                    messageId: query.message.message_id,
                    step: 'WAIT_CATEGORY',
                    ownerId: userId,
                    ownerName: query.from.first_name || 'User',
                    data: {}
                };
                state = userStates[stateKey];
            }

            const currentState = userStates[stateKey];

            if (categoryType === 'salary') {
                currentState.step = 'WAIT_EMPLOYEE';
                currentState.data.type = 'SALARY';
                
                // Fetch active employees
                const employees = await prisma.employee.findMany({
                    where: { companyId, isActive: true },
                    orderBy: { fullName: 'asc' }
                });

                // Always allow creating a new employee
                const inlineKeyboard = [
                    [{ text: "➕ Kordhi Shaqaale Cusub (Add Employee)", callback_data: "emp_add" }]
                ];

                employees.forEach(e => {
                    inlineKeyboard.push([{ text: `${e.fullName} (${e.role})`, callback_data: `emp_${e.id}` }]);
                });

                await editOrSendMessage(chatId, currentState, "👤 <b>Dooro Shaqaalaha Mushaharka la siinayo:</b>", { inline_keyboard: inlineKeyboard });
            } else {
                const category = await prisma.expenseCategory.findUnique({ where: { id: categoryType } });
                currentState.data.type = 'EXPENSE';
                currentState.data.categoryId = category.id;
                currentState.data.categoryName = category.name;

                if (category.name === 'Raw Material') {
                    currentState.step = 'WAIT_SUPPLIER_SELECT';
                    
                    const vendors = await prisma.shopVendor.findMany({
                        where: { companyId },
                        orderBy: { name: 'asc' }
                    });

                    const inlineKeyboard = [
                        [{ text: "➕ Kordhi Supplier Cusub (Add Supplier)", callback_data: "vendor_add" }]
                    ];

                    vendors.forEach(v => {
                        inlineKeyboard.push([{ text: `🏭 ${v.name}`, callback_data: `vendor_${v.id}` }]);
                    });

                    await editOrSendMessage(chatId, currentState, 
                        `📂 <b>Raw Material (Dalabka Agabka)</b>\n\n` +
                        `🏭 <b>Dooro Supplier-ka/Alaab-keenaha kharashkan la siinayo:</b>`, 
                        { inline_keyboard: inlineKeyboard }
                    );
                } else {
                    currentState.step = 'WAIT_AMOUNT';
                    await editOrSendMessage(chatId, currentState, `📂 <b>Qaybta:</b> ${category.name}\n\n✍️ <b>Fadlan qor lacagta kharashka (ETB):</b>`);
                }
            }
        } else if (data === 'emp_add') {
            if (state && state.step === 'WAIT_EMPLOYEE') {
                state.step = 'WAIT_NEW_EMPLOYEE_NAME';
                await editOrSendMessage(chatId, state, "✍️ <b>Fadlan qor Magaca Shaqaalaha Cusub:</b>");
            }
        } else if (data.startsWith('emp_')) {
            if (state && state.step === 'WAIT_EMPLOYEE') {
                const employeeId = data.substring(4);
                const employee = await prisma.employee.findUnique({ where: { id: employeeId } });

                state.step = 'WAIT_AMOUNT';
                state.data.employeeId = employee.id;
                state.data.employeeName = employee.fullName;

                const dueSalary = Math.max(0, Number(employee.monthlySalary || 0) - Number(employee.salaryPaidThisMonth || 0));

                const infoText = `👤 <b>Shaqaalaha:</b> ${employee.fullName}\n` +
                                 `💼 <b>Booska:</b> ${employee.role}\n` +
                                 `💵 <b>Mushaarka:</b> ${Number(employee.monthlySalary).toLocaleString()} ETB\n` +
                                 `💸 <b>Inta la siiyay:</b> ${Number(employee.salaryPaidThisMonth).toLocaleString()} ETB\n` +
                                 `⚖️ <b>Deyn u dhiman:</b> ${dueSalary.toLocaleString()} ETB\n\n` +
                                 `✍️ <b>Fadlan qor lacagta bixinta (ETB):</b>`;

                await editOrSendMessage(chatId, state, infoText);
            }
        } else if (data === 'vendor_add') {
            if (state && state.step === 'WAIT_SUPPLIER_SELECT') {
                state.step = 'WAIT_NEW_SUPPLIER_NAME';
                await editOrSendMessage(chatId, state, "✍️ <b>Fadlan qor Magaca Supplier-ka/Alaab-keenaha Cusub (Supplier Name):</b>");
            }
        } else if (data.startsWith('vendor_')) {
            if (state && state.step === 'WAIT_SUPPLIER_SELECT') {
                const vendorId = data.substring(7);
                const vendor = await prisma.shopVendor.findUnique({ where: { id: vendorId } });

                state.step = 'WAIT_MATERIAL_SELECT';
                state.data.vendorId = vendor.id;
                state.data.supplierName = vendor.name;

                const materials = await prisma.factoryMaterial.findMany({
                    where: { companyId },
                    orderBy: { name: 'asc' }
                });

                const inlineKeyboard = [
                    [{ text: "➕ Kordhi Agab Cusub (Add Material)", callback_data: "mat_add" }]
                ];

                materials.forEach(m => {
                    inlineKeyboard.push([{ text: `📦 ${m.name}`, callback_data: `mat_${m.id}` }]);
                });

                await editOrSendMessage(chatId, state, 
                    `📂 <b>Raw Material (Dalabka Agabka)</b>\n` +
                    `🏭 <b>Alaab-keenaha:</b> ${vendor.name}\n\n` +
                    `📦 <b>Dooro Agabka Cayriin ama Kordhi mid cusub:</b>`,
                    { inline_keyboard: inlineKeyboard }
                );
            }
        } else if (data === 'mat_add') {
            if (state && state.step === 'WAIT_MATERIAL_SELECT') {
                state.step = 'WAIT_NEW_MATERIAL_NAME';
                await editOrSendMessage(chatId, state, "✍️ <b>Fadlan qor Magaca Agabka Cayriin ee Cusub (Material Name):</b>");
            }
        } else if (data.startsWith('mat_')) {
            if (state && state.step === 'WAIT_MATERIAL_SELECT') {
                const materialId = data.substring(4);
                const material = await prisma.factoryMaterial.findUnique({ where: { id: materialId } });

                state.step = 'WAIT_MATERIAL_QTY';
                state.data.materialId = material.id;
                state.data.materialName = material.name;
                state.data.materialUnit = material.unit;

                await editOrSendMessage(chatId, state, 
                    `📂 <b>Raw Material (Dalabka Agabka)</b>\n` +
                    `🏭 <b>Alaab-keenaha:</b> ${state.data.supplierName}\n` +
                    `📦 <b>Name:</b> ${material.name}\n\n` +
                    `✍️ <b>Fadlan qor Tirada (Quantity, e.g. 50):</b>`
                );
            }
        } else if (data.startsWith('acc_')) {
            if (state && state.step === 'WAIT_ACCOUNT') {
                const accountId = data.substring(4);
                state.data.accountId = accountId;

                await processTransaction(chatId, stateKey, state.data);
            }
        } else if (data.startsWith('del_mp_')) {
            const purchaseId = data.substring(7);
            delete userStates[stateKey];

            try {
                // Fetch the purchase to adjust inventory back
                const mp = await prisma.materialPurchase.findUnique({ where: { id: purchaseId } });
                if (mp) {
                    const material = await prisma.factoryMaterial.findFirst({
                        where: { name: mp.materialName, companyId }
                    });
                    if (material) {
                        await prisma.factoryMaterial.update({
                            where: { id: material.id },
                            data: { inStock: { decrement: mp.quantity } }
                        });
                    }
                }

                await prisma.materialPurchase.delete({ where: { id: purchaseId } });

                sendBotRequest('answerCallbackQuery', { 
                    callback_query_id: query.id,
                    text: "❌ Dalabkii waa la tirtiray!"
                });

                sendBotRequest('deleteMessage', { 
                    chat_id: chatId, 
                    message_id: query.message.message_id 
                });
            } catch (err) {
                console.error("Error deleting purchase:", err);
            }
        } else if (data.startsWith('del_')) {
            const expenseId = data.substring(4);
            delete userStates[stateKey];

            try {
                // Delete Expense from database
                await prisma.expense.delete({ where: { id: expenseId } });

                sendBotRequest('answerCallbackQuery', { 
                    callback_query_id: query.id,
                    text: "❌ Diiwaangelintii waa la tirtiray!"
                });

                sendBotRequest('deleteMessage', { 
                    chat_id: chatId, 
                    message_id: query.message.message_id 
                });
            } catch (err) {
                console.error("Error deleting expense:", err);
            }
        } else if (data.startsWith('edit_mp_')) {
            const purchaseId = data.substring(8);
            const mp = await prisma.materialPurchase.findUnique({
                where: { id: purchaseId },
                include: { vendor: true }
            });

            if (mp) {
                userStates[stateKey] = {
                    messageId: query.message.message_id,
                    step: 'WAIT_MATERIAL_QTY',
                    ownerId: userId,
                    ownerName: query.from.first_name || 'User',
                    data: {
                        editingPurchaseId: mp.id,
                        type: 'EXPENSE',
                        categoryName: 'Raw Material',
                        vendorId: mp.vendorId,
                        supplierName: mp.vendor.name,
                        materialName: mp.materialName,
                        materialUnit: mp.unit
                    }
                };

                await editOrSendMessage(chatId, userStates[stateKey], 
                    `✏️ <b>Wax ka beddel Dalabka Agabka:</b>\n\n` +
                    `Name: ${mp.materialName}\n` +
                    `Qty-ga hore: ${mp.quantity} ${mp.unit} (Total-kii hore: ${Number(mp.totalPrice).toLocaleString()} ETB)\n\n` +
                    `✍️ <b>Fadlan qor Tirada Cusub (Quantity):</b>`
                );
            }
        } else if (data.startsWith('edit_')) {
            const expenseId = data.substring(5);
            const exp = await prisma.expense.findUnique({
                where: { id: expenseId },
                include: { employee: true }
            });

            if (exp) {
                userStates[stateKey] = {
                    messageId: query.message.message_id,
                    step: 'WAIT_AMOUNT',
                    ownerId: userId,
                    ownerName: query.from.first_name || 'User',
                    data: {
                        editingExpenseId: exp.id,
                        type: exp.employeeId ? 'SALARY' : 'EXPENSE',
                        employeeId: exp.employeeId,
                        employeeName: exp.employee ? exp.employee.fullName : undefined,
                        categoryId: exp.categoryId,
                        categoryName: exp.category,
                        vendorId: exp.vendorId || undefined,
                        supplierName: exp.supplierName || undefined
                    }
                };

                await editOrSendMessage(chatId, userStates[stateKey], 
                    `✏️ <b>Wax ka beddel Kharashka:</b>\n\n` +
                    `Qaybta: ${exp.category}\n` +
                    `Lacagtii hore: ${Number(exp.amount).toLocaleString()} ETB\n\n` +
                    `✍️ <b>Fadlan qor lacagta cusub (ETB):</b>`
                );
            }
        } else if (data.startsWith('tr_')) {
            if (state && state.step === 'WAIT_TRANSPORT_TYPE') {
                const trTypeMap = {
                    'tr_fuel': 'Shidaal (Fuel)',
                    'tr_rental': 'Kirada Gaariga (Car Rental)',
                    'tr_taxi': 'Taxi (Bajaaj / Taxi)',
                    'tr_maint': 'Dayactirka Baabuurka (Vehicle Maint.)',
                    'tr_other': 'General Transport'
                };
                state.data.transportType = trTypeMap[data] || 'Other';
                state.step = 'WAIT_NOTE';
                
                await editOrSendMessage(chatId, state, 
                    `📂 <b>Transport & Fuel</b>\n` +
                    `💵 <b>Lacagta:</b> ${state.data.amount.toLocaleString()} ETB\n` +
                    `🚗 <b>Nooca:</b> ${state.data.transportType}\n\n` +
                    `✍️ <b>Fadlan qor sharaxaad kooban oo ku saabsan kharashkan (Note) - Waa qasab:</b>`
                );
            }
        } else if (data.startsWith('rcpt_mp_')) {
            const purchaseId = data.substring(8);
            userStates[stateKey] = {
                messageId: query.message.message_id,
                step: 'WAIT_CASHIER_RECEIPT',
                ownerId: userId,
                ownerName: query.from.first_name || 'User',
                data: { purchaseId }
            };
            await editOrSendMessage(chatId, userStates[stateKey], 
                `📸 <b>Diiwaangelinta:</b> Diiwaangeli Rasiidka (Raw Material)\n\n` +
                `<b>Fadlan hadda u soo dir sawirka rasiidka (Photo) chat-kan si loogu daro diiwaankan.</b>`,
                {
                    inline_keyboard: [
                        [{ text: "❌ Kansal (Cancel)", callback_data: `cancel_rcpt_mp_${purchaseId}` }]
                    ]
                }
            );
        } else if (data.startsWith('rcpt_')) {
            const expenseId = data.substring(5);
            userStates[stateKey] = {
                messageId: query.message.message_id,
                step: 'WAIT_CASHIER_RECEIPT',
                ownerId: userId,
                ownerName: query.from.first_name || 'User',
                data: { expenseId }
            };
            await editOrSendMessage(chatId, userStates[stateKey], 
                `📸 <b>Diiwaangelinta:</b> Diiwaangeli Rasiidka\n\n` +
                `<b>Fadlan hadda u soo dir sawirka rasiidka (Photo) chat-kan si loogu daro diiwaankan.</b>`,
                {
                    inline_keyboard: [
                        [{ text: "❌ Kansal (Cancel)", callback_data: `cancel_rcpt_${expenseId}` }]
                    ]
                }
            );
        } else if (data.startsWith('cancel_rcpt_mp_')) {
            const purchaseId = data.substring(15);
            delete userStates[stateKey];

            const mp = await prisma.materialPurchase.findUnique({
                where: { id: purchaseId },
                include: { vendor: true }
            });

            if (mp) {
                const formattedDate = new Date(mp.purchaseDate || mp.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
                
                const restoreText = `<b>AN-Industory</b>\n` +
                              `<b>✅ Diiwaangelinta Qalabka / Raw Material (Procurement)</b>\n\n` +
                              `🏭 Alaab-keenaha: ${mp.vendor.name}\n` +
                              `📦 Name: ${mp.materialName}\n` +
                              `📊 Qty: ${mp.quantity} ${mp.unit}\n` +
                              `💵 Price: ${Number(mp.unitPrice).toLocaleString()} ETB\n` +
                              `💰 Total: ${Number(mp.totalPrice).toLocaleString()} ETB\n` +
                              `📝 Sharaxaad: ${cleanNoteForTelegram(mp.notes || '')}\n` +
                              `📅 Taariikhda: ${formattedDate}\n\n` +
                              `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;

                const isPhoto = !!(query.message && query.message.photo);
                const method = isPhoto ? 'editMessageCaption' : 'editMessageText';
                const payload = {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_mp_${purchaseId}` }
                            ]
                        ]
                    }
                };
                if (isPhoto) {
                    payload.caption = restoreText;
                } else {
                    payload.text = restoreText;
                }
                await sendBotRequest(method, payload);
            }
        } else if (data.startsWith('cancel_rcpt_')) {
            const expenseId = data.substring(12);
            delete userStates[stateKey];

            const exp = await prisma.expense.findUnique({
                where: { id: expenseId },
                include: { employee: true, account: true }
            });

            if (exp) {
                const formattedDate = new Date(exp.paymentDate || exp.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
                let restoreText = '';
                
                if (exp.employeeId) {
                    restoreText = `<b>AN-Industory</b>\n` +
                                  `<b>✅ Diiwaangelinta Mushaharka (Sugaya Rasiidka)</b>\n\n` +
                                  `👤 Shaqaalaha: ${exp.employee.fullName}\n` +
                                  `💵 Lacagta la bixiyey: ${Number(exp.amount).toLocaleString()} ETB\n` +
                                  `💳 Koontada la doortay: ${exp.paidFrom} (Haraa: ${Number(exp.account.balance).toLocaleString()} ETB)\n` +
                                  `📝 Sharaxaad: ${cleanNoteForTelegram(exp.note || 'Mushaharka bisha')}\n` +
                                  `📅 Taariikhda: ${formattedDate}\n\n` +
                                  `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
                } else {
                    let customFieldsText = '';
                    if (exp.category === 'Transport & Fuel' && exp.transportType) {
                        customFieldsText = `🚗 Nooca Gadiidka: ${exp.transportType}\n`;
                    } else if (exp.category === 'Equipment Rental' && exp.equipmentName) {
                        customFieldsText = `⚙️ Qalabka: ${exp.equipmentName}\n📅 Muddada Kirada: ${exp.rentalPeriod || ''}\n`;
                    } else if (exp.category === 'Consultancy & Service' && exp.consultantName) {
                        customFieldsText = `👤 La-taliyaha: ${exp.consultantName}\n📋 Adeegga: ${exp.consultancyType || ''}\n`;
                    } else if (exp.category === 'Raw Material' && exp.supplierName) {
                        let matName = '';
                        if (exp.materials && typeof exp.materials === 'object') {
                            matName = exp.materials.materialName || '';
                        }
                        customFieldsText = `🏭 Alaab-keenaha: ${exp.supplierName}\n📦 Name: ${matName}\n`;
                    }

                    restoreText = `<b>AN-Industory</b>\n` +
                                  `<b>✅ Diiwaangelinta Kharashka (Sugaya Rasiidka)</b>\n\n` +
                                  `📂 Qaybta: ${exp.category}\n` +
                                  `💵 Lacagta la bixiyey: ${Number(exp.amount).toLocaleString()} ETB\n` +
                                  customFieldsText +
                                  `💳 Koontada la doortay: ${exp.paidFrom} (Haraa: ${Number(exp.account.balance).toLocaleString()} ETB)\n` +
                                  `📝 Sharaxaad: ${cleanNoteForTelegram(exp.note || '')}\n` +
                                  `📅 Taariikhda: ${formattedDate}\n\n` +
                                  `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
                }

                const isPhoto = !!(query.message && query.message.photo);
                const method = isPhoto ? 'editMessageCaption' : 'editMessageText';
                const payload = {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_${expenseId}` }
                            ]
                        ]
                    }
                };
                if (isPhoto) {
                    payload.caption = restoreText;
                } else {
                    payload.text = restoreText;
                }
                await sendBotRequest(method, payload);
            }
        }
        return;
    }

    // 2. Handle Messages (Commands / Text Inputs / Photos)
    if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const user = message.from.first_name || 'User';
        let text = (message.text || '').trim();
        const stateKey = `${chatId}_${userId}`;
        const state = userStates[stateKey];

        console.log(`Incoming message: "${text}" from ${user} (ID: ${userId}) in chat ${chatId} (${message.chat.type})`);

        // Strip bot username suffix if present (e.g. /app@an_industory_bot -> /app)
        if (text.startsWith('/')) {
            const parts = text.split(' ');
            const cmd = parts[0];
            if (cmd.includes('@')) {
                const [cmdName, targetBot] = cmd.split('@');
                if (targetBot.toLowerCase() === botUsername.toLowerCase()) {
                    parts[0] = cmdName;
                    text = parts.join(' ');
                }
            }
        }

        // Group suggestions logging
        if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
            if (process.env.TELEGRAM_CHAT_ID !== String(chatId)) {
                console.log(`💡 SUGGESTION: Set TELEGRAM_CHAT_ID=${chatId} in your .env file!`);
            }
        }

        // Handle Commands
        if (text.startsWith('/app') || text.startsWith('/webapp')) {
            if (process.env.TELEGRAM_WEBAPP_URL) {
                const buttons = [];
                if (message.chat.type === 'private') {
                    buttons.push({ text: "➕ Diiwaangeli Foomka", web_app: { url: process.env.TELEGRAM_WEBAPP_URL } });
                } else {
                    const shortName = process.env.TELEGRAM_WEBAPP_SHORTNAME || 'app';
                    buttons.push({ text: "➕ Fur Mini App (Telegram)", url: `https://t.me/${botUsername}/${shortName}` });
                }
                await sendBotRequest('sendMessage', {
                    chat_id: chatId,
                    text: `<b>📱 AN-Industory Mini App</b>\n\nCodsigaaga wuu dhowyahay! Guji badhanka hoose si aad u furto foomka diiwaangelinta Kharashka, Mushaharka, ama Raw Material-ka.`,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [buttons]
                    }
                });
            } else {
                await sendBotRequest('sendMessage', {
                    chat_id: chatId,
                    text: "⚠️ TELEGRAM_WEBAPP_URL looma dhisin .env file-ka."
                });
            }

            if (message.chat.type !== 'private') {
                sendBotRequest('deleteMessage', { chat_id: chatId, message_id: message.message_id });
            }
            return;
        }

        if (text.startsWith('/menu') || text.startsWith('/start') || text.startsWith('/dashboard')) {
            const inlineKeyboard = [];
            if (process.env.TELEGRAM_WEBAPP_URL) {
                if (message.chat.type === 'private') {
                    inlineKeyboard.push([{ text: "📱 Diiwaangeli App-ka (Mini App)", web_app: { url: process.env.TELEGRAM_WEBAPP_URL } }]);
                } else {
                    const shortName = process.env.TELEGRAM_WEBAPP_SHORTNAME || 'app';
                    inlineKeyboard.push([
                        { text: "📱 Fur Mini App (Telegram)", url: `https://t.me/${botUsername}/${shortName}` }
                    ]);
                }
            }
            inlineKeyboard.push(
                [{ text: "➕ Diiwaangeli Kharash / Mushahar", callback_data: "menu_expense" }],
                [{ text: "🛒 Dalabka Raw Material", callback_data: "menu_raw_material" }],
                [{ text: "👤 Bixinta Mushaharka (Salary)", callback_data: "menu_salary" }]
            );

            const menuKeyboard = {
                inline_keyboard: inlineKeyboard
            };

            await sendBotRequest('sendMessage', {
                chat_id: chatId,
                text: `<b>📊 AN-Industory Bot Menu</b>\n\n` +
                      `Guji badhamada hoose si aad u bilowdo diiwaangelinta adigoo aan waxba qorin.\n\n` +
                      `<i>💡 Talo: Waad pin-gareyn kartaa (Pin Message) farriintan si aad mar kasta si fudud ugu gujiso!</i>`,
                parse_mode: 'HTML',
                reply_markup: menuKeyboard
            });

            if (message.chat.type !== 'private') {
                sendBotRequest('deleteMessage', { chat_id: chatId, message_id: message.message_id });
            }
            return;
        }

        if (text.startsWith('/expense') || text.startsWith('/pay')) {
            // If there was an old wizard, delete it to keep it tidy (non-blocking)
            if (state && state.messageId) {
                sendBotRequest('deleteMessage', { chat_id: chatId, message_id: state.messageId });
            }

            userStates[stateKey] = {
                messageId: null,
                step: 'WAIT_CATEGORY',
                ownerId: userId,
                ownerName: user,
                data: {}
            };

            // Fetch expense categories
            const categories = await prisma.expenseCategory.findMany({
                where: { companyId },
                orderBy: { name: 'asc' }
            });

            // Create inline buttons
            const inlineKeyboard = [];
            if (process.env.TELEGRAM_WEBAPP_URL) {
                if (message.chat.type === 'private') {
                    inlineKeyboard.push([{ text: "📱 Diiwaangeli adigoo isticmaalaya App-ka", web_app: { url: process.env.TELEGRAM_WEBAPP_URL } }]);
                } else {
                    const shortName = process.env.TELEGRAM_WEBAPP_SHORTNAME || 'app';
                    inlineKeyboard.push([
                        { text: "📱 Fur Mini App (Telegram)", url: `https://t.me/${botUsername}/${shortName}` }
                    ]);
                }
            }
            inlineKeyboard.push([{ text: "👤 Bixinta Mushaharka (Salary)", callback_data: "cat_salary" }]);

            // Append categories
            categories.forEach(c => {
                inlineKeyboard.push([{ text: `📂 ${c.name}`, callback_data: `cat_${c.id}` }]);
            });

            await editOrSendMessage(chatId, userStates[stateKey], "<b>Diiwaangelinta Kharashka / Mushaharka:</b>\n\nDooro qaybta ku habboon badhamada hoose:", { inline_keyboard: inlineKeyboard });
            
            // Delete command message to keep group clean (non-blocking)
            if (message.chat.type !== 'private') {
                sendBotRequest('deleteMessage', { chat_id: chatId, message_id: message.message_id });
            }
            return;
        }

        if (text.startsWith('/cancel')) {
            if (state) {
                if (state.messageId) {
                    sendBotRequest('deleteMessage', { chat_id: chatId, message_id: state.messageId });
                }
                delete userStates[stateKey];
                
                const cancelMsg = await sendBotRequest('sendMessage', {
                    chat_id: chatId,
                    text: "❌ Diiwaangelintii waa la kansalay."
                });
                
                // Auto-delete cancel notification after 3 seconds
                setTimeout(() => {
                    sendBotRequest('deleteMessage', { chat_id: chatId, message_id: cancelMsg.result.message_id });
                }, 3000);
            }
            
            if (message.chat.type !== 'private') {
                sendBotRequest('deleteMessage', { chat_id: chatId, message_id: message.message_id });
            }
            return;
        }

        // Handle Conversational Steps
        if (state) {
            // Delete user's incoming message to keep the group chat pristine (non-blocking)
            if (message.chat.type !== 'private') {
                sendBotRequest('deleteMessage', { chat_id: chatId, message_id: message.message_id });
            }

            // STEP C: Cashier Receipt Photo Upload
            if (state.step === 'WAIT_CASHIER_RECEIPT') {
                let receiptUrl = '';
                const expenseId = state.data.expenseId;
                const purchaseId = state.data.purchaseId;

                // Check if user uploaded a photo
                if (message.photo && message.photo.length > 0) {
                    const photo = message.photo[message.photo.length - 1];
                    const fileId = photo.file_id;

                    const fileDetails = await sendBotRequest('getFile', { file_id: fileId });
                    if (fileDetails && fileDetails.ok) {
                        const filePath = fileDetails.result.file_path;
                        const extension = filePath.split('.').pop() || 'jpg';
                        const saveName = `${Date.now()}-tg-receipt.${extension}`;
                        
                        const savedPath = await downloadTelegramFile(filePath, saveName);
                        if (savedPath) {
                            receiptUrl = savedPath;
                        }
                    }
                }

                if (!receiptUrl) {
                    const errMsg = await sendBotRequest('sendMessage', {
                        chat_id: chatId,
                        text: "⚠️ Fadlan ku soo lifaaq sawirka rasiidka (Photo)."
                    });
                    setTimeout(() => {
                        sendBotRequest('deleteMessage', { chat_id: chatId, message_id: errMsg.result.message_id });
                    }, 3000);
                    return;
                }

                // Delete the prompting wizard message (non-blocking)
                if (state.messageId) {
                    sendBotRequest('deleteMessage', { chat_id: chatId, message_id: state.messageId });
                }

                // Update the database records
                if (purchaseId) {
                    const mp = await prisma.materialPurchase.findUnique({ where: { id: purchaseId } });
                    if (mp) {
                        let newNotes = mp.notes || '';
                        newNotes = newNotes.replace(/\[ReceiptUrl:\s*[^\]]+\]/g, '').trim();
                        newNotes = newNotes ? `${newNotes}\n[ReceiptUrl: ${receiptUrl}]` : `[ReceiptUrl: ${receiptUrl}]`;

                        const accountMatch = newNotes.match(/\[AccountId:\s*([^\]]+)\]/);
                        const accountId = accountMatch ? accountMatch[1] : null;

                        await prisma.$transaction(async (tx) => {
                            await tx.materialPurchase.update({
                                where: { id: purchaseId },
                                data: { 
                                    notes: newNotes,
                                    paidAmount: mp.totalPrice,
                                    paymentStatus: 'PAID'
                                }
                            });

                            if (accountId) {
                                const account = await tx.account.findUnique({ where: { id: accountId } });
                                if (account) {
                                    await tx.account.update({
                                        where: { id: accountId },
                                        data: { balance: { decrement: mp.totalPrice } }
                                    });

                                    await tx.transaction.create({
                                        data: {
                                            companyId: mp.companyId,
                                            amount: mp.totalPrice,
                                            type: 'EXPENSE',
                                            description: `Deynbixinta: ${mp.materialName} (Ref: PAY-${mp.materialName})`,
                                            note: `Deynbixinta #${mp.materialName} (Telegram Cashier Upload)`,
                                            transactionDate: new Date(),
                                            accountId: accountId,
                                            receiptUrl: receiptUrl
                                        }
                                    });
                                }
                            }
                        });
                    }
                } else {
                    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
                    if (expense) {
                        await prisma.$transaction(async (tx) => {
                            await tx.expense.update({
                                where: { id: expenseId },
                                data: { 
                                    receiptUrl,
                                    approved: true,
                                    paymentStatus: 'PAID',
                                    paymentDate: new Date()
                                }
                            });

                            await tx.transaction.create({
                                data: {
                                    companyId: expense.companyId,
                                    userId: expense.userId,
                                    description: expense.description,
                                    amount: Number(expense.amount),
                                    type: 'EXPENSE',
                                    accountId: expense.accountId,
                                    expenseId: expense.id,
                                    employeeId: expense.employeeId,
                                    receiptUrl: receiptUrl
                                }
                            });

                            if (expense.accountId) {
                                await tx.account.update({
                                    where: { id: expense.accountId },
                                    data: { balance: { decrement: Number(expense.amount) } }
                                });
                            }
                        });
                    }
                }

                // Clear the state
                delete userStates[stateKey];

                const formattedDate = new Date().toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
                let confirmationText = '';

                if (purchaseId) {
                    const mp = await prisma.materialPurchase.findUnique({
                        where: { id: purchaseId },
                        include: { vendor: true }
                    });
                    if (mp) {
                        const cleanNote = cleanNoteForTelegram(mp.notes);

                        confirmationText = `<b>AN-Industory</b>\n` +
                                           `<b>✅ Diiwaangelinta Qalabka / Raw Material (Procurement)</b>\n\n` +
                                           `🏭 Alaab-keenaha: ${mp.vendor.name}\n` +
                                           `📦 Name: ${mp.materialName}\n` +
                                           `📊 Qty: ${mp.quantity} ${mp.unit}\n` +
                                           `💵 Price: ${Number(mp.unitPrice).toLocaleString()} ETB\n` +
                                           `💰 Total: ${Number(mp.totalPrice).toLocaleString()} ETB\n` +
                                           `📝 Sharaxaad: ${cleanNote}\n` +
                                           `📅 Taariikhda: ${formattedDate}\n\n` +
                                           `✅ Lacagtaas waa la diray.`;
                    }
                } else {
                    const exp = await prisma.expense.findUnique({
                        where: { id: expenseId },
                        include: { employee: true, account: true }
                    });

                    if (exp) {
                        const cleanNote = cleanNoteForTelegram(exp.note);

                        if (exp.employeeId) {
                            confirmationText = `<b>AN-Industory</b>\n` +
                                               `<b>✅ Diiwaangelinta Mushaharka (Waala Bixiyey)</b>\n\n` +
                                               `👤 Shaqaalaha: ${exp.employee.fullName}\n` +
                                               `💵 Lacagta la bixiyey: ${Number(exp.amount).toLocaleString()} ETB\n` +
                                               `💳 Koontada la doortay: ${exp.paidFrom} (Haraa: ${Number(exp.account.balance).toLocaleString()} ETB)\n` +
                                               `📝 Sharaxaad: ${cleanNote || 'Mushaharka bisha'}\n` +
                                               `📅 Taariikhda: ${formattedDate}\n\n` +
                                               `✅ Lacagtaas waa la diray.`;
                        } else {
                            let customFieldsText = '';
                            if (exp.category === 'Transport & Fuel' && exp.transportType) {
                                customFieldsText = `🚗 Nooca Gadiidka: ${exp.transportType}\n`;
                            } else if (exp.category === 'Equipment Rental' && exp.equipmentName) {
                                customFieldsText = `⚙️ Qalabka: ${exp.equipmentName}\n📅 Muddada Kirada: ${exp.rentalPeriod || ''}\n`;
                            } else if (exp.category === 'Consultancy & Service' && exp.consultantName) {
                                customFieldsText = `👤 La-taliyaha: ${exp.consultantName}\n📋 Adeegga: ${exp.consultancyType || ''}\n`;
                            } else if (exp.category === 'Raw Material' && exp.supplierName) {
                                let matName = '';
                                if (exp.materials && typeof exp.materials === 'object') {
                                    matName = exp.materials.materialName || '';
                                }
                                customFieldsText = `🏭 Alaab-keenaha: ${exp.supplierName}\n📦 Name: ${matName}\n`;
                            }

                            confirmationText = `<b>AN-Industory</b>\n` +
                                               `<b>✅ Diiwaangelinta Kharashka (Waala Bixiyey)</b>\n\n` +
                                               `📂 Qaybta: ${exp.category}\n` +
                                               `💵 Lacagta la bixiyey: ${Number(exp.amount).toLocaleString()} ETB\n` +
                                               customFieldsText +
                                               `💳 Koontada la doortay: ${exp.paidFrom} (Haraa: ${Number(exp.account.balance).toLocaleString()} ETB)\n` +
                                               `📝 Sharaxaad: ${cleanNote}\n` +
                                               `📅 Taariikhda: ${formattedDate}\n\n` +
                                               `✅ Lacagtaas waa la diray.`;
                        }
                    }
                }

                // Send the new photo confirmation message
                const absolutePath = path.join(process.cwd(), 'public', receiptUrl);
                if (fs.existsSync(absolutePath)) {
                    const formData = new FormData();
                    formData.append('chat_id', chatId);
                    formData.append('caption', confirmationText);
                    formData.append('parse_mode', 'HTML');
                    
                    // No inline keyboard is attached here because it's PAID and finalized
                    const inlineKeyboard = [];
                    formData.append('reply_markup', JSON.stringify({ inline_keyboard: inlineKeyboard }));

                    const blob = new Blob([fs.readFileSync(absolutePath)], { type: 'image/jpeg' });
                    formData.append('photo', blob, 'receipt.jpg');

                    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                        method: 'POST',
                        body: formData
                    });
                    const resJson = await response.json();
                    if (resJson && resJson.ok) {
                        await saveTelegramMetadata(purchaseId || expenseId, !!purchaseId, chatId, resJson.result.message_id);
                    }
                } else {
                    const response = await sendBotRequest('sendMessage', {
                        chat_id: chatId,
                        text: confirmationText,
                        parse_mode: 'HTML'
                    });
                    if (response && response.ok) {
                        await saveTelegramMetadata(purchaseId || expenseId, !!purchaseId, chatId, response.result.message_id);
                    }
                }
                return;
            }

            // STEP: WAIT_TRANSPORT_TYPE
            if (state.step === 'WAIT_TRANSPORT_TYPE') {
                if (!text) return;
                state.data.transportType = text;
                state.step = 'WAIT_NOTE';
                
                await editOrSendMessage(chatId, state, 
                    `📂 <b>Transport & Fuel</b>\n` +
                    `💵 <b>Lacagta:</b> ${state.data.amount.toLocaleString()} ETB\n` +
                    `🚗 <b>Nooca:</b> ${text}\n\n` +
                    `✍️ <b>Fadlan qor sharaxaad kooban oo ku saabsan kharashkan (Note) - Waa qasab:</b>`
                );
                return;
            }

            // STEP: WAIT_EQUIPMENT_NAME
            if (state.step === 'WAIT_EQUIPMENT_NAME') {
                if (!text) return;
                state.data.equipmentName = text;
                state.step = 'WAIT_RENTAL_PERIOD';
                
                await editOrSendMessage(chatId, state, 
                    `📂 <b>Equipment Rental</b>\n` +
                    `💵 <b>Lacagta:</b> ${state.data.amount.toLocaleString()} ETB\n` +
                    `⚙️ <b>Qalabka:</b> ${text}\n\n` +
                    `✍️ <b>Fadlan qor muddada kirada (Rental Period, e.g. 1 Bil, 2 Toddobaad) - Waa qasab:</b>`
                );
                return;
            }

            // STEP: WAIT_RENTAL_PERIOD
            if (state.step === 'WAIT_RENTAL_PERIOD') {
                if (!text) return;
                state.data.rentalPeriod = text;
                state.step = 'WAIT_NOTE';
                
                await editOrSendMessage(chatId, state, 
                    `📂 <b>Equipment Rental</b>\n` +
                    `💵 <b>Lacagta:</b> ${state.data.amount.toLocaleString()} ETB\n` +
                    `⚙️ <b>Qalabka:</b> ${state.data.equipmentName}\n` +
                    `📅 <b>Muddada:</b> ${text}\n\n` +
                    `✍️ <b>Fadlan qor sharaxaad kooban oo ku saabsan kharashkan (Note) - Waa qasab:</b>`
                );
                return;
            }

            // STEP: WAIT_CONSULTANT_NAME
            if (state.step === 'WAIT_CONSANT_NAME' || state.step === 'WAIT_CONSULTANT_NAME') {
                if (!text) return;
                state.data.consultantName = text;
                state.step = 'WAIT_CONSULTANCY_TYPE';
                
                await editOrSendMessage(chatId, state, 
                    `📂 <b>Consultancy & Service</b>\n` +
                    `💵 <b>Lacagta:</b> ${state.data.amount.toLocaleString()} ETB\n` +
                    `👤 <b>La-taliyaha:</b> ${text}\n\n` +
                    `✍️ <b>Fadlan qor nooca adeegga/la-talinta (Consultancy Type) - Waa qasab:</b>`
                );
                return;
            }

            // STEP: WAIT_CONSULTANCY_TYPE
            if (state.step === 'WAIT_CONSULTANCY_TYPE') {
                if (!text) return;
                state.data.consultancyType = text;
                state.step = 'WAIT_NOTE';
                
                await editOrSendMessage(chatId, state, 
                    `📂 <b>Consultancy & Service</b>\n` +
                    `💵 <b>Lacagta:</b> ${state.data.amount.toLocaleString()} ETB\n` +
                    `👤 <b>La-taliyaha:</b> ${state.data.consultantName}\n` +
                    `📋 <b>Nooca:</b> ${text}\n\n` +
                    `✍️ <b>Fadlan qor sharaxaad kooban oo ku saabsan kharashkan (Note) - Waa qasab:</b>`
                );
                return;
            }

            // STEP: WAIT_NEW_SUPPLIER_NAME
            if (state.step === 'WAIT_NEW_SUPPLIER_NAME') {
                if (!text) return;
                
                // Create ShopVendor in database
                const newVendor = await prisma.shopVendor.create({
                    data: {
                        name: text,
                        type: 'SUPPLIER',
                        companyId: companyId
                    }
                });

                state.step = 'WAIT_MATERIAL_SELECT';
                state.data.vendorId = newVendor.id;
                state.data.supplierName = newVendor.name;

                const materials = await prisma.factoryMaterial.findMany({
                    where: { companyId },
                    orderBy: { name: 'asc' }
                });

                const inlineKeyboard = [
                    [{ text: "➕ Kordhi Agab Cusub (Add Material)", callback_data: "mat_add" }]
                ];

                materials.forEach(m => {
                    inlineKeyboard.push([{ text: `📦 ${m.name}`, callback_data: `mat_${m.id}` }]);
                });

                await editOrSendMessage(chatId, state, 
                    `📂 <b>Raw Material (Dalabka Agabka)</b>\n` +
                    `🏭 <b>Alaab-keenaha:</b> ${newVendor.name}\n\n` +
                    `📦 <b>Dooro Agabka Cayriin ama Kordhi mid cusub:</b>`,
                    { inline_keyboard: inlineKeyboard }
                );
                return;
            }

            // STEP: WAIT_NEW_MATERIAL_NAME
            if (state.step === 'WAIT_NEW_MATERIAL_NAME') {
                if (!text) return;
                state.data.materialName = text;
                state.data.materialUnit = 'pcs';
                state.step = 'WAIT_MATERIAL_QTY';
                
                await editOrSendMessage(chatId, state, 
                    `📂 <b>Raw Material (Dalabka Agabka)</b>\n` +
                    `🏭 <b>Alaab-keenaha:</b> ${state.data.supplierName}\n` +
                    `📦 <b>Name (Cusub):</b> ${text}\n\n` +
                    `✍️ <b>Fadlan qor Tirada (Quantity, e.g. 50):</b>`
                );
                return;
            }

            // STEP: WAIT_MATERIAL_QTY
            if (state.step === 'WAIT_MATERIAL_QTY') {
                const qtyVal = parseFloat(text);
                if (isNaN(qtyVal) || qtyVal <= 0) {
                    const errMsg = await sendBotRequest('sendMessage', {
                        chat_id: chatId,
                        text: "⚠️ Fadlan qor tirada oo lambar ah oo ka weyn 0 (tusaale: 50)."
                    });
                    setTimeout(() => {
                        sendBotRequest('deleteMessage', { chat_id: chatId, message_id: errMsg.result.message_id });
                    }, 3000);
                    return;
                }

                state.data.quantity = qtyVal;
                state.step = 'WAIT_MATERIAL_PRICE';

                await editOrSendMessage(chatId, state, 
                    `📂 <b>Raw Material (Dalabka Agabka)</b>\n` +
                    `🏭 <b>Alaab-keenaha:</b> ${state.data.supplierName}\n` +
                    `📦 <b>Name:</b> ${state.data.materialName}\n` +
                    `📊 <b>Qty:</b> ${qtyVal} ${state.data.materialUnit || 'pcs'}\n\n` +
                    `✍️ <b>Fadlan qor Qiimaha halkii xabbo (Unit Price in ETB, e.g. 150):</b>`
                );
                return;
            }

            // STEP: WAIT_MATERIAL_PRICE
            if (state.step === 'WAIT_MATERIAL_PRICE') {
                const priceVal = parseFloat(text);
                if (isNaN(priceVal) || priceVal <= 0) {
                    const errMsg = await sendBotRequest('sendMessage', {
                        chat_id: chatId,
                        text: "⚠️ Fadlan qor qiimaha oo lambar ah oo ka weyn 0 (tusaale: 150)."
                    });
                    setTimeout(() => {
                        sendBotRequest('deleteMessage', { chat_id: chatId, message_id: errMsg.result.message_id });
                    }, 3000);
                    return;
                }

                state.data.unitPrice = priceVal;
                state.data.amount = state.data.quantity * priceVal;
                state.step = 'WAIT_NOTE';

                await editOrSendMessage(chatId, state, 
                    `📂 <b>Raw Material (Dalabka Agabka)</b>\n` +
                    `🏭 <b>Alaab-keenaha:</b> ${state.data.supplierName}\n` +
                    `📦 <b>Name:</b> ${state.data.materialName}\n` +
                    `📊 <b>Qty:</b> ${state.data.quantity} ${state.data.materialUnit || 'pcs'}\n` +
                    `💵 <b>Price:</b> ${priceVal.toLocaleString()} ETB\n` +
                    `💰 <b>Total:</b> ${state.data.amount.toLocaleString()} ETB\n\n` +
                    `✍️ <b>Fadlan qor sharaxaad kooban oo ku saabsan kharashkan (Note) - Waa qasab:</b>`
                );
                return;
            }

            // STEP A: New Employee Registration Name
            if (state.step === 'WAIT_NEW_EMPLOYEE_NAME') {
                if (!text) return;
                state.data.newEmployeeName = text;
                state.step = 'WAIT_NEW_EMPLOYEE_ROLE';

                await editOrSendMessage(chatId, state, `👤 <b>Magaca:</b> ${text}\n\n💼 <b>Fadlan qor booska/role-ka shaqaalaha (e.g. Labor, Driver, Security):</b>`);
                return;
            }

            // STEP B: New Employee Registration Role
            if (state.step === 'WAIT_NEW_EMPLOYEE_ROLE') {
                if (!text) return;
                
                // Create Employee in Database
                const newEmp = await prisma.employee.create({
                    data: {
                        fullName: state.data.newEmployeeName,
                        role: text,
                        companyId: companyId,
                        monthlySalary: 0,
                        isActive: true
                    }
                });

                state.step = 'WAIT_AMOUNT';
                state.data.employeeId = newEmp.id;
                state.data.employeeName = newEmp.fullName;

                const infoText = `👤 <b>Shaqaalaha Cusub:</b> ${newEmp.fullName}\n` +
                                 `💼 <b>Booska:</b> ${newEmp.role}\n` +
                                 `💵 <b>Mushaarka:</b> 0 ETB (Waa cusub yahay)\n\n` +
                                 `✍️ <b>Fadlan qor lacagta bixinta (ETB):</b>`;

                await editOrSendMessage(chatId, state, infoText);
                return;
            }

            // STEP 1: Wait for Amount Input
            if (state.step === 'WAIT_AMOUNT') {
                const amountVal = parseFloat(text);
                if (isNaN(amountVal) || amountVal <= 0) {
                    // Temporarily send error, then delete it to keep chat clean
                    const errMsg = await sendBotRequest('sendMessage', {
                        chat_id: chatId,
                        text: "⚠️ Fadlan qor lambar sax ah oo ka weyn 0 (tusaale: 5000)."
                    });
                    setTimeout(() => {
                        sendBotRequest('deleteMessage', { chat_id: chatId, message_id: errMsg.result.message_id });
                    }, 3000);
                    return;
                }

                state.data.amount = amountVal;

                if (state.data.type === 'SALARY') {
                    state.step = 'WAIT_NOTE';
                    await editOrSendMessage(chatId, state, `💵 <b>Lacagta:</b> ${amountVal.toLocaleString()} ETB\n\n` +
                              `✍️ <b>Fadlan qor sharaxaad kooban oo ku saabsan mushaharkan (e.g. Mushaharka bisha June) - Waa qasab:</b>`);
                } else {
                    if (state.data.categoryName === 'Transport & Fuel') {
                        state.step = 'WAIT_TRANSPORT_TYPE';
                        const inlineKeyboard = [
                            [{ text: "⛽ Shidaal (Fuel)", callback_data: "tr_fuel" }],
                            [{ text: "🚗 Kirada Gaariga (Car Rental)", callback_data: "tr_rental" }],
                            [{ text: "🚖 Taxi (Bajaaj / Taxi)", callback_data: "tr_taxi" }],
                            [{ text: "🔧 Dayactirka Baabuurka (Vehicle Maint.)", callback_data: "tr_maint" }],
                            [{ text: "📝 Mid Kale (Other)", callback_data: "tr_other" }]
                        ];
                        await editOrSendMessage(chatId, state, `📂 <b>Transport & Fuel</b>\n💵 <b>Lacagta:</b> ${amountVal.toLocaleString()} ETB\n\n<b>Dooro nooca kharashka gaadiidka:</b>`, { inline_keyboard: inlineKeyboard });
                    } else if (state.data.categoryName === 'Equipment Rental') {
                        state.step = 'WAIT_EQUIPMENT_NAME';
                        await editOrSendMessage(chatId, state, `📂 <b>Equipment Rental</b>\n💵 <b>Lacagta:</b> ${amountVal.toLocaleString()} ETB\n\n✍️ <b>Magaca Qalabka la kireeyay (Equipment Name):</b>`);
                    } else if (state.data.categoryName === 'Consultancy & Service') {
                        state.step = 'WAIT_CONSULTANT_NAME';
                        await editOrSendMessage(chatId, state, `📂 <b>Consultancy & Service</b>\n💵 <b>Lacagta:</b> ${amountVal.toLocaleString()} ETB\n\n✍️ <b>Magaca La-taliyaha ama Shirkada (Consultant Name):</b>`);
                    } else if (state.data.categoryName === 'Raw Material') {
                        state.step = 'WAIT_SUPPLIER_SELECT';
                        
                        const vendors = await prisma.shopVendor.findMany({
                            where: { companyId },
                            orderBy: { name: 'asc' }
                        });

                        const inlineKeyboard = [
                            [{ text: "➕ Kordhi Supplier Cusub (Add Supplier)", callback_data: "vendor_add" }]
                        ];

                        vendors.forEach(v => {
                            inlineKeyboard.push([{ text: `🏭 ${v.name}`, callback_data: `vendor_${v.id}` }]);
                        });

                        await editOrSendMessage(chatId, state, 
                            `📂 <b>Raw Material</b>\n` +
                            `💵 <b>Lacagta:</b> ${amountVal.toLocaleString()} ETB\n\n` +
                            `🏭 <b>Dooro Supplier-ka/Alaab-keenaha kharashkan la siinayo:</b>`, 
                            { inline_keyboard: inlineKeyboard }
                        );
                    } else {
                        state.step = 'WAIT_NOTE';
                        await editOrSendMessage(chatId, state, `📂 <b>Qaybta:</b> ${state.data.categoryName}\n💵 <b>Lacagta:</b> ${amountVal.toLocaleString()} ETB\n\n` +
                                  `✍️ <b>Fadlan qor sharaxaad kooban oo ku saabsan kharashkan (Note) - Waa qasab:</b>`);
                    }
                }
                return;
            }

            // STEP 2: Wait for Note or Receipt Image
            if (state.step === 'WAIT_NOTE') {
                let receiptUrl = '';
                let noteText = text;

                // Check if user uploaded a photo
                if (message.photo && message.photo.length > 0) {
                    const photo = message.photo[message.photo.length - 1];
                    const fileId = photo.file_id;

                    const fileDetails = await sendBotRequest('getFile', { file_id: fileId });
                    if (fileDetails && fileDetails.ok) {
                        const filePath = fileDetails.result.file_path;
                        const extension = filePath.split('.').pop() || 'jpg';
                        const saveName = `${Date.now()}-tg-receipt.${extension}`;
                        
                        const savedPath = await downloadTelegramFile(filePath, saveName);
                        if (savedPath) {
                            receiptUrl = savedPath;
                            noteText = message.caption || '';
                        }
                    }
                }

                if (!noteText && !message.caption) {
                    const errMsg = await sendBotRequest('sendMessage', {
                        chat_id: chatId,
                        text: "⚠️ Fadlan qor sharaxaad kooban (Note/Description) - Waa qasab."
                    });
                    setTimeout(() => {
                        sendBotRequest('deleteMessage', { chat_id: chatId, message_id: errMsg.result.message_id });
                    }, 3000);
                    return;
                }

                state.step = 'WAIT_ACCOUNT';
                state.data.note = noteText || message.caption;
                state.data.receiptUrl = receiptUrl || null;

                // Fetch bank/cash accounts
                const accounts = await prisma.account.findMany({
                    where: { companyId, isActive: true },
                    orderBy: { name: 'asc' }
                });

                if (accounts.length === 0) {
                    await editOrSendMessage(chatId, state, "❌ Ma jiraan Accounts maaliyadeed oo shaqaynaya.");
                    delete userStates[stateKey];
                    return;
                }

                const inlineKeyboard = accounts.map(a => ([
                    { text: `${a.name} (${a.balance.toLocaleString()} {currency})`.replace('{currency}', a.currency), callback_data: `acc_${a.id}` }
                ]));

                await editOrSendMessage(chatId, state, `📝 <b>Sharaxaad:</b> ${cleanNoteForTelegram(state.data.note)}\n\n💳 <b>Dooro koontada lacagta laga bixinayo:</b>`, { inline_keyboard: inlineKeyboard });
                return;
            }
        }
    }
}

async function processTransaction(chatId, stateKey, data) {
    const state = userStates[stateKey];
    try {
        const { 
            type, 
            accountId, 
            amount, 
            note, 
            employeeId, 
            categoryId, 
            receiptUrl,
            transportType,
            equipmentName,
            rentalPeriod,
            consultantName,
            consultancyType,
            supplierName,
            vendorId,
            materialName,
            quantity,
            unitPrice,
            materialUnit
        } = data;

        let finalNote = note || '';
        const requesterTag = `[Dalbaday: ${state?.ownerName || 'User'}] [TelegramId: ${state?.ownerId || chatId}]`;
        if (!finalNote.includes('[TelegramId:')) {
            finalNote = finalNote ? `${finalNote}\n${requesterTag}` : requesterTag;
        }

        if (accountId && !finalNote.includes('[AccountId:')) {
            const account = await prisma.account.findUnique({ where: { id: accountId } });
            if (account) {
                finalNote = `${finalNote}\n[Account: ${account.name}] [AccountId: ${accountId}]`;
            }
        }

        // Delete the wizard message so we can post the final receipt cleanly (non-blocking)
        if (state && state.messageId) {
            sendBotRequest('deleteMessage', { chat_id: chatId, message_id: state.messageId });
        }

        const isRawMaterial = data.categoryName === 'Raw Material';

        const result = await prisma.$transaction(async (tx) => {
            if (isRawMaterial) {
                const finalMatName = materialName || 'Raw Material';
                const finalMatUnit = materialUnit || 'pcs';
                const mpQty = quantity || 1;
                const mpPrice = unitPrice || amount || 0;
                const mpTotal = amount || (mpQty * mpPrice);

                // 1. Create or update FactoryMaterial inventory
                let material = await tx.factoryMaterial.findFirst({
                    where: { name: finalMatName, companyId }
                });

                if (!material) {
                    material = await tx.factoryMaterial.create({
                        data: {
                            companyId,
                            userId: creatorUserId,
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
                    let qtyToIncrement = mpQty;
                    // If editing, find the old quantity to adjust the difference
                    if (data.editingPurchaseId) {
                        const oldMp = await tx.materialPurchase.findUnique({ where: { id: data.editingPurchaseId } });
                        if (oldMp) {
                            qtyToIncrement = mpQty - oldMp.quantity;
                        }
                    }
                    await tx.factoryMaterial.update({
                        where: { id: material.id },
                        data: {
                            inStock: { increment: qtyToIncrement },
                            purchasePrice: mpPrice
                        }
                    });
                }

                // 2. Create or update MaterialPurchase
                let purchase;
                let purchaseNotes = finalNote;
                if (receiptUrl) {
                    purchaseNotes = `${purchaseNotes}\n[ReceiptUrl: ${receiptUrl}]`;
                }

                if (data.editingPurchaseId) {
                    purchase = await tx.materialPurchase.update({
                        where: { id: data.editingPurchaseId },
                        data: {
                            materialName: finalMatName,
                            quantity: mpQty,
                            unit: finalMatUnit,
                            unitPrice: mpPrice,
                            totalPrice: mpTotal,
                            vendorId: vendorId,
                            notes: purchaseNotes
                        }
                    });
                } else {
                    purchase = await tx.materialPurchase.create({
                        data: {
                            companyId,
                            materialName: finalMatName,
                            quantity: mpQty,
                            unit: finalMatUnit,
                            unitPrice: mpPrice,
                            totalPrice: mpTotal,
                            vendorId: vendorId,
                            purchaseDate: new Date(),
                            notes: purchaseNotes,
                            paidAmount: 0,
                            paymentStatus: 'UNPAID'
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
                    supplierName
                };
            }

            // Normal Expense/Salary handling
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account) throw new Error('Koontada la doortay lama helin.');

            let finalCategoryName = '';
            let finalDescription = '';
            let employeeName = '';

            if (type === 'SALARY') {
                const employee = await tx.employee.findUnique({ where: { id: employeeId } });
                if (!employee) throw new Error('Shaqaalaha la doortay lama helin.');

                employeeName = employee.fullName;
                finalCategoryName = 'Salaries';
                finalDescription = `Mushaharka: ${employee.fullName} (${note || 'Bixinta Mushaharka'})`;

                // Increment paid salary
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

            let expense;
            if (data.editingExpenseId) {
                // Update existing record
                expense = await tx.expense.update({
                    where: { id: data.editingExpenseId },
                    data: {
                        description: finalDescription,
                        amount: amount,
                        accountId: accountId,
                        paidFrom: account.name,
                        note: finalNote || null,
                        receiptUrl: receiptUrl || null,
                        
                        // Custom fields
                        transportType: transportType || null,
                        equipmentName: equipmentName || null,
                        rentalPeriod: rentalPeriod || null,
                        consultantName: consultantName || null,
                        consultancyType: consultancyType || null,
                        supplierName: supplierName || null,
                        vendorId: vendorId || null,
                        materials: materialName ? { materialName } : null
                    }
                });
            } else {
                // Create Expense record
                expense = await tx.expense.create({
                    data: {
                        companyId,
                        userId: creatorUserId,
                        description: finalDescription,
                        amount: amount,
                        category: finalCategoryName,
                        categoryId: type === 'EXPENSE' ? categoryId : null,
                        employeeId: type === 'SALARY' ? employeeId : null,
                        accountId: accountId,
                        paidFrom: account.name,
                        approved: false,
                        paymentStatus: 'UNPAID',
                        paymentDate: null,
                        receiptUrl: receiptUrl || null,
                        note: finalNote || null,
                        
                        // Custom fields
                        transportType: transportType || null,
                        equipmentName: equipmentName || null,
                        rentalPeriod: rentalPeriod || null,
                        consultantName: consultantName || null,
                        consultancyType: consultancyType || null,
                        supplierName: supplierName || null,
                        vendorId: vendorId || null,
                        materials: materialName ? { materialName } : null
                    }
                });
            }

            return {
                id: expense.id,
                accountName: account.name,
                accountBalance: account.balance,
                employeeName,
                categoryName: finalCategoryName
            };
        });

        // Send confirmation receipt back
        const formattedDate = new Date().toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
        let confirmationText = '';

        if (result.isPurchase) {
            confirmationText = `<b>AN-Industory</b>\n` +
                               `<b>✅ Diiwaangelinta Qalabka / Raw Material (Procurement)</b>\n\n` +
                               `🏭 Alaab-keenaha: ${result.supplierName}\n` +
                               `📦 Name: ${result.materialName}\n` +
                               `📊 Qty: ${result.quantity} ${result.materialUnit}\n` +
                               `💵 Price: ${Number(result.unitPrice).toLocaleString()} ETB\n` +
                               `💰 Total: ${Number(result.totalPrice).toLocaleString()} ETB\n` +
                               `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                               `📅 Taariikhda: ${formattedDate}\n\n` +
                               `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
        } else if (type === 'SALARY') {
            confirmationText = `<b>AN-Industory</b>\n` +
                               `<b>✅ Diiwaangelinta Mushaharka (Sugaya Rasiidka)</b>\n\n` +
                               `👤 Shaqaalaha: ${result.employeeName}\n` +
                               `💵 Lacagta la bixiyey: ${amount.toLocaleString()} ETB\n` +
                               `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                               `📝 Sharaxaad: ${cleanNoteForTelegram(note || 'Mushaharka bisha')}\n` +
                               `📅 Taariikhda: ${formattedDate}\n\n` +
                               `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
        } else {
            let customFieldsText = '';
            if (result.categoryName === 'Transport & Fuel' && transportType) {
                customFieldsText = `🚗 Nooca Gadiidka: ${transportType}\n`;
            } else if (result.categoryName === 'Equipment Rental' && equipmentName) {
                customFieldsText = `⚙️ Qalabka: ${equipmentName}\n📅 Muddada Kirada: ${rentalPeriod || ''}\n`;
            } else if (result.categoryName === 'Consultancy & Service' && consultantName) {
                customFieldsText = `👤 La-taliyaha: ${consultantName}\n📋 Adeegga: ${consultancyType || ''}\n`;
            }

            confirmationText = `<b>AN-Industory</b>\n` +
                               `<b>✅ Diiwaangelinta Kharashka (Sugaya Rasiidka)</b>\n\n` +
                               `📂 Qaybta: ${result.categoryName}\n` +
                               `💵 Lacagta la bixiyey: ${amount.toLocaleString()} ETB\n` +
                               customFieldsText +
                               `💳 Koontada la doortay: ${result.accountName} (Haraa: ${Number(result.accountBalance).toLocaleString()} ETB)\n` +
                               `📝 Sharaxaad: ${cleanNoteForTelegram(note)}\n` +
                               `📅 Taariikhda: ${formattedDate}\n\n` +
                               `⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...`;
        }

        // If we have an uploaded receipt image, send it.
        if (receiptUrl) {
            const absolutePath = path.join(process.cwd(), 'public', receiptUrl);
            if (fs.existsSync(absolutePath)) {
                // Send photo as file upload (multipart)
                const formData = new FormData();
                formData.append('chat_id', chatId);
                formData.append('caption', confirmationText);
                formData.append('parse_mode', 'HTML');

                const inlineKeyboard = [];
                formData.append('reply_markup', JSON.stringify({ inline_keyboard: inlineKeyboard }));
                
                const blob = new Blob([fs.readFileSync(absolutePath)], { type: 'image/jpeg' });
                formData.append('photo', blob, 'receipt.jpg');

                const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                    method: 'POST',
                    body: formData
                });
                const resJson = await response.json();
                if (resJson && resJson.ok) {
                    await saveTelegramMetadata(result.id, result.isPurchase, chatId, resJson.result.message_id);
                }
            } else {
                const response = await sendBotRequest('sendMessage', {
                    chat_id: chatId,
                    text: confirmationText,
                    parse_mode: 'HTML'
                });
                if (response && response.ok) {
                    await saveTelegramMetadata(result.id, result.isPurchase, chatId, response.result.message_id);
                }
            }
        } else {
            const response = await sendBotRequest('sendMessage', {
                chat_id: chatId,
                text: confirmationText,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: result.isPurchase ? [
                        [
                            { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_mp_${result.id}` }
                        ]
                    ] : [
                        [
                            { text: "➕ Gali Rasiidka (Upload Receipt)", callback_data: `rcpt_${result.id}` }
                        ]
                    ]
                }
            });
            if (response && response.ok) {
                await saveTelegramMetadata(result.id, result.isPurchase, chatId, response.result.message_id);
            }
        }

    } catch (err) {
        console.error('Error processing telegram transaction:', err);
        await sendBotRequest('sendMessage', {
            chat_id: chatId,
            text: `❌ Cilad ayaa ka dhacday diiwaangelinta database-ka: ${err.message}`
        });
    } finally {
        delete userStates[stateKey];
    }
}

async function saveTelegramMetadata(id, isPurchase, chatId, messageId) {
    try {
        if (isPurchase) {
            const mp = await prisma.materialPurchase.findUnique({ where: { id } });
            if (mp) {
                let newNotes = mp.notes || '';
                newNotes = newNotes
                    .replace(/\[TelegramChatId:\s*[^\]]+\]/g, '')
                    .replace(/\[TelegramMessageId:\s*[^\]]+\]/g, '')
                    .trim();
                newNotes += `\n[TelegramChatId: ${chatId}] [TelegramMessageId: ${messageId}]`;
                await prisma.materialPurchase.update({
                    where: { id },
                    data: { notes: newNotes }
                });
            }
        } else {
            const exp = await prisma.expense.findUnique({ where: { id } });
            if (exp) {
                let newNote = exp.note || '';
                newNote = newNote
                    .replace(/\[TelegramChatId:\s*[^\]]+\]/g, '')
                    .replace(/\[TelegramMessageId:\s*[^\]]+\]/g, '')
                    .trim();
                newNote += `\n[TelegramChatId: ${chatId}] [TelegramMessageId: ${messageId}]`;
                await prisma.expense.update({
                    where: { id },
                    data: { note: newNote }
                });
            }
        }
    } catch (err) {
        console.error("Error saving telegram metadata:", err);
    }
}

// Start the polling loop
pollUpdates();
