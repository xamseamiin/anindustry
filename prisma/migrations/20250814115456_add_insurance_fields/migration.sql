-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "insuranceAmount" DECIMAL(12,2),
ADD COLUMN     "insuranceCompany" TEXT,
ADD COLUMN     "insuranceType" TEXT;
