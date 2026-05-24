import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/products/[id]

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const product = await prisma.productCatalog.findFirst({
      where: { id: params.id, companyId },
      include: {
        billOfMaterials: true
      }
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ message: 'Error fetching product' }, { status: 500 });
  }
}

// PUT /api/manufacturing/products/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();
    const { name, description, category, unit, sellingPrice, isActive, bom } = body;

    if (!name) {
      return NextResponse.json({ message: 'Product name is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let computedStandardCost = 0;

      // Ensure the product exists
      let product = await tx.productCatalog.findFirst({
        where: { id: params.id, companyId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      product = await tx.productCatalog.update({
        where: { id: params.id },
        data: {
          name,
          description,
          category,
          unit,
          sellingPrice: parseFloat(sellingPrice) || 0,
          isActive: isActive !== false
        }
      });

      // Handle BOM updates
      if (bom && Array.isArray(bom)) {
        // Delete existing BOM for this product to replace with new
        await tx.billOfMaterial.deleteMany({
          where: { productId: params.id, companyId }
        });

        // Recreate BOM items
        for (const item of bom) {
          if (item.materialName && item.quantity) {
            const qty = parseFloat(item.quantity) || 0;
            const costPerUnit = parseFloat(item.costPerUnit) || 0;
            const totalCost = qty * costPerUnit;
            
            computedStandardCost += totalCost;

            await tx.billOfMaterial.create({
              data: {
                companyId,
                productId: product.id,
                materialName: item.materialName,
                quantity: qty,
                unit: item.unit || 'pcs',
                costPerUnit: costPerUnit,
                totalCost: totalCost,
                notes: item.notes || ''
              }
            });
          }
        }
      }

      // Update the computed standard cost
      product = await tx.productCatalog.update({
        where: { id: params.id },
        data: { standardCost: computedStandardCost }
      });

      return product;
    });

    return NextResponse.json({ product: result, message: 'Product updated successfully!' });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ message: 'Error updating product: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/manufacturing/products/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();

    const result = await prisma.$transaction(async (tx) => {
        await tx.billOfMaterial.deleteMany({
            where: { productId: params.id, companyId }
        });
        
        return await tx.productCatalog.deleteMany({
            where: { id: params.id, companyId }
        });
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ message: 'Cannot delete product (may be used in orders)' }, { status: 500 });
  }
}
