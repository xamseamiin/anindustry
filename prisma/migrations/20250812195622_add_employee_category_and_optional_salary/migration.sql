-- CreateEnum
CREATE TYPE "EmployeeCategory" AS ENUM ('COMPANY', 'PROJECT');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "category" "EmployeeCategory" NOT NULL DEFAULT 'COMPANY',
ALTER COLUMN "monthlySalary" DROP NOT NULL;
