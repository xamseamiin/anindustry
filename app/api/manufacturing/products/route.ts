import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/products

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = {
      companyId,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.productCatalog.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { billOfMaterials: true }
        }
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}

// POST /api/manufacturing/products
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();
    const { name, description, category, unit, standardCost, sellingPrice, isActive, bom } = body;

    if (!name) {
      return NextResponse.json({ message: 'Product name is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Product Catalog Item
      const product = await tx.productCatalog.create({
        data: {
          companyId,
          name,
          description,
          category,
          unit,
          standardCost: parseFloat(standardCost) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          isActive: isActive !== false
        }
      });

      // 2. Create the associated Bill of Materials (BOM) items if provided
      if (bom && Array.isArray(bom)) {
        for (const item of bom) {
          if (item.materialName && item.quantity) {
            await tx.billOfMaterial.create({
              data: {
                companyId,
                productId: product.id,
                materialName: item.materialName,
                quantity: parseFloat(item.quantity) || 0,
                unit: item.unit || 'pcs',
                costPerUnit: parseFloat(item.costPerUnit) || 0,
                totalCost: (parseFloat(item.quantity) || 0) * (parseFloat(item.costPerUnit) || 0),
                notes: item.notes || 'Default catalog recipe item'
              }
            });
          }
        }
      }

      return product;
    });

    return NextResponse.json({ product: result, message: 'Product and Recipe created successfully!' });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Error creating product: ' + error.message }, { status: 500 });
  }
}
