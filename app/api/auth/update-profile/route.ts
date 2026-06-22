import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fullName, email, phone } = await req.json();

        if (!fullName || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        // Check if email is being changed and if it is already taken by another user
        if (email.toLowerCase() !== session.user.email?.toLowerCase()) {
            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });
            if (existingUser) {
                return NextResponse.json({ error: 'Email-kan mar hore ayaa la isticmaalay' }, { status: 400 });
            }
        }

        // Update user in DB
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                fullName,
                email: email.toLowerCase(),
                phone: phone || ''
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Profile-ka waa la cusboonaysiiyay',
            user: {
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone
            }
        });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Khalad ayaa dhacay: ' + error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Khalad ayaa dhacay: ' + error.message }, { status: 500 });
    }
}
