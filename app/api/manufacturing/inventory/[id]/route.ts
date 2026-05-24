import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET single inventory item
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const item = await prisma.factoryMaterial.findFirst({
      where: { id: params.id, companyId }
    });
    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ message: 'Error fetching item', error: error.message }, { status: 500 });
  }
}

// PATCH: Update inventory item
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireManufacturingAccess();
    const body = await request.json();

    const existing = await prisma.factoryMaterial.findFirst({
      where: { id: params.id, companyId }
    });
    if (!existing) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.sku !== undefined) data.sku = body.sku;
    if (body.category !== undefined) data.category = body.category;
    if (body.description !== undefined) data.description = body.description;
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.inStock !== undefined) data.inStock = parseFloat(body.inStock);
    if (body.minStock !== undefined) data.minStock = parseFloat(body.minStock);
    if (body.purchasePrice !== undefined) data.purchasePrice = parseFloat(body.purchasePrice);
    if (body.sellingPrice !== undefined) data.sellingPrice = parseFloat(body.sellingPrice);
    if (body.capacity !== undefined) data.capacity = parseInt(body.capacity);
    if (body.yieldPerMeter !== undefined) data.yieldPerMeter = parseFloat(body.yieldPerMeter);
    if (body.location !== undefined) data.location = body.location;

    const updated = await prisma.factoryMaterial.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json({ item: updated, message: 'Item updated successfully' });
  } catch (error: any) {
    console.error('Error updating item:', error);
    return NextResponse.json({ message: 'Error updating item', error: error.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const existing = await prisma.factoryMaterial.findFirst({
      where: { id: params.id, companyId }
    });
    if (!existing) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    await prisma.factoryMaterial.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ message: 'Error deleting item', error: error.message }, { status: 500 });
  }
}
