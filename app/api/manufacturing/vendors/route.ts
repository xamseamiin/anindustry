import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET /api/manufacturing/vendors - Fetch all vendors
export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const vendors = await prisma.shopVendor.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, type: true }
        });
        return NextResponse.json({ vendors });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching vendors' }, { status: 500 });
    }
}

// POST /api/manufacturing/vendors - Create new vendor
export async function POST(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const body = await request.json();
        const { name, type, contactPerson, phone, email, address, productsServices, notes } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 });
        }

        const vendor = await prisma.shopVendor.create({
            data: {
                name,
                type,
                contactPerson: contactPerson || null,
                phone: phone || null,
                email: email || null,
                address: address || null,
                productsServices: productsServices || null,
                notes: notes || null,
                companyId
            }
        });

        return NextResponse.json({ vendor, message: 'Vendor created successfully' });
    } catch (error) {
        console.error("Vendor Creation Error:", error);
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }
}
