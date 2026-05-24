/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "accounts_name_key";

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "monthlySalary" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_name_companyId_key" ON "accounts"("name", "companyId");
