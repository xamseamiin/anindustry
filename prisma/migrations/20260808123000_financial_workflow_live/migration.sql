-- Additive live migration for the Telegram expense/payment workflow.
-- Existing financial records and balances are intentionally left unchanged.

ALTER TABLE "accounts"
  ADD COLUMN IF NOT EXISTS "reservedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "workflowStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "reservedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptTransactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "balanceBefore" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "balanceAfter" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "reversedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reversalOfId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "expenses_idempotencyKey_key" ON "expenses"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "expenses_receiptTransactionId_key" ON "expenses"("receiptTransactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

CREATE TABLE IF NOT EXISTS "account_reservations" (
  "_id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "account_reservations_pkey" PRIMARY KEY ("_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "account_reservations_expenseId_key" ON "account_reservations"("expenseId");
CREATE INDEX IF NOT EXISTS "account_reservations_companyId_accountId_status_idx" ON "account_reservations"("companyId", "accountId", "status");

CREATE TABLE IF NOT EXISTS "receipt_sessions" (
  "_id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "expenseId" TEXT,
  "materialPurchaseId" TEXT,
  "telegramUserId" TEXT NOT NULL,
  "telegramChatId" TEXT NOT NULL,
  "telegramMessageId" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'AWAITING_UPLOAD',
  "receiptFileId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "receipt_sessions_pkey" PRIMARY KEY ("_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "receipt_sessions_idempotencyKey_key" ON "receipt_sessions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "receipt_sessions_telegramChatId_telegramUserId_status_idx" ON "receipt_sessions"("telegramChatId", "telegramUserId", "status");
CREATE INDEX IF NOT EXISTS "receipt_sessions_expenseId_status_idx" ON "receipt_sessions"("expenseId", "status");

CREATE TABLE IF NOT EXISTS "receipt_verifications" (
  "_id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL,
  "receiptFileId" TEXT,
  "transactionReference" TEXT,
  "expectedAmount" DECIMAL(12,2) NOT NULL,
  "extractedAmount" DECIMAL(12,2),
  "expectedPhone" TEXT,
  "extractedPhone" TEXT,
  "expectedRecipient" TEXT,
  "extractedRecipient" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "confidence" DOUBLE PRECISION,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  CONSTRAINT "receipt_verifications_pkey" PRIMARY KEY ("_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "receipt_verifications_transactionReference_key" ON "receipt_verifications"("transactionReference");
CREATE INDEX IF NOT EXISTS "receipt_verifications_companyId_status_idx" ON "receipt_verifications"("companyId", "status");
CREATE INDEX IF NOT EXISTS "receipt_verifications_expenseId_idx" ON "receipt_verifications"("expenseId");

CREATE TABLE IF NOT EXISTS "idempotency_records" (
  "_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "companyId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "requestHash" TEXT,
  "response" JSONB,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_records_key_key" ON "idempotency_records"("key");
CREATE INDEX IF NOT EXISTS "idempotency_records_scope_companyId_idx" ON "idempotency_records"("scope", "companyId");

CREATE TABLE IF NOT EXISTS "financial_audit_events" (
  "_id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorName" TEXT,
  "actorSource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_audit_events_pkey" PRIMARY KEY ("_id")
);
CREATE INDEX IF NOT EXISTS "financial_audit_events_companyId_createdAt_idx" ON "financial_audit_events"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "financial_audit_events_entity_entityId_idx" ON "financial_audit_events"("entity", "entityId");

-- Existing unpaid requests should enter the receipt workflow without changing money.
UPDATE "expenses"
SET "workflowStatus" = CASE
  WHEN "paymentStatus" = 'PAID' THEN 'PAID'
  WHEN "approved" = TRUE THEN 'AWAITING_RECEIPT'
  ELSE 'DRAFT'
END
WHERE "workflowStatus" = 'DRAFT';
