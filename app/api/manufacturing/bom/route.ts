import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/bom?productId=...

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
        }

        const bom = await prisma.billOfMaterial.findMany({
            where: {
                companyId,
                productId,
                // We only want template BOMs, so productionOrderId should be null (or we filter by it)
                // But since I just made it nullable, I can search where it is null.
                productionOrderId: null
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({ bom });
    } catch (error) {
        console.error('Error fetching BOM:', error);
        return NextResponse.json({ message: 'Error fetching BOM' }, { status: 500 });
    }
}

// POST /api/manufacturing/bom - Add Item to Product BOM
export async function POST(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const body = await request.json();

        if (!body.productId || !body.materialName || !body.quantity || !body.costPerUnit) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const item = await prisma.billOfMaterial.create({
            data: {
                companyId,
                productId: body.productId,
                materialName: body.materialName,
                quantity: parseFloat(body.quantity),
                unit: body.unit || 'pcs',
                costPerUnit: parseFloat(body.costPerUnit),
                totalCost: parseFloat(body.quantity) * parseFloat(body.costPerUnit),
                // productionOrderId is now optional!
            }
        });

        return NextResponse.json({ item, message: 'Material added to recipe' });
    } catch (error) {
        console.error('Error creating BOM item:', error);
        return NextResponse.json({ message: 'Error creating BOM item' }, { status: 500 });
    }
}
