// seed_employees.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';

const employeesToSeed = [
    {
        fullName: 'qoordheere',
        phone: '0999210800',
        monthlySalary: 7000,
        role: 'Worker'
    },
    {
        fullName: 'Aadan',
        phone: '0913171449',
        monthlySalary: 7000,
        role: 'Worker'
    },
    {
        fullName: 'Abshir',
        phone: '0915109215',
        monthlySalary: 7000,
        role: 'Worker'
    },
    {
        fullName: 'Xasan',
        phone: '0915443399',
        monthlySalary: 20000,
        role: 'Worker'
    },
    {
        fullName: 'Abdiqadir Nuuriye',
        phone: '0980331088',
        monthlySalary: 9000,
        role: 'Worker'
    },
    {
        fullName: 'Zakariye Dambeeye',
        phone: '0909666499',
        monthlySalary: 5000,
        role: 'Worker'
    },
    {
        fullName: 'Muhiyadiin Moalin',
        phone: '0915469812',
        monthlySalary: 30000,
        role: 'Worker'
    }
];

async function main() {
    console.log('Starting employee seeding...');

    for (const emp of employeesToSeed) {
        // Search by case-insensitive name similarity or exact name
        const existing = await prisma.employee.findFirst({
            where: {
                companyId: COMPANY_ID,
                fullName: { equals: emp.fullName, mode: 'insensitive' }
            }
        });

        if (existing) {
            console.log(`Updating existing employee: ${emp.fullName} (ID: ${existing.id})`);
            await prisma.employee.update({
                where: { id: existing.id },
                data: {
                    phone: emp.phone,
                    monthlySalary: emp.monthlySalary,
                    role: emp.role,
                    isActive: true
                }
            });
        } else {
            console.log(`Creating new employee: ${emp.fullName}`);
            await prisma.employee.create({
                data: {
                    fullName: emp.fullName,
                    phone: emp.phone,
                    monthlySalary: emp.monthlySalary,
                    role: emp.role,
                    isActive: true,
                    companyId: COMPANY_ID
                }
            });
        }
    }

    console.log('Seeding completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
