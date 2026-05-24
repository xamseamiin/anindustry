// app/api/factories/route.ts - Factories API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/factories - Get all factories (grouped from production orders)

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Get production orders grouped by product
    const productionOrders = await prisma.productionOrder.findMany({
      where: { companyId },
      include: {
        product: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get sales data
    const sales = await prisma.transaction.findMany({
      where: {
        companyId,
        type: 'INCOME',
        OR: [
          { category: 'SALES' },
          { description: { contains: 'Sale', mode: 'insensitive' } },
          { description: { contains: 'Iib', mode: 'insensitive' } },
        ],
      },
      include: {
        customer: true,
      },
    });

    // Group by factory/product
    const factoryMap = new Map<string, any>();

    productionOrders.forEach((order) => {
      const key = order.productName || order.product?.name || 'General Factory';
      if (!factoryMap.has(key)) {
        factoryMap.set(key, {
          id: `factory-${key.replace(/\s+/g, '-').toLowerCase()}`,
          name: key,
          description: `Warshada soo saarista ${key}`,
          factoryType: 'Water & Juice Containers',
          status: 'Active',
          totalProduction: 0,
          totalSales: 0,
          totalRevenue: 0,
          productionOrders: [],
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        });
      }
      const factory = factoryMap.get(key)!;
      factory.totalProduction += order.quantity || 0;
      factory.productionOrders.push(order);
    });

    // Add sales data
    sales.forEach((sale) => {
      const description = sale.description || '';
      const factoryName = description.split(':')[1]?.trim() || description;
      const factory = Array.from(factoryMap.values()).find(f => 
        f.name.includes(factoryName) || factoryName.includes(f.name)
      );
      if (factory) {
        factory.totalSales += 1;
        factory.totalRevenue += Number(sale.amount) || 0;
      }
    });

    const factories = Array.from(factoryMap.values());

    return NextResponse.json({ factories });
  } catch (error) {
    console.error('Error fetching factories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch factories' },
      { status: 500 }
    );
  }
}

