import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTPAndTrustDevice } from '@/lib/security';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, code } = body;

        if (!userId || !code) {
            return NextResponse.json({ error: 'Missing userId or code' }, { status: 400 });
        }

        const userAgent = req.headers.get('user-agent') || 'Unknown Device';

        await verifyTOTPAndTrustDevice(userId, code, userAgent);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Verification Error:', error);
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 400 });
    }
}
