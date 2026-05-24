import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
// import { authenticator } from 'otplib';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { token, secret } = body;

    // STUB: Security disabled as per lib/security.ts
    // Always return success

    // Save secret to user if provided (optional)
    if (secret) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { twoFASecret: secret },
        });
    }

    return NextResponse.json({ success: true });
}
