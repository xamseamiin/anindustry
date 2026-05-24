/*
  Warnings:

  - Added the required column `companyId` to the `expense_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `expense_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expense_categories" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;
