/*
  Warnings:

  - Made the column `companyId` on table `expenses` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `companyId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_companyId_fkey";

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
