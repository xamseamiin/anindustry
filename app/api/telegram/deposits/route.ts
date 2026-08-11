import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_IDS = new Set(['1836408854', '8230473166']);

async function telegram(token: string, method: string, body: FormData) {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', body });
    const data = await response.json();
    if (!data.ok) throw new Error(data.description || `Telegram ${method} failed.`);
    return data.result;
}

export async function POST(request: Request) {
    let sentMessage: any = null;
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const defaultChatId = process.env.TELEGRAM_CHAT_ID;
        if (!companyId) return NextResponse.json({ error: 'Company configuration is missing.' }, { status: 500 });

        const data = await request.formData();
        const amount = Number(data.get('amount'));
        const accountId = String(data.get('accountId') || '');
        const sourceName = String(data.get('sourceName') || '').trim();
        const transferId = String(data.get('transferId') || '').trim();
        const description = String(data.get('description') || 'Deposit / Dayn la Helay').trim();
        const requesterId = String(data.get('requesterId') || '');
        const requesterName = String(data.get('requesterName') || 'Administrator').trim();
        const customChatId = String(data.get('chatId') || '').trim();
        const receipt = data.get('receipt') as File | null;

        if (process.env.NODE_ENV === 'production' && !ADMIN_IDS.has(requesterId)) {
            return NextResponse.json({ error: 'Deposit-ka waxaa diiwaangelin kara maamulka oo keliya.' }, { status: 403 });
        }
        if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Geli lacag sax ah.' }, { status: 400 });
        if (!sourceName) return NextResponse.json({ error: 'Geli magaca qofka ama meesha lacagtu ka timid.' }, { status: 400 });
        if (!transferId) return NextResponse.json({ error: 'Geli Transfer ID-ga rasiidka.' }, { status: 400 });
        if (!receipt || !receipt.type.startsWith('image/')) return NextResponse.json({ error: 'Sawirka rasiidka waa qasab.' }, { status: 400 });

        const account = await prisma.account.findFirst({ where: { id: accountId, companyId, isActive: true }, select: { id: true, name: true, balance: true, companyId: true } });
        if (!account) return NextResponse.json({ error: 'Koontada la doortay lama helin.' }, { status: 404 });
        const duplicate = await prisma.transaction.findFirst({ where: { companyId, OR: [{ note: { contains: transferId } }, { description: { contains: transferId } }] }, select: { id: true } });
        if (duplicate) return NextResponse.json({ error: `Transfer ID ${transferId} horay ayaa loo diiwaangeliyey.` }, { status: 409 });

        const balanceAfter = Number(account.balance) + amount;
        const dateLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
        const caption = [
            'AN-Industory', '💰 Diiwaangelinta Deposit-ka (Dayn la Helay)', '',
            `👤 Laga helay: ${sourceName}`, `💵 Lacagta: ${amount.toLocaleString()} ETB`,
            `💳 Koontada: ${account.name}`, `🧾 Transfer ID: ${transferId}`,
            `📝 Sharaxaad: ${description}`, `🧑‍💼 Diiwaangeliyey: ${requesterName}`,
            `📅 Taariikhda: ${dateLabel}`, '', `✅ Deposit-kan waxaa lagu daray ${account.name}.`,
            `💼 Haraaga cusub: ${balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`
        ].join('\n');

        const chatId = customChatId || defaultChatId || '';
        const telegramEnabled = process.env.NODE_ENV === 'production' && process.env.DISABLE_TELEGRAM_NOTIFICATIONS !== 'true' && token && chatId;
        let receiptUrl = '';
        if (telegramEnabled) {
            const form = new FormData(); form.append('chat_id', chatId); form.append('caption', caption);
            form.append('photo', receipt, `${transferId}.${receipt.type.split('/')[1] || 'jpg'}`);
            sentMessage = await telegram(token!, 'sendPhoto', form);
            const rawChatId = String(sentMessage.chat.id);
            const privateGroupId = rawChatId.startsWith('-100') ? rawChatId.slice(4) : rawChatId.replace('-', '');
            receiptUrl = `https://t.me/c/${privateGroupId}/${sentMessage.message_id}`;
        }

        const result = await prisma.$transaction(async tx => {
            const check = await tx.transaction.findFirst({ where: { companyId, OR: [{ note: { contains: transferId } }, { description: { contains: transferId } }] }, select: { id: true } });
            if (check) throw new Error(`Transfer ID ${transferId} became a duplicate.`);
            const transaction = await tx.transaction.create({
                data: {
                    companyId, accountId: account.id, amount, type: 'DEBT_TAKEN',
                    description: `Dayn: ${sourceName} - Deposit ${account.name}`,
                    note: `${description}. Transfer ID: ${transferId}.${sentMessage ? ` [ReceiptTelegramMessageId: ${sentMessage.message_id}] [TelegramChatId: ${sentMessage.chat.id}]` : ''}`,
                    category: 'Deposit / Dayn la Helay', receiptUrl: receiptUrl || null,
                    transactionDate: new Date()
                },
                select: { id: true, amount: true, type: true, transactionDate: true }
            });
            const updatedAccount = await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } }, select: { balance: true } });
            return { transaction, balanceAfter: updatedAccount.balance };
        });

        return NextResponse.json({ success: true, ...result, telegramMessageId: sentMessage?.message_id || null, receiptUrl });
    } catch (error: any) {
        if (sentMessage && process.env.TELEGRAM_BOT_TOKEN) {
            const cleanup = new FormData(); cleanup.append('chat_id', String(sentMessage.chat.id)); cleanup.append('message_id', String(sentMessage.message_id));
            await telegram(process.env.TELEGRAM_BOT_TOKEN, 'deleteMessage', cleanup).catch(() => undefined);
        }
        console.error('Deposit registration failed:', error);
        return NextResponse.json({ error: error.message || 'Deposit-ka lama diiwaangelin.' }, { status: 500 });
    }
}
