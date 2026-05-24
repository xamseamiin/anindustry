// app/api/manufacturing/sales/[id]/route.ts - AN-Industory Single Sale API
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const sale = await prisma.sale.findFirst({
            where: {
                OR: [
                    { id: id },
                    { invoiceNumber: id }
                ]
            },
            include: {
                customer: true,
                items: true,
                account: true,
                user: {
                    select: { fullName: true }
                }
            }
        });

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        return NextResponse.json({ sale });
    } catch (error) {
        console.error('Error fetching sale details:', error);
        return NextResponse.json({ error: 'Failed to fetch sale details' }, { status: 500 });
    }
}

// DELETE /api/manufacturing/sales/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Note: In a production manufacturing system, you might want to adjust stock back
        // when a sale is deleted. For now, we just delete.
        await prisma.sale.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting sale:', error);
        return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
    }
}
