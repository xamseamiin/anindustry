ALTER TABLE "telegram_app_users" ADD COLUMN "manageExpenses" BOOLEAN NOT NULL DEFAULT false;

UPDATE "telegram_app_users"
SET "manageExpenses" = true
WHERE "isAdmin" = true;
