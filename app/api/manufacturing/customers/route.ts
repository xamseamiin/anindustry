import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/customers

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const customers = await prisma.customer.findMany({
            where: {
                companyId,

                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { companyName: { contains: search, mode: 'insensitive' } },
                ]
            },
            include: {
                _count: {
                    select: { productionOrders: true, projects: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ customers });
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        if (error.message && error.message.includes('Unauthorized')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Error fetching customers' }, { status: 500 });
    }
}

// POST /api/manufacturing/customers
export async function POST(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const body = await request.json();

        const customer = await prisma.customer.create({
            data: {
                companyId,
                userId, // Assign Owner
                name: body.name,
                companyName: body.companyName,
                email: body.email,
                phone: body.phone,
                address: body.address,
                type: body.type || 'Business',
                notes: body.notes,
                contactPerson: body.contactPerson,
                phoneNumber: body.phoneNumber
            }
        });

        return NextResponse.json({ customer, message: 'Customer created successfully' });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json({ message: 'Error creating customer' }, { status: 500 });
    }
}
