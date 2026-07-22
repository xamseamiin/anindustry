// app/api/manufacturing/sales/scan-receipt/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { parseSalesReceiptImageWithAI } from '@/lib/sales-receipt-ai';

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

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'sales_receipts');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, cleanFileName);
        fs.writeFileSync(filePath, buffer);
        const receiptUrl = `/uploads/sales_receipts/${cleanFileName}`;

        // Trigger Gemini 2.5 Flash Receipt Scanner
        const scanResult = await parseSalesReceiptImageWithAI(filePath);

        return NextResponse.json({
            success: true,
            receiptUrl,
            data: scanResult
        });
    } catch (error: any) {
        console.error('Error in sales receipt scanning route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
