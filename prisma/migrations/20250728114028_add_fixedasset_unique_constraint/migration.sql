/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `fixed_assets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_name_companyId_key" ON "fixed_assets"("name", "companyId");
