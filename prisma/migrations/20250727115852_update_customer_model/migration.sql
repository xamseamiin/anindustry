/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "customers_name_companyId_key" ON "customers"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_name_companyId_key" ON "inventory_items"("name", "companyId");
