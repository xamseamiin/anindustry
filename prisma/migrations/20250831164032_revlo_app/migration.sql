/*
  Warnings:

  - You are about to drop the column `employeeName` on the `project_labor` table. All the data in the column will be lost.
  - You are about to drop the column `workDescription` on the `project_labor` table. All the data in the column will be lost.
  - Added the required column `paidFrom` to the `project_labor` table without a default value. This is not possible if the table is not empty.
  - Made the column `employeeId` on table `project_labor` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."project_labor" DROP CONSTRAINT "project_labor_employeeId_fkey";

-- AlterTable
ALTER TABLE "public"."project_labor" DROP COLUMN "employeeName",
DROP COLUMN "workDescription",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "paidFrom" TEXT NOT NULL,
ADD COLUMN     "previousPaidAmount" DECIMAL(10,2),
ALTER COLUMN "agreedWage" DROP NOT NULL,
ALTER COLUMN "remainingWage" DROP NOT NULL,
ALTER COLUMN "employeeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."project_labor" ADD CONSTRAINT "project_labor_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
