import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/inventory

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';

        const where: any = {
            companyId,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (category && category !== 'All Categories') {
            where.category = category;
        }

        const items = await prisma.factoryMaterial.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ message: 'Error fetching inventory' }, { status: 500 });
    }
}

// POST /api/manufacturing/inventory
export async function POST(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const body = await request.json();

        const item = await prisma.factoryMaterial.create({
            data: {
                companyId,
                userId, // Owner
                name: body.name,
                sku: body.sku || `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
                category: body.category,
                description: body.description,
                unit: body.unit,
                inStock: parseFloat(body.inStock) || 0,
                minStock: parseFloat(body.minStock) || 0,
                purchasePrice: parseFloat(body.purchasePrice) || 0,
                sellingPrice: parseFloat(body.sellingPrice) || 0,
                capacity: parseInt(body.capacity) || 150,
                yieldPerMeter: parseFloat(body.yieldPerMeter) || 0,
                location: body.location
            }
        });

        return NextResponse.json({ item, message: 'Material added successfully' });
    } catch (error: any) {
        console.error('Error creating factory material:', error);
        return NextResponse.json({ message: 'Error creating material', details: error.message }, { status: 500 });
    }
}
