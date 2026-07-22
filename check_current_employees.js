// check_current_employees.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const employees = await prisma.employee.findMany({
        where: { isActive: true }
    });
    console.log('--- Current Active Employees ---');
    for (const emp of employees) {
        console.log(`ID: ${emp.id}, Name: ${emp.fullName}, Salary: ${emp.baseSalary}, Phone: ${emp.phone}, CompanyId: ${emp.companyId}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
