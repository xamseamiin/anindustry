-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "customerId" TEXT;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
