import prisma from '@/lib/db';
import { whatsappManager, logToFile } from './manager';

export async function sendWelcomeWhatsApp(phone: string, fullName: string, companyName: string) {
  if (!phone) {
    logToFile(`[WhatsApp] No phone provided for welcome message to ${fullName}`);
    return false;
  }

  try {
    // We use the first company in the system (SuperAdmin) as the sender
    // This is a common pattern in this project for system-wide alerts
    const superAdminCompany = await prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, whatsappSessionStatus: true }
    });

    if (!superAdminCompany || superAdminCompany.whatsappSessionStatus !== 'CONNECTED') {
      logToFile(`[WhatsApp] SuperAdmin WhatsApp not connected, skipping welcome message.`);
      return false;
    }

    let session = await whatsappManager.getSession(superAdminCompany.id);

    if (session.status !== 'CONNECTED' || !session.client) {
      logToFile(`[WhatsApp] Cannot send welcome message. SuperAdmin Status: ${session.status}`);
      return false;
    }

    // Format phone number for WhatsApp
    let formattedPhone = phone.replace(/[\+\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '251' + formattedPhone.substring(1); // Default to local format if needed, but usually 0 is replaced by country code
    }
    
    // Most Somali numbers start with 252
    if (!formattedPhone.startsWith('252') && !formattedPhone.startsWith('251') && formattedPhone.length === 9) {
        formattedPhone = '252' + formattedPhone;
    }

    if (!formattedPhone.endsWith('@c.us')) {
      formattedPhone = `${formattedPhone}@c.us`;
    }

    const messageText = `Salaamu Calaykum *${fullName}*.\n\nKu soo dhawaaw *Revlo Business Solutions*!\n\nWaan ku faraxsanahay inaad nagu soo biirtay. Akoonkaaga shirkadda *${companyName}* si guul leh ayaa loo abuuray.\n\nHadda waxaad diyaar u tahay inaad si casri ah u maamusho ganacsigaaga.\n\nGuul ayaan kuu rajaynaynaa!\n\n*Revlo Team*`;

    logToFile(`[WhatsApp] Sending welcome message to ${formattedPhone}`);
    await session.client.sendMessage(formattedPhone, messageText);
    logToFile(`[WhatsApp] Welcome message sent successfully to ${formattedPhone}`);

    return true;
  } catch (error) {
    logToFile(`[WhatsApp ERROR] Error sending welcome message to ${phone}: ${error}`);
    return false;
  }
}
