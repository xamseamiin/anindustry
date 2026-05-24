/*
  Warnings:

  - You are about to drop the column `insuranceAmount` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceCompany` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceType` on the `expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "insuranceAmount",
DROP COLUMN "insuranceCompany",
DROP COLUMN "insuranceType",
ADD COLUMN     "bankAccountId" TEXT,
ADD COLUMN     "equipmentName" TEXT,
ADD COLUMN     "rentalFee" DOUBLE PRECISION,
ADD COLUMN     "rentalPeriod" TEXT,
ADD COLUMN     "supplierName" TEXT;
