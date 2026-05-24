/*
  Warnings:

  - You are about to alter the column `balance` on the `accounts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to drop the column `user` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `fromAccountId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `toAccountId` on the `transactions` table. All the data in the column will be lost.
  - Changed the type of `type` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."FiscalYearStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_fromAccountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_toAccountId_fkey";

-- AlterTable
ALTER TABLE "public"."accounts" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "balance" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "department" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "position" TEXT;

-- AlterTable
ALTER TABLE "public"."expenses" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "fiscalYearId" TEXT,
ADD COLUMN     "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "user",
ADD COLUMN     "userDisplayName" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "budget" DECIMAL(12,2),
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "fiscalYearId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "fromAccountId",
DROP COLUMN "toAccountId",
ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."vendors" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- DropEnum
DROP TYPE "public"."AccountType";

-- CreateTable
CREATE TABLE "public"."personalization_settings" (
    "_id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'so',
    "defaultHomePage" TEXT NOT NULL DEFAULT '/dashboard',
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "tableDensity" TEXT NOT NULL DEFAULT 'comfortable',
    "avatarColor" TEXT NOT NULL DEFAULT '#3498DB',
    "customFont" TEXT NOT NULL DEFAULT 'Inter',
    "notificationSound" TEXT NOT NULL DEFAULT 'default',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "textSize" TEXT NOT NULL DEFAULT 'medium',
    "defaultExportFormat" TEXT NOT NULL DEFAULT 'CSV',
    "notifications" JSONB NOT NULL DEFAULT '{"email": true, "inApp": true, "sms": false, "lowStock": true, "overdueProjects": true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalization_settings_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."product_catalog" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "standardCost" DECIMAL(10,2) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "product_catalog_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."production_orders" (
    "_id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "productId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."bill_of_materials" (
    "_id" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "costPerUnit" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "productId" TEXT,

    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."work_orders" (
    "_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "description" TEXT,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "actualHours" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "assignedToId" TEXT,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."fiscal_years" (
    "_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."FiscalYearStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."material_purchases" (
    "_id" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "vendorId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "productionOrderId" TEXT,
    "fiscalYearId" TEXT,

    CONSTRAINT "material_purchases_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."cost_tracking" (
    "_id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "actualMaterialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualLaborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overheadCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "cost_tracking_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."manufacturing_used" (
    "_id" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "costPerUnit" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "usedDate" TIMESTAMP(3) NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "projectId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "manufacturing_used_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."chat_rooms" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'company',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."chat_members" (
    "_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."chat_files" (
    "_id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT,
    "chatRoomId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "chat_files_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."chat_reactions" (
    "_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "chat_reactions_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personalization_settings_companyId_key" ON "public"."personalization_settings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "product_catalog_name_companyId_key" ON "public"."product_catalog"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_year_key" ON "public"."fiscal_years"("year");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_year_companyId_key" ON "public"."fiscal_years"("year", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_tracking_productionOrderId_key" ON "public"."cost_tracking"("productionOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_userId_chatRoomId_key" ON "public"."chat_members"("userId", "chatRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_reactions_messageId_userId_key" ON "public"."chat_reactions"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."fiscal_years"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."fiscal_years"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."fiscal_years"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."fiscal_years"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personalization_settings" ADD CONSTRAINT "personalization_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_catalog" ADD CONSTRAINT "product_catalog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_orders" ADD CONSTRAINT "production_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_orders" ADD CONSTRAINT "production_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_orders" ADD CONSTRAINT "production_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product_catalog"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_orders" ADD CONSTRAINT "production_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_of_materials" ADD CONSTRAINT "bill_of_materials_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_of_materials" ADD CONSTRAINT "bill_of_materials_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."production_orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_of_materials" ADD CONSTRAINT "bill_of_materials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product_catalog"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_orders" ADD CONSTRAINT "work_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_orders" ADD CONSTRAINT "work_orders_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."production_orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_orders" ADD CONSTRAINT "work_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."employees"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_years" ADD CONSTRAINT "fiscal_years_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_purchases" ADD CONSTRAINT "material_purchases_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_purchases" ADD CONSTRAINT "material_purchases_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_purchases" ADD CONSTRAINT "material_purchases_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."production_orders"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_purchases" ADD CONSTRAINT "material_purchases_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."fiscal_years"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_tracking" ADD CONSTRAINT "cost_tracking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_tracking" ADD CONSTRAINT "cost_tracking_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."production_orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manufacturing_used" ADD CONSTRAINT "manufacturing_used_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manufacturing_used" ADD CONSTRAINT "manufacturing_used_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."production_orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manufacturing_used" ADD CONSTRAINT "manufacturing_used_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_rooms" ADD CONSTRAINT "chat_rooms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "public"."chat_rooms"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "public"."chat_rooms"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_files" ADD CONSTRAINT "chat_files_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."chat_messages"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_files" ADD CONSTRAINT "chat_files_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "public"."chat_rooms"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_files" ADD CONSTRAINT "chat_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_reactions" ADD CONSTRAINT "chat_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."chat_messages"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_reactions" ADD CONSTRAINT "chat_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
