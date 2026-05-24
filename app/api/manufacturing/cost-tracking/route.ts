import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get cost tracking data for production orders

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productionOrderId = searchParams.get('productionOrderId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const companyId = session.user.companyId;

    if (productionOrderId) {
      return await getProductionOrderCosts(companyId, productionOrderId);
    } else {
      return await getAllProductionCosts(companyId, startDate, endDate);
    }
  } catch (error) {
    console.error('Error fetching cost tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost tracking data' },
      { status: 500 }
    );
  }
}

// POST - Update cost tracking for a production order
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productionOrderId, actualMaterialCost, actualLaborCost, overheadCost, notes } = body;

    if (!productionOrderId) {
      return NextResponse.json(
        { error: 'Production order ID is required' },
        { status: 400 }
      );
    }

    // Verify production order exists and belongs to company
    const productionOrder = await prisma.productionOrder.findFirst({
      where: {
        id: productionOrderId,
        companyId: session.user.companyId
      }
    });

    if (!productionOrder) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // Update production order with actual costs
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        notes: notes || productionOrder.notes
      }
    });

    // Create cost tracking record
    const costRecord = await prisma.costTracking.create({
      data: {
        productionOrderId,
        actualMaterialCost: actualMaterialCost || 0,
        actualLaborCost: actualLaborCost || 0,
        overheadCost: overheadCost || 0,
        notes,
        companyId: session.user.companyId
      }
    });

    return NextResponse.json({
      message: 'Cost tracking updated successfully',
      costRecord,
      productionOrder: updatedOrder
    });
  } catch (error) {
    console.error('Error updating cost tracking:', error);
    return NextResponse.json(
      { error: 'Failed to update cost tracking' },
      { status: 500 }
    );
  }
}

// Get cost tracking for a specific production order
async function getProductionOrderCosts(companyId: string, productionOrderId: string) {
  const productionOrder = await prisma.productionOrder.findFirst({
    where: {
      id: productionOrderId,
      companyId
    },
    include: {
      billOfMaterials: true,
      workOrders: {
        include: {
          assignedTo: { select: { fullName: true, role: true } }
        }
      },
      materialPurchases: true,
      costTracking: true
    }
  });

  if (!productionOrder) {
    return NextResponse.json(
      { error: 'Production order not found' },
      { status: 404 }
    );
  }

  // Calculate estimated costs
  const estimatedMaterialCost = productionOrder.billOfMaterials?.reduce(
    (sum: number, bom: { totalCost: any }) =>
      sum + (typeof bom.totalCost === 'object' && bom.totalCost !== null && typeof bom.totalCost.toNumber === 'function'
        ? bom.totalCost.toNumber()
        : Number(bom.totalCost)),
    0
  ) || 0;

  const estimatedLaborCost = productionOrder.workOrders?.reduce(
    (sum: number, wo: { estimatedHours: number }) => sum + (wo.estimatedHours * 25), 0 // $25/hour
  ) || 0;

  const actualPurchaseCost = productionOrder.materialPurchases?.reduce(
    (sum: number, mp: { totalPrice: number | string }) => sum + Number(mp.totalPrice), 0
  ) || 0;

  // Get actual costs from cost tracking
  const actualCosts = Array.isArray(productionOrder.costTracking)
    ? (productionOrder.costTracking[0] || { actualMaterialCost: 0, actualLaborCost: 0, overheadCost: 0 })
    : (productionOrder.costTracking || { actualMaterialCost: 0, actualLaborCost: 0, overheadCost: 0 });

  // Calculate variances
  const materialVariance = actualCosts.actualMaterialCost - estimatedMaterialCost;
  const laborVariance = actualCosts.actualLaborCost - estimatedLaborCost;
  const totalVariance = materialVariance + laborVariance + (actualCosts.overheadCost || 0);

  // Calculate profit analysis (if selling price is available)
  const product = await prisma.productCatalog.findFirst({
    where: {
      id: productionOrder.productId || '',
      companyId
    }
  });

  const sellingPrice = product?.sellingPrice ? Number(product.sellingPrice) : 0;
  const totalRevenue = sellingPrice * productionOrder.quantity;
  const totalCost = actualCosts.actualMaterialCost + actualCosts.actualLaborCost + (actualCosts.overheadCost || 0);
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return NextResponse.json({
    productionOrder: {
      id: productionOrder.id,
      orderNumber: productionOrder.orderNumber,
      productName: productionOrder.productName,
      quantity: productionOrder.quantity,
      status: productionOrder.status
    },
    costAnalysis: {
      estimated: {
        materialCost: estimatedMaterialCost,
        laborCost: estimatedLaborCost,
        totalCost: estimatedMaterialCost + estimatedLaborCost
      },
      actual: {
        materialCost: actualCosts.actualMaterialCost,
        laborCost: actualCosts.actualLaborCost,
        overheadCost: actualCosts.overheadCost || 0,
        purchaseCost: actualPurchaseCost,
        totalCost: actualCosts.actualMaterialCost + actualCosts.actualLaborCost + (actualCosts.overheadCost || 0)
      },
      variances: {
        materialVariance,
        laborVariance,
        totalVariance,
        materialVariancePercentage: estimatedMaterialCost > 0 ? (materialVariance / estimatedMaterialCost) * 100 : 0,
        laborVariancePercentage: estimatedLaborCost > 0 ? (laborVariance / estimatedLaborCost) * 100 : 0
      }
    },
    profitAnalysis: {
      sellingPrice,
      totalRevenue,
      totalCost,
      profit,
      profitMargin,
      costPerUnit: productionOrder.quantity > 0 ? totalCost / productionOrder.quantity : 0,
      revenuePerUnit: productionOrder.quantity > 0 ? totalRevenue / productionOrder.quantity : 0
    },
    costBreakdown: {
      materialPercentage: totalCost > 0 ? (actualCosts.actualMaterialCost / totalCost) * 100 : 0,
      laborPercentage: totalCost > 0 ? (actualCosts.actualLaborCost / totalCost) * 100 : 0,
      overheadPercentage: totalCost > 0 ? ((actualCosts.overheadCost || 0) / totalCost) * 100 : 0
    }
  });
}

// Get cost tracking for all production orders
async function getAllProductionCosts(companyId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.lte = new Date(endDate);
  }

  const productionOrders = await prisma.productionOrder.findMany({
    where: {
      companyId,
      ...dateFilter
    },
    include: {
      billOfMaterials: true,
      workOrders: true,
      materialPurchases: true,
      costTracking: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const costSummary = productionOrders.map((order: any) => {
    const estimatedMaterialCost = order.billOfMaterials?.reduce(
      (sum: number, bom: { totalCost: number | string }) => sum + Number(bom.totalCost), 0
    ) || 0;

    const estimatedLaborCost = order.workOrders?.reduce(
      (sum: number, wo: { estimatedHours: number }) => sum + (wo.estimatedHours * 25), 0
    ) || 0;

    const actualCosts = order.costTracking?.[0] || {
      actualMaterialCost: 0,
      actualLaborCost: 0,
      overheadCost: 0
    };

    const totalEstimatedCost = estimatedMaterialCost + estimatedLaborCost;
    const totalActualCost = actualCosts.actualMaterialCost + actualCosts.actualLaborCost + (actualCosts.overheadCost || 0);
    const variance = totalActualCost - totalEstimatedCost;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      productName: order.productName,
      quantity: order.quantity,
      status: order.status,
      estimatedCost: totalEstimatedCost,
      actualCost: totalActualCost,
      variance,
      variancePercentage: totalEstimatedCost > 0 ? (variance / totalEstimatedCost) * 100 : 0,
      costPerUnit: order.quantity > 0 ? totalActualCost / order.quantity : 0
    };
  });

  // Calculate totals


  const totals = costSummary.reduce((acc: {
    totalEstimatedCost: number;
    totalActualCost: number;
    totalVariance: number;
    totalQuantity: number;
  }, order: {
    estimatedCost: number;
    actualCost: number;
    variance: number;
    quantity: number;
  }) => ({
    totalEstimatedCost: acc.totalEstimatedCost + order.estimatedCost,
    totalActualCost: acc.totalActualCost + order.actualCost,
    totalVariance: acc.totalVariance + order.variance,
    totalQuantity: acc.totalQuantity + order.quantity
  }), {
    totalEstimatedCost: 0,
    totalActualCost: 0,
    totalVariance: 0,
    totalQuantity: 0
  });

  return NextResponse.json({
    costSummary,
    totals: {
      ...totals,
      averageCostPerUnit: totals.totalQuantity > 0 ? totals.totalActualCost / totals.totalQuantity : 0,
      overallVariancePercentage: totals.totalEstimatedCost > 0 ? (totals.totalVariance / totals.totalEstimatedCost) * 100 : 0
    }
  });
}

