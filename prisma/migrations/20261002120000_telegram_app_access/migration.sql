CREATE TABLE "telegram_app_users" (
    "_id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "viewDashboard" BOOLEAN NOT NULL DEFAULT true,
    "viewTransactions" BOOLEAN NOT NULL DEFAULT false,
    "addExpense" BOOLEAN NOT NULL DEFAULT true,
    "viewSales" BOOLEAN NOT NULL DEFAULT false,
    "addSales" BOOLEAN NOT NULL DEFAULT false,
    "viewProduction" BOOLEAN NOT NULL DEFAULT false,
    "addProduction" BOOLEAN NOT NULL DEFAULT false,
    "viewReports" BOOLEAN NOT NULL DEFAULT false,
    "viewProfile" BOOLEAN NOT NULL DEFAULT true,
    "manageUsers" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_app_users_pkey" PRIMARY KEY ("_id")
);

CREATE UNIQUE INDEX "telegram_app_users_companyId_telegramId_key" ON "telegram_app_users"("companyId", "telegramId");
CREATE INDEX "telegram_app_users_companyId_isActive_idx" ON "telegram_app_users"("companyId", "isActive");
ALTER TABLE "telegram_app_users" ADD CONSTRAINT "telegram_app_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
