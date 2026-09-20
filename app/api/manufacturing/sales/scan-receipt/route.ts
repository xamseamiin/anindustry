// app/api/manufacturing/sales/scan-receipt/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseSalesReceiptImageWithAI } from '@/lib/sales-receipt-ai';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('receiptFile') as File | null;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'No receipt file uploaded' }, { status: 400 });
        }

        const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
        if (!allowedTypes.has(file.type)) {
            return NextResponse.json({ error: 'Rasiidhku waa inuu noqdaa JPG, PNG ama WEBP.' }, { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Rasiidhku kama weynaan karo 10MB.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const receiptHash = crypto.createHash('sha256').update(buffer).digest('hex');
        const duplicate = await prisma.sale.findFirst({
            where: {
                companyId: user.companyId,
                notes: { contains: `[ReceiptHash:${receiptHash}]` }
            },
            select: { id: true, invoiceNumber: true }
        });
        if (duplicate) {
            return NextResponse.json({
                error: `Rasiidhkan hore ayaa loo diiwaangeliyay (${duplicate.invoiceNumber}).`,
                duplicateSaleId: duplicate.id
            }, { status: 409 });
        }
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'sales_receipts');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const extension = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
        const cleanFileName = `${Date.now()}-${receiptHash.slice(0, 12)}${extension}`;
        const filePath = path.join(uploadsDir, cleanFileName);
        fs.writeFileSync(filePath, buffer);
        const receiptUrl = `/uploads/sales_receipts/${cleanFileName}`;

        const catalog = await prisma.factoryMaterial.findMany({
            where: {
                companyId: user.companyId,
                category: { equals: 'Finished Goods', mode: 'insensitive' }
            },
            select: { id: true, name: true, sku: true, sellingPrice: true },
            orderBy: { name: 'asc' },
            take: 250
        });

        // Trigger Gemini 2.5 Flash Receipt Scanner with the company's live product catalog.
        const scanResult = await parseSalesReceiptImageWithAI(filePath, catalog, file.type);

        return NextResponse.json({
            success: true,
            receiptUrl,
            receiptHash,
            data: scanResult,
            requiresReview: scanResult.warnings.length > 0 || scanResult.confidence < 85
        });
    } catch (error: any) {
        console.error('Error in sales receipt scanning route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
