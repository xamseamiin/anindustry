// app/api/manufacturing/accounting/accounts/route.ts - AN-Industory Accounts API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        
        const accounts = await prisma.account.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json({ message: 'Error fetching accounts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const body = await request.json();

        const account = await prisma.account.create({
            data: {
                companyId,
                name: body.name,
                type: body.type || 'Cash',
                balance: parseFloat(body.balance) || 0,
                currency: body.currency || 'USD',
                isActive: true
            }
        });

        return NextResponse.json({ account, message: 'Account created successfully' });
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json({ message: 'Error creating account' }, { status: 500 });
    }
}
