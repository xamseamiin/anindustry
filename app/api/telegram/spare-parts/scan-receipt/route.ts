import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { parseProcurementReceipt } from '@/lib/procurement-receipt-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const companyId = process.env.TELEGRAM_COMPANY_ID;
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const form = await request.formData();
    const file = form.get('receiptFile') as File | null;
    if (!file || !file.size) return NextResponse.json({ error: 'Soo geli sawirka rasiidka alaabta.' }, { status: 400 });
    if (!new Set(['image/jpeg', 'image/png', 'image/webp']).has(file.type)) return NextResponse.json({ error: 'JPG, PNG ama WEBP kaliya.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Rasiidku kama weynaan karo 10MB.' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const duplicate = await prisma.expense.findFirst({ where: { companyId, note: { contains: `[SupplierReceiptHash:${receiptHash}]` } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: 'Rasiidkan hore ayaa loo xareeyay.' }, { status: 409 });
    const data = await parseProcurementReceipt(buffer, file.type);
    return NextResponse.json({ success: true, receiptHash, data, requiresReview: data.confidence < 85 || data.warnings.length > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Rasiidka alaabta lama akhrin.' }, { status: 500 });
  }
}
