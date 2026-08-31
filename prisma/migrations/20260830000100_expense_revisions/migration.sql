CREATE TABLE "expense_revisions" (
  "_id" TEXT PRIMARY KEY, "companyId" TEXT NOT NULL, "expenseId" TEXT NOT NULL,
  "version" INTEGER NOT NULL, "requestId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL', "reason" TEXT NOT NULL,
  "actorId" TEXT NOT NULL, "actorName" TEXT NOT NULL,
  "before" JSONB NOT NULL, "proposed" JSONB NOT NULL, "payments" JSONB NOT NULL,
  "changes" JSONB NOT NULL, "material" BOOLEAN NOT NULL,
  "approvedBy" TEXT, "receiptUrl" TEXT, "receiptRef" TEXT,
  "settlementMode" TEXT, "confirmedBy" TEXT,
  "syncStatus" TEXT NOT NULL DEFAULT 'PENDING', "messageId" INTEGER,
  "originalSynced" BOOLEAN NOT NULL DEFAULT FALSE, "chatId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "expense_revisions_requestId_key" ON "expense_revisions"("requestId");
CREATE UNIQUE INDEX "expense_revisions_expenseId_version_key" ON "expense_revisions"("expenseId", "version");
CREATE UNIQUE INDEX "expense_revisions_receiptRef_key" ON "expense_revisions"("receiptRef");
CREATE INDEX "expense_revisions_companyId_status_idx" ON "expense_revisions"("companyId", "status");
-- Only one open proposal per expense, including concurrent requests.
CREATE UNIQUE INDEX "expense_revisions_one_open" ON "expense_revisions"("expenseId")
WHERE "status" IN ('PENDING_APPROVAL','AWAITING_RECEIPT','RECEIPT_REVIEW');
