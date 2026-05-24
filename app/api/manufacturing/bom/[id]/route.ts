import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// DELETE /api/manufacturing/bom/[id]

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const companyId = await getSessionCompanyId();

        await prisma.billOfMaterial.deleteMany({
            where: {
                id: params.id,
                companyId
            }
        });

        return NextResponse.json({ message: 'Item removed from recipe' });
    } catch (error) {
        console.error('Error deleting BOM item:', error);
        return NextResponse.json({ message: 'Error deleting item' }, { status: 500 });
    }
}
