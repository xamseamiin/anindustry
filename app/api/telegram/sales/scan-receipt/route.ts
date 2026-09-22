import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { parseSalesReceiptImageWithAI } from '@/lib/sales-receipt-ai';
import { storeReceiptImage } from '@/lib/receipt-storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const formData = await req.formData();
    const file = formData.get('receiptFile') as File | null;
    if (!file || !file.size) return NextResponse.json({ error: 'No receipt uploaded.' }, { status: 400 });
    if (!new Set(['image/jpeg', 'image/png', 'image/webp']).has(file.type)) return NextResponse.json({ error: 'JPG, PNG ama WEBP kaliya.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Rasiidhku kama weynaan karo 10MB.' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const duplicate = await prisma.sale.findFirst({ where: { companyId, notes: { contains: `[ReceiptHash:${receiptHash}]` } }, select: { invoiceNumber: true } });
    if (duplicate) return NextResponse.json({ error: `Rasiidhkan hore ayaa loo diiwaangeliyay (${duplicate.invoiceNumber}).` }, { status: 409 });
    const catalog = await prisma.factoryMaterial.findMany({ where: { companyId }, select: { id: true, name: true, sku: true, sellingPrice: true }, orderBy: { name: 'asc' }, take: 250 });
    // Read the uploaded bytes directly first. Receipt persistence is best-effort so a
    // missing Blob token cannot prevent the AI from recognizing the receipt.
    const data = await parseSalesReceiptImageWithAI(buffer, catalog, file.type);
    let receiptUrl: string | null = null;
    let receiptWarning: string | null = null;
    try {
      receiptUrl = await storeReceiptImage({ buffer, mimeType: file.type, folder: 'sales_receipts', nameHint: receiptHash.slice(0, 12) });
    } catch (error: any) {
      receiptWarning = error?.message || 'Sawirka AI ayaa akhriyey, balse kaydinta rasiidku way fashilantay.';
      console.warn('Sales receipt parsed but could not be persisted.', error);
    }
    return NextResponse.json({ success: true, receiptUrl, receiptHash, receiptWarning, data, requiresReview: data.warnings.length > 0 || data.confidence < 85 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Receipt scan failed.' }, { status: 500 });
  }
}
