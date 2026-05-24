/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "vendors_name_companyId_key" ON "vendors"("name", "companyId");
