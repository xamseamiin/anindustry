import prisma from '@/lib/db';

/**
 * Update the WhatsApp connection status for a company in the database.
 */
export async function updateCompanyWhatsAppStatus(
    companyId: string,
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED',
    phoneNumber?: string | null
) {
    if (!companyId) {
        console.warn('[WhatsApp Store] No companyId provided, skipping status update');
        return;
    }

    try {
        await prisma.company.update({
            where: { id: companyId },
            data: {
                whatsappSessionStatus: status,
                ...(phoneNumber !== undefined ? { whatsappNumber: phoneNumber } : {}),
            },
        });
        console.log(`[WhatsApp Store] Updated company ${companyId} status to ${status}`);
    } catch (error) {
        console.error(`[WhatsApp Store] Failed to update status for company ${companyId}:`, error);
    }
}
