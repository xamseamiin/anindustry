import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// TEMPORARY: Force password reset endpoint - DELETE AFTER USE
export async function POST(req: NextRequest) {
    try {
        const { email, newPassword, secret } = await req.json();

        if (secret !== 'anindustry-temp-reset-2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ 
            success: true, 
            message: `Password updated for ${updatedUser.email}` 
        });
    } catch (error: any) {
        console.error('Force reset error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET handler so we can trigger via browser URL
export async function GET(req: NextRequest) {
    try {
        const email = 'anindustry@gmail.com';
        const newPassword = 'Anindustry123';

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ 
            success: true, 
            message: `Password updated for ${updatedUser.email}`,
            newPassword: newPassword
        });
    } catch (error: any) {
        console.error('Force reset error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
