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

        const name = String(body.name || '').trim();
        const phone = String(body.phone || body.phoneNumber || '').trim();
        if (!name) {
            return NextResponse.json({ message: 'Customer name is required' }, { status: 400 });
        }

        const existing = await prisma.customer.findFirst({
            where: {
                companyId,
                OR: [
                    { name: { equals: name, mode: 'insensitive' } },
                    ...(phone ? [
                        { phone: { equals: phone, mode: 'insensitive' as const } },
                        { phoneNumber: { equals: phone, mode: 'insensitive' as const } }
                    ] : [])
                ]
            }
        });

        if (existing) {
            const customer = phone && !existing.phone && !existing.phoneNumber
                ? await prisma.customer.update({ where: { id: existing.id }, data: { phone } })
                : existing;
            return NextResponse.json({ customer, created: false, message: 'Existing customer matched' });
        }

        const customer = await prisma.customer.create({
            data: {
                companyId,
                userId, // Assign Owner
                name,
                companyName: body.companyName,
                email: body.email,
                phone,
                address: body.address,
                type: body.type || 'Business',
                notes: body.notes,
                contactPerson: body.contactPerson,
                phoneNumber: body.phoneNumber
            }
        });

        return NextResponse.json({ customer, created: true, message: 'Customer created successfully' });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json({ message: 'Error creating customer' }, { status: 500 });
    }
}
