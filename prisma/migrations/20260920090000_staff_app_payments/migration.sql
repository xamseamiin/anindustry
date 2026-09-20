-- Incoming account payments are held independently until a cashier allocates
-- them to a sale. This prevents a bank/SMS payment from being counted twice.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CASHIER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SALES';

CREATE TABLE "staff_devices" (
  "_id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceFingerprint" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'ANDROID',
  "role" TEXT NOT NULL DEFAULT 'STAFF',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "smsReaderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "apiTokenHash" TEXT,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "staff_devices_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE "incoming_payments" (
  "_id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "deviceId" TEXT,
  "provider" TEXT NOT NULL,
  "providerReference" TEXT NOT NULL,
  "senderName" TEXT,
  "senderPhone" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "allocatedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
  "messageHash" TEXT,
  "receiptUrl" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "incoming_payments_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE "sale_payment_allocations" (
  "_id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "incomingPaymentId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_payment_allocations_pkey" PRIMARY KEY ("_id")
);

CREATE UNIQUE INDEX "staff_devices_companyId_deviceFingerprint_key" ON "staff_devices"("companyId", "deviceFingerprint");
CREATE UNIQUE INDEX "staff_devices_apiTokenHash_key" ON "staff_devices"("apiTokenHash");
CREATE INDEX "staff_devices_userId_isActive_idx" ON "staff_devices"("userId", "isActive");
CREATE UNIQUE INDEX "incoming_payments_companyId_provider_providerReference_key" ON "incoming_payments"("companyId", "provider", "providerReference");
CREATE UNIQUE INDEX "incoming_payments_messageHash_key" ON "incoming_payments"("messageHash");
CREATE INDEX "incoming_payments_companyId_status_receivedAt_idx" ON "incoming_payments"("companyId", "status", "receivedAt");
CREATE INDEX "incoming_payments_accountId_receivedAt_idx" ON "incoming_payments"("accountId", "receivedAt");
CREATE INDEX "sale_payment_allocations_saleId_idx" ON "sale_payment_allocations"("saleId");
CREATE INDEX "sale_payment_allocations_incomingPaymentId_idx" ON "sale_payment_allocations"("incomingPaymentId");

ALTER TABLE "staff_devices" ADD CONSTRAINT "staff_devices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_devices" ADD CONSTRAINT "staff_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incoming_payments" ADD CONSTRAINT "incoming_payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incoming_payments" ADD CONSTRAINT "incoming_payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incoming_payments" ADD CONSTRAINT "incoming_payments_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "staff_devices"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_payment_allocations" ADD CONSTRAINT "sale_payment_allocations_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_payment_allocations" ADD CONSTRAINT "sale_payment_allocations_incomingPaymentId_fkey" FOREIGN KEY ("incomingPaymentId") REFERENCES "incoming_payments"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
