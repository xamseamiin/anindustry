import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/reports

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    let reportData = null;

    if (type === 'overview') {
      const totalOrders = await prisma.productionOrder.count({
        where: { companyId, ...dateFilter }
      });
      const completedOrders = await prisma.productionOrder.count({
        where: { companyId, status: 'COMPLETED', ...dateFilter }
      });
      const totalProducts = await prisma.productCatalog.count({
        where: { companyId }
      });

      const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

      reportData = {
        totalOrders,
        completedOrders,
        totalProducts,
        completionRate
      };
    }
    // Add other report types here if needed (e.g. material-usage querying MaterialPurchases)
    else if (type === 'material-usage') {
      // Example: sum quantity of materials
      // For now return null or simple stats
    }

    return NextResponse.json({
      reportType: type,
      period: { startDate, endDate },
      data: reportData
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ message: 'Error fetching report' }, { status: 500 });
  }
}