// app/api/manufacturing/fiscal/route.ts - Fiscal Period Management
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ periods: [] });
        }

        const periods = await prisma.financialPeriod.findMany({
            where: { companyId: user.companyId },
            orderBy: { startDate: 'desc' }
        });

        return NextResponse.json({ periods });
    } catch (error) {
        console.error('Error fetching fiscal periods:', error);
        return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, role: true }
        });

        if (!user?.companyId || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Only admins can manage fiscal periods' }, { status: 403 });
        }

        const body = await req.json();
        const { name, startDate, endDate, isClosed } = body;

        // Find if period exists
        const existing = await prisma.financialPeriod.findUnique({
            where: {
                name_companyId: {
                    name,
                    companyId: user.companyId
                }
            }
        });

        let period;
        if (existing) {
            period = await prisma.financialPeriod.update({
                where: { id: existing.id },
                data: {
                    isClosed: isClosed ?? existing.isClosed,
                    closedAt: isClosed ? new Date() : (isClosed === false ? null : existing.closedAt),
                    closedById: isClosed ? session.user.id : (isClosed === false ? null : existing.closedById)
                }
            });
        } else {
            period = await prisma.financialPeriod.create({
                data: {
                    name,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    isClosed: !!isClosed,
                    companyId: user.companyId,
                    closedAt: isClosed ? new Date() : null,
                    closedById: isClosed ? session.user.id : null
                }
            });
        }

        // Log Audit Action
        await logAudit({
            action: isClosed ? 'CLOSE_FISCAL_PERIOD' : 'OPEN_FISCAL_PERIOD',
            entity: 'FinancialPeriod',
            entityId: period.id,
            details: `${isClosed ? 'Closed' : 'Opened'} fiscal period: ${name}`,
            userId: session.user.id,
            companyId: user.companyId
        });

        return NextResponse.json({ success: true, period });
    } catch (error) {
        console.error('Error managing fiscal period:', error);
        return NextResponse.json({ error: 'Failed to manage fiscal period' }, { status: 500 });
    }
}
