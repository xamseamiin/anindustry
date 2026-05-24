import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export async function GET(request: Request) {
  try {
    const { companyId } = await requireManufacturingAccess();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search'); // either an invoiceNumber or a vendor name

    if (!search) {
      return NextResponse.json({ message: 'Missing search parameter' }, { status: 400 });
    }

    let purchases = [];
    
    // 1. Try to see if 'search' is a direct Item ID
    const sampleById = await prisma.materialPurchase.findUnique({
        where: { id: search }
    });

    if (sampleById) {
        if (sampleById.invoiceNumber) {
            purchases = await prisma.materialPurchase.findMany({
                where: { companyId, invoiceNumber: sampleById.invoiceNumber },
                include: { vendor: true }
            });
        } else {
            const startOfDay = new Date(sampleById.purchaseDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(sampleById.purchaseDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            purchases = await prisma.materialPurchase.findMany({
                where: { 
                    companyId, 
                    vendorId: sampleById.vendorId,
                    purchaseDate: { gte: startOfDay, lte: endOfDay },
                    invoiceNumber: { equals: null }
                },
                include: { vendor: true }
            });
        }
    }

    // 2. Try to find by invoice number if not found by ID
    if (purchases.length === 0) {
        purchases = await prisma.materialPurchase.findMany({
            where: {
                companyId,
                invoiceNumber: search
            },
            include: { vendor: true }
        });
    }

    // 3. Try to match by vendor name
    if (purchases.length === 0) {
      const sample = await prisma.materialPurchase.findFirst({
        where: {
            companyId,
            vendor: { name: { contains: search } },
            invoiceNumber: { equals: null }
        },
        orderBy: { purchaseDate: 'desc' }
      });

      if (sample) {
          const startOfDay = new Date(sample.purchaseDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(sample.purchaseDate);
          endOfDay.setHours(23, 59, 59, 999);

          purchases = await prisma.materialPurchase.findMany({
              where: {
                  companyId,
                  vendorId: sample.vendorId,
                  purchaseDate: { gte: startOfDay, lte: endOfDay },
                  invoiceNumber: { equals: null }
              },
              include: { vendor: true }
          });
      }
    }

    if (purchases.length === 0) {
        return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    // Calculate aggregated data
    const vendorId = purchases[0].vendorId;
    const purchaseDate = purchases[0].purchaseDate.toISOString().split('T')[0];
    const invoiceNumber = purchases[0].invoiceNumber || '';
    const notes = purchases[0].notes || '';
    const transportCost = purchases.reduce((sum, p) => sum + (p.transportCost || 0), 0);
    const taxAmount = purchases.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
    const otherCosts = purchases.reduce((sum, p) => sum + (p.otherCosts || 0), 0);
    const paidAmount = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    // Look for the original transaction to get the accountId it was paid from
    let accountId = '';
    if (paidAmount > 0) {
        let txSearchDesc = invoiceNumber ? `Inv: ${invoiceNumber}` : 'Material Purchase Payment';
        const tx = await prisma.transaction.findFirst({
            where: {
                companyId,
                vendorId,
                type: 'EXPENSE',
                OR: [
                    { description: { contains: txSearchDesc } },
                    { description: { contains: `Invoice: ${invoiceNumber}` } }
                ]
            },
            orderBy: { transactionDate: 'asc' } // get the original payment
        });
        if (tx && tx.accountId) {
            accountId = tx.accountId;
        }
    }

    // Format items
    const items = purchases.map(p => ({
        id: p.id,
        materialName: p.materialName,
        quantity: p.quantity,
        unit: p.unit,
        unitPrice: p.unitPrice,
        totalPrice: p.totalPrice,
        excludeLandedCost: !p.landedCostApplied,
        inventoryItemId: '' // We can't know the exact inventoryItemId if the name changed, but the frontend matches it by name
    }));

    return NextResponse.json({
        batch: {
            vendorId,
            purchaseDate,
            invoiceNumber,
            notes,
            transportCost,
            taxAmount,
            otherCosts,
            paidAmount,
            accountId,
            items,
            oldPurchaseIds: items.map(i => i.id) // To know which ones to delete
        }
    });
  } catch (error: any) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
