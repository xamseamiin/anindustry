import prisma from '@/lib/db';
import { whatsappManager, logToFile } from './manager';

export async function sendPurchaseNotification(
    companyId: string, 
    poId: string, 
    employeeIds: string[]
) {
    if (!employeeIds || employeeIds.length === 0) return false;

    try {
        const company = await (prisma as any).company.findUnique({
            where: { id: companyId },
            select: { name: true, whatsappSessionStatus: true }
        });

        if (company?.whatsappSessionStatus !== 'CONNECTED') {
            logToFile(`[WhatsApp] Company ${companyId} not connected, skipping PO broadcast.`);
            return false;
        }

        const po = await (prisma as any).purchaseOrder.findUnique({
            where: { id: poId },
            include: {
                vendor: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!po) return false;

        const employees = await (prisma as any).employee.findMany({
            where: {
                id: { in: employeeIds },
                companyId: companyId
            }
        });

        const activeEmployees = employees.filter((e: any) => e.phone);
        if (activeEmployees.length === 0) return false;

        // Construct Message
        let message = `📦 *NEW PURCHASE STOCK*\n`;
        message += `Supplier: *${po.vendor?.name || 'Unknown'}*\n`;
        message += `PO Number: #${po.poNumber}\n\n`;
        message += `*Updated Prices (Landed Cost):*\n`;

        po.items.forEach((item: any) => {
            const currentCost = Number(item.unitCost).toLocaleString();
            const prevCost = item.product?.costPrice ? Number(item.product.costPrice).toLocaleString() : 'NEW';
            
            let trend = '';
            if (item.product?.costPrice) {
                if (item.unitCost > Number(item.product.costPrice)) trend = ' 📈';
                else if (item.unitCost < Number(item.product.costPrice)) trend = ' 📉';
            }

            message += `• *${item.productName}*\n`;
            message += `  Price: ETB ${currentCost}${trend}\n`;
            if (prevCost !== 'NEW' && prevCost !== currentCost) {
                message += `  (Prev: ETB ${prevCost})\n`;
            } else if (prevCost === 'NEW') {
                message += `  (✨ New Item)\n`;
            }
        });

        message += `\n_System: Revlo VR_`;

        const session = await whatsappManager.getSession(companyId);
        if (session.status !== 'CONNECTED' || !session.client) return false;

        for (const emp of activeEmployees) {
            let formattedPhone = emp.phone.replace(/[\+\s\-\(\)]/g, '');
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '251' + formattedPhone.substring(1);
            }
            if (!formattedPhone.endsWith('@c.us')) {
                formattedPhone = `${formattedPhone}@c.us`;
            }

            try {
                await session.client.sendMessage(formattedPhone, message);
                logToFile(`[WhatsApp] PO update sent to ${emp.fullName} (${formattedPhone})`);
            } catch (err) {
                logToFile(`[WhatsApp ERROR] Failed to send to ${formattedPhone}: ${err}`);
            }
        }

        return true;
    } catch (error) {
        logToFile(`[WhatsApp ERROR] Global notification failure: ${error}`);
        return false;
    }
}
