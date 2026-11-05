import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireTelegramPermission } from '@/lib/telegram-access';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const initData = String(formData.get('initData') || '');
    const clientChatId = String(formData.get('chatId') || '');
    const fileName = String(formData.get('fileName') || `report-${Date.now()}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const caption = String(formData.get('caption') || '📊 Warbixinta Maaliyadda AN-Industry');
    const file = formData.get('document') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Faylka lama soo gudbin.' }, { status: 400 });
    }

    const access = await requireTelegramPermission(initData, 'viewReports');
    if (!access) {
      return NextResponse.json({ error: 'Warbixintan fasax uma lihid.' }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Save locally for direct HTTPS download
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeDiskFileName = `${Date.now()}-${fileName}`;
    const filePath = path.join(uploadDir, safeDiskFileName);
    fs.writeFileSync(filePath, buffer);

    const host = request.headers.get('host') || 'anindustry.online';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const downloadUrl = `${proto}://${host}/uploads/reports/${safeDiskFileName}`;

    // 2. Deliver via Telegram Bot directly to user's chat
    const token = process.env.TELEGRAM_BOT_TOKEN;
    let telegramSent = false;
    let telegramMessageId: number | null = null;
    const telegramErrors: string[] = [];

    if (token) {
      const candidates = [
        clientChatId,
        access.telegramId ? String(access.telegramId) : null,
        process.env.TELEGRAM_CHAT_ID
      ].filter(Boolean);

      const uniqueTargets = [...new Set(candidates.map(String))];

      for (const targetId of uniqueTargets) {
        try {
          const tgForm = new FormData();
          tgForm.append('chat_id', targetId);
          tgForm.append('caption', caption);
          tgForm.append('parse_mode', 'HTML');
          const mimeType = fileName.endsWith('.xlsx')
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf';
          const blob = new Blob([buffer], { type: mimeType });
          tgForm.append('document', blob, fileName);

          const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            body: tgForm
          });

          const data = await res.json();
          if (data.ok && data.result?.message_id) {
            telegramSent = true;
            telegramMessageId = data.result.message_id;
            break; // Stop after first successful delivery
          }
          telegramErrors.push(String(data.description || `Telegram rejected chat ${targetId}`));
        } catch (tgErr) {
          telegramErrors.push(tgErr instanceof Error ? tgErr.message : String(tgErr));
          console.warn(`Telegram delivery failed for chat ${targetId}:`, tgErr);
        }
      }
    } else {
      telegramErrors.push('TELEGRAM_BOT_TOKEN is missing in production environment.');
    }

    return NextResponse.json({
      success: true,
      telegramSent,
      telegramMessageId,
      telegramError: telegramSent ? null : telegramErrors.join(' | '),
      downloadUrl,
      fileName
    });
  } catch (error: any) {
    console.error('Send document error:', error);
    return NextResponse.json({ error: error.message || 'Faylka lama diri karin.' }, { status: 500 });
  }
}
