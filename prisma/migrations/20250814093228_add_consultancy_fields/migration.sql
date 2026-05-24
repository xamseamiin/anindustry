/*
  Warnings:

  - You are about to drop the column `equipmentName` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `rentalCost` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `rentalPeriod` on the `expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "equipmentName",
DROP COLUMN "rentalCost",
DROP COLUMN "rentalPeriod",
ADD COLUMN     "consultancyFee" DECIMAL(12,2),
ADD COLUMN     "consultancyType" TEXT,
ADD COLUMN     "consultantName" TEXT;
