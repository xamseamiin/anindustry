import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
const ADMIN_IDS = new Set(['1836408854', '8230473166']);

async function callTelegram(token: string, method: string, body: FormData) {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', body });
    const data = await response.json();
    if (!data.ok) throw new Error(data.description || `Telegram ${method} failed.`);
    return data.result;
}

export async function POST(request: Request) {
    let sent: any = null;
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const form = await request.formData();
        const amount = Number(form.get('amount'));
        const accountId = String(form.get('accountId') || '');
        const sourceName = String(form.get('sourceName') || '').trim();
        const transferId = String(form.get('transferId') || '').trim();
        const description = String(form.get('description') || 'Deposit / Dayn la Helay').trim();
        const requesterId = String(form.get('requesterId') || '');
        const requesterName = String(form.get('requesterName') || 'Administrator').trim();
        const receipt = form.get('receipt') as File | null;
        const chatId = String(form.get('chatId') || process.env.TELEGRAM_CHAT_ID || '');
        if (!companyId) return NextResponse.json({ error: 'Company configuration is missing.' }, { status: 500 });
        if (!ADMIN_IDS.has(requesterId)) return NextResponse.json({ error: 'Deposit-ka waxaa diiwaangelin kara maamulka oo keliya.' }, { status: 403 });
        if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Geli lacag sax ah.' }, { status: 400 });
        if (!sourceName || !transferId) return NextResponse.json({ error: 'Magaca lacagta laga helay iyo Transfer ID waa qasab.' }, { status: 400 });
        if (!receipt || !receipt.type.startsWith('image/')) return NextResponse.json({ error: 'Sawirka rasiidka waa qasab.' }, { status: 400 });
        const account = await prisma.account.findFirst({ where: { id: accountId, companyId, isActive: true }, select: { id: true, name: true, balance: true } });
        if (!account) return NextResponse.json({ error: 'Koontada la doortay lama helin.' }, { status: 404 });
        const duplicate = await prisma.transaction.findFirst({ where: { companyId, OR: [{ note: { contains: transferId } }, { description: { contains: transferId } }] }, select: { id: true } });
        if (duplicate) return NextResponse.json({ error: `Transfer ID ${transferId} horay ayaa loo diiwaangeliyey.` }, { status: 409 });
        const nextBalance = Number(account.balance) + amount;
        const caption = ['AN-Industory','💰 Diiwaangelinta Deposit-ka (Dayn la Helay)','',`👤 Laga helay: ${sourceName}`,`💵 Lacagta: ${amount.toLocaleString()} ETB`,`💳 Koontada: ${account.name}`,`🧾 Transfer ID: ${transferId}`,`📝 Sharaxaad: ${description}`,`🧑‍💼 Diiwaangeliyey: ${requesterName}`,'',`✅ Deposit-kan waxaa lagu daray ${account.name}.`,`💼 Haraaga cusub: ${nextBalance.toLocaleString(undefined,{minimumFractionDigits:2})} ETB`].join('\n');
        let receiptUrl = '';
        if (token && chatId) {
            const upload = new FormData(); upload.append('chat_id', chatId); upload.append('caption', caption); upload.append('photo', receipt, `${transferId}.jpg`);
            sent = await callTelegram(token, 'sendPhoto', upload);
            const raw = String(sent.chat.id); receiptUrl = `https://t.me/c/${raw.startsWith('-100') ? raw.slice(4) : raw.replace('-', '')}/${sent.message_id}`;
        }
        const result = await prisma.$transaction(async tx => {
            const exists = await tx.transaction.findFirst({ where: { companyId, OR: [{ note: { contains: transferId } }, { description: { contains: transferId } }] }, select: { id: true } });
            if (exists) throw new Error(`Transfer ID ${transferId} became a duplicate.`);
            const transaction = await tx.transaction.create({ data: { companyId, accountId: account.id, amount, type: 'DEBT_TAKEN', description: `Dayn: ${sourceName} - Deposit ${account.name}`, note: `${description}. Transfer ID: ${transferId}.${sent ? ` [ReceiptTelegramMessageId: ${sent.message_id}] [TelegramChatId: ${sent.chat.id}]` : ''}`, category: 'Deposit / Dayn la Helay', receiptUrl: receiptUrl || null }, select: { id: true, amount: true, type: true, transactionDate: true } });
            const updated = await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } }, select: { balance: true } });
            return { transaction, balanceAfter: updated.balance };
        });
        return NextResponse.json({ success: true, ...result, telegramMessageId: sent?.message_id || null, receiptUrl });
    } catch (error: any) {
        if (sent && process.env.TELEGRAM_BOT_TOKEN) { const clean = new FormData(); clean.append('chat_id', String(sent.chat.id)); clean.append('message_id', String(sent.message_id)); await callTelegram(process.env.TELEGRAM_BOT_TOKEN, 'deleteMessage', clean).catch(() => undefined); }
        return NextResponse.json({ error: error.message || 'Deposit-ka lama diiwaangelin.' }, { status: 500 });
    }
}
