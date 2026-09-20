import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseSalesReceiptImageWithAI } from '@/lib/sales-receipt-ai';

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
    const dir = path.join(process.cwd(), 'public', 'uploads', 'sales_receipts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const extension = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    const fileName = `${Date.now()}-${receiptHash.slice(0, 12)}${extension}`;
    fs.writeFileSync(path.join(dir, fileName), buffer);
    const catalog = await prisma.factoryMaterial.findMany({ where: { companyId }, select: { id: true, name: true, sku: true, sellingPrice: true }, orderBy: { name: 'asc' }, take: 250 });
    const data = await parseSalesReceiptImageWithAI(path.join(dir, fileName), catalog, file.type);
    return NextResponse.json({ success: true, receiptUrl: `/uploads/sales_receipts/${fileName}`, receiptHash, data, requiresReview: data.warnings.length > 0 || data.confidence < 85 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Receipt scan failed.' }, { status: 500 });
  }
}
