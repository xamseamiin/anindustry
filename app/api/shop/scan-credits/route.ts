// app/api/shop/scan-credits/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            credits: 9999,
            plan: 'PREMIUM',
            packages: []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
