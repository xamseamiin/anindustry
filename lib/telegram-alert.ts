import { readReceiptImage } from '@/lib/receipt-storage';

export async function sendTelegramOrderAlert(params: {
  title: string;
  invoiceNumber: string;
  customerName?: string | null;
  total: number;
  paidAmount: number;
  paymentMethod: string;
  accountName?: string | null;
  items: Array<{ productName: string; quantity: number; unitPrice: number; total: number }>;
  receiptUrl?: string | null;
  notes?: string | null;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram bot alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.');
    return null;
  }

  const lines = [
    `🧾 <b>${params.title}</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `📄 <b>Invoice:</b> <code>${params.invoiceNumber}</code>`,
    `👤 <b>Macmiilka:</b> ${params.customerName || 'Walk-in / Macmiil Caadi ah'}`,
    `💵 <b>Total:</b> <b>${params.total.toLocaleString()} ETB</b>`,
    `💰 <b>La Bixiyey:</b> ${params.paidAmount.toLocaleString()} ETB`,
    `💳 <b>Qaabka:</b> ${params.paymentMethod} ${params.accountName ? `(${params.accountName})` : ''}`,
    ``,
    `📦 <b>Alaabta la Dalbaday:</b>`
  ];

  for (const item of params.items) {
    lines.push(`  • ${item.quantity}x ${item.productName} — ${item.total.toLocaleString()} ETB`);
  }

  if (params.notes) {
    lines.push(``);
    lines.push(`📝 <i>${params.notes}</i>`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`⏰ <i>${new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT</i>`);

  const caption = lines.join('\n');

  try {
    if (params.receiptUrl) {
      const image = await readReceiptImage(params.receiptUrl);
      if (image) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
        const blob = new Blob([Uint8Array.from(image.buffer)], { type: image.mimeType });
        formData.append('photo', blob, `receipt.${image.mimeType.split('/')[1] || 'jpg'}`);

        const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const json = await res.json();
          return json.result?.message_id || null;
        }
      }
    }

    // Fallback or text-only
    const textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML'
      })
    });

    if (textRes.ok) {
      const json = await textRes.json();
      return json.result?.message_id || null;
    }
  } catch (err) {
    console.error('Failed to send Telegram order alert:', err);
  }

  return null;
}
