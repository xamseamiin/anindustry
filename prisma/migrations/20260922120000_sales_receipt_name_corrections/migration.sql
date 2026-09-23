CREATE TABLE "sales_receipt_corrections" (
  "_id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "observedName" TEXT NOT NULL,
  "normalizedObservedName" TEXT NOT NULL,
  "correctedCustomerName" TEXT NOT NULL,
  "correctionCount" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sales_receipt_corrections_pkey" PRIMARY KEY ("_id")
);

CREATE UNIQUE INDEX "sales_receipt_corrections_companyId_normalizedObservedName_key"
  ON "sales_receipt_corrections"("companyId", "normalizedObservedName");
CREATE INDEX "sales_receipt_corrections_companyId_idx"
  ON "sales_receipt_corrections"("companyId");

ALTER TABLE "sales_receipt_corrections"
  ADD CONSTRAINT "sales_receipt_corrections_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
