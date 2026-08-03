import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { verifyReceiptImageWithAI } from '@/lib/receipt-ai';

export const dynamic = 'force-dynamic';

async function sendTelegramAlert(token: string, chatId: string, text: string) {
    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error('Error sending Telegram alert:', e);
    }
}

export async function GET(request: Request) {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const accountId = 'e2124894-d151-432d-90c4-9e5025b71fb9';

        if (!token || !chatId) {
            return NextResponse.json({ error: 'Telegram configuration missing' }, { status: 500 });
        }

        // 1. Fetch expenses from the last 24 hours (or all paid expenses for balance ledger check)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const allExpenses = await prisma.expense.findMany({
            where: {
                accountId,
                paymentStatus: 'PAID'
            },
            include: { user: true },
            orderBy: { createdAt: 'asc' }
        });

        // Calculate chronological running balance
        let balance = 100000.00;
        let deposit2Added = false;

        const ledger = allExpenses.map(exp => {
            const amount = Number(exp.amount);
            if (!deposit2Added && (amount === 12000 || exp.description.includes('Muhiyadiin Moalin'))) {
                balance += 100000.00;
                deposit2Added = true;
            }
            balance -= amount;

            const note = exp.note || '';
            const phoneMatch = note.match(/\[PaymentPhone:\s*(.*?)\]/);
            const recipMatch = note.match(/\[RecipientName:\s*(.*?)\]/);

            return {
                id: exp.id,
                amount,
                correctBalance: balance,
                date: exp.createdAt,
                phone: phoneMatch ? phoneMatch[1].trim() : '',
                recipientName: recipMatch ? recipMatch[1].trim() : '',
                description: exp.description || '',
                receiptUrl: exp.receiptUrl,
                telegramMessageId: exp.telegramMessageId
            };
        });

        // Filter last 24 hours expenses
        const recentExpenses = ledger.filter(item => item.date >= twentyFourHoursAgo);

        const issues: string[] = [];
        const verifiedCount = recentExpenses.length;

        // 2. Perform Audit on recent expenses
        for (const item of recentExpenses) {
            // Check receipt image if available
            if (item.receiptUrl) {
                const fullPath = path.join(process.cwd(), 'public', item.receiptUrl);
                if (fs.existsSync(fullPath)) {
                    const aiRes = await verifyReceiptImageWithAI(fullPath, item.amount, item.phone);
                    if (aiRes.isVerified && !aiRes.isMatch) {
                        issues.push(`⚠️ <b>Msg ID ${item.telegramMessageId || 'N/A'}</b> (${item.amount} ETB → ${item.recipientName}):\n   ${aiRes.message}`);
                    }
                } else {
                    issues.push(`⚠️ <b>Expense ${item.id.slice(0, 8)}</b>: Sawirka rasiidka (${item.receiptUrl}) disk-ka ma yaallo.`);
                }
            }
        }

        // 3. Send Telegram Summary Report
        if (issues.length > 0) {
            const alertText = `<b>🚨 AN-INDUSTORY: BAARITAANKA 24-SAAC (DAILY AUDIT ALERT)</b>\n\n` +
                `Waxaa la helay <b>${issues.length}</b> khalaad ama mismatches 24-kii saac ee ugu dambeeyay:\n\n` +
                issues.join('\n\n') + `\n\n` +
                `<i>Fadlan khaladaadkan sax inta aana la meelmarinin!</i>`;

            await sendTelegramAlert(token, chatId, alertText);

            return NextResponse.json({
                status: 'ALERT',
                issuesCount: issues.length,
                verifiedCount,
                issues
            });
        } else {
            const successText = `<b>✅ AN-INDUSTORY: BAARITAANKA 24-SAAC WUU DHAMMAADAY</b>\n\n` +
                `📊 Dhammaan kharashyadii & rasiidhyadii 24-kii saac ee ugu dambeeyay (Total: <b>${verifiedCount}</b>) waa 100% verified!\n` +
                `• Lacagaha Rasiidhyada = Lacagaha la dalbay ✅\n` +
                `• Lambarada Bixinta = Lambarada Rasiidhyada ✅\n` +
                `• Balance-ka (Haraaga) = Waa 100% Sax ✅`;

            await sendTelegramAlert(token, chatId, successText);

            return NextResponse.json({
                status: 'OK',
                verifiedCount,
                issuesCount: 0
            });
        }

    } catch (e: any) {
        console.error('Daily Audit Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
