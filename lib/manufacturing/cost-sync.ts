import prisma from '@/lib/db';

/**
 * Updates the cost of a material across all Bill of Materials (Recipes) 
 * and recalculates the Standard Cost of any Product that uses it.
 * 
 * @param companyId The ID of the company
 * @param materialName The name of the material that changed price
 * @param newCostPerUnit The new price per unit of the material
 * @param tx Optional prisma transaction client
 */
export async function syncProductCostsForMaterial(
    companyId: string, 
    materialName: string, 
    newCostPerUnit: number, 
    tx?: any
) {
    const db = tx || prisma;
    
    try {
        // 1. Find all BillOfMaterial records using this material
        const boms = await db.billOfMaterial.findMany({
            where: { 
                companyId, 
                materialName: {
                    equals: materialName,
                    mode: 'insensitive' // In case of minor casing differences
                } 
            }
        });

        if (boms.length === 0) return; // Material not used in any recipes

        // 2. Update each BOM's cost and totalCost
        for (const bom of boms) {
            await db.billOfMaterial.update({
                where: { id: bom.id },
                data: {
                    costPerUnit: newCostPerUnit,
                    totalCost: bom.quantity * newCostPerUnit
                }
            });
        }

        // 3. Find unique Product IDs affected
        const productIds = boms.map((b: any) => b.productId).filter(Boolean);
        const uniqueProductIds = [...new Set(productIds)];

        // 4. Recalculate standardCost for each affected product
        for (const productId of uniqueProductIds) {
            // Get all BOMs for this product to sum them up
            const allProductBoms = await db.billOfMaterial.findMany({
                where: { productId }
            });
            
            const newStandardCost = allProductBoms.reduce((sum: number, b: any) => sum + Number(b.totalCost), 0);

            // Update ProductCatalog
            await db.productCatalog.update({
                where: { id: productId },
                data: {
                    standardCost: newStandardCost
                }
            });
        }
        
        console.log(`Synced product costs for material: ${materialName}. Updated ${uniqueProductIds.length} products.`);
    } catch (error) {
        console.error(`Failed to sync product costs for material ${materialName}:`, error);
        // We don't throw to avoid breaking the main purchase flow, just log it.
    }
}
