import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/customers/[id]

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const customer = await prisma.customer.findFirst({
            where: { id: params.id, companyId },
            include: {
                productionOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                projects: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                sales: {
                    select: {
                        total: true,
                        paidAmount: true,
                        paymentStatus: true
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
        }

        // Calculate total outstanding debt
        const totalDebt = customer.sales.reduce((sum, s) => {
            const debt = s.total - s.paidAmount;
            return debt > 0.01 ? sum + debt : sum;
        }, 0);

        return NextResponse.json({ 
            customer: {
                ...customer,
                totalDebt
            }
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json({ message: 'Error fetching customer' }, { status: 500 });
    }
}

// PUT /api/manufacturing/customers/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const body = await request.json();

        // Use updateMany for safety with companyId filtering
        const customer = await prisma.customer.updateMany({
            where: { id: params.id, companyId },
            data: {
                name: body.name,
                companyName: body.companyName,
                email: body.email,
                phone: body.phone,
                address: body.address,
                type: body.type,
                notes: body.notes,
                contactPerson: body.contactPerson,
                phoneNumber: body.phoneNumber
            }
        });

        if (customer.count === 0) {
            return NextResponse.json({ message: 'Customer not found or permission denied' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json({ message: 'Error updating customer' }, { status: 500 });
    }
}

// DELETE /api/manufacturing/customers/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId } = await requireManufacturingAccess();

        const count = await prisma.customer.deleteMany({
            where: { id: params.id, companyId }
        });

        if (count.count === 0) {
            return NextResponse.json({ message: 'Customer not found or permission denied' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json({ message: 'Error: Cannot delete customer with existing orders/projects.' }, { status: 500 });
    }
}
