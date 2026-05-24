import prisma from '@/lib/db';
import { whatsappManager, logToFile } from './manager';

/**
 * Formats a phone number for WhatsApp (adds country code, @c.us suffix)
 */
function formatPhone(phone: string): string {
    let formatted = phone.replace(/[\+\s\-\(\)]/g, '');
    if (formatted.startsWith('0')) {
        formatted = '252' + formatted.substring(1);
    }
    if (!formatted.startsWith('252') && !formatted.startsWith('251') && formatted.length <= 9) {
        formatted = '252' + formatted;
    }
    if (!formatted.endsWith('@c.us')) {
        formatted = `${formatted}@c.us`;
    }
    return formatted;
}

/**
 * Sends a single WhatsApp message from a company's connected WhatsApp session.
 */
export async function sendAiWhatsAppMessage(
    companyId: string,
    phone: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    if (!phone) {
        logToFile(`[AI WhatsApp] No phone provided.`);
        return { success: false, error: 'Phone number missing' };
    }

    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true, name: true, whatsappSessionStatus: true }
        });

        if (!company || company.whatsappSessionStatus !== 'CONNECTED') {
            logToFile(`[AI WhatsApp] Company ${companyId} WhatsApp not connected.`);
            return { success: false, error: 'WhatsApp not connected. Fadlan marka hore ku xidh Settings > WhatsApp.' };
        }

        const session = await whatsappManager.getSession(companyId);
        if (session.status !== 'CONNECTED' || !session.client) {
            return { success: false, error: 'WhatsApp session not ready.' };
        }

        const formattedPhone = formatPhone(phone);
        const brandedMessage = `${message}\n\n_— ${company.name} via Revlo AI_`;

        logToFile(`[AI WhatsApp] Sending to ${formattedPhone} from ${company.name}`);
        await session.client.sendMessage(formattedPhone, brandedMessage);
        logToFile(`[AI WhatsApp] Message sent successfully to ${formattedPhone}`);

        return { success: true };
    } catch (error: any) {
        logToFile(`[AI WhatsApp ERROR] ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Sends bulk WhatsApp messages with rate limiting to avoid bans.
 * Returns a summary of sent/failed counts.
 */
export async function sendBulkWhatsAppMessages(
    companyId: string,
    recipients: { phone: string; name: string }[],
    messageTemplate: string,
    delayMs: number = 3000
): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, whatsappSessionStatus: true }
    });

    if (!company || company.whatsappSessionStatus !== 'CONNECTED') {
        return { sent: 0, failed: recipients.length, errors: ['WhatsApp not connected'] };
    }

    const session = await whatsappManager.getSession(companyId);
    if (session.status !== 'CONNECTED' || !session.client) {
        return { sent: 0, failed: recipients.length, errors: ['WhatsApp session not ready'] };
    }

    for (const recipient of recipients) {
        try {
            const personalizedMsg = messageTemplate
                .replace(/\{name\}/g, recipient.name)
                .replace(/\{company\}/g, company.name);

            const formattedPhone = formatPhone(recipient.phone);
            const brandedMessage = `${personalizedMsg}\n\n_— ${company.name} via Revlo AI_`;

            await session.client.sendMessage(formattedPhone, brandedMessage);
            results.sent++;
            logToFile(`[AI WhatsApp Bulk] ✓ Sent to ${recipient.name} (${formattedPhone})`);

            // Rate limit: wait between messages
            if (delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        } catch (error: any) {
            results.failed++;
            results.errors.push(`${recipient.name}: ${error.message}`);
            logToFile(`[AI WhatsApp Bulk] ✗ Failed: ${recipient.name} — ${error.message}`);
        }
    }

    logToFile(`[AI WhatsApp Bulk] Complete: ${results.sent} sent, ${results.failed} failed`);
    return results;
}
