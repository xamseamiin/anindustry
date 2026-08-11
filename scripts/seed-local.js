const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

if (!String(process.env.DATABASE_URL || '').includes('127.0.0.1:55432')) {
  throw new Error('seed-local refuses to run unless DATABASE_URL points to local port 55432.');
}

const prisma = new PrismaClient();
const companyId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000002';

async function main() {
  await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: { id: companyId, name: 'AN-Industory Local Lab', industry: 'Manufacturing', planType: 'ENTERPRISE' }
  });
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      companyId,
      email: 'hamse.local@anindustry.test',
      password: await bcrypt.hash('LocalOnly-123!', 10),
      fullName: 'Hamse Moalin',
      role: 'ADMIN',
      phone: '0000000000'
    }
  });
  const account = await prisma.account.upsert({
    where: { name_companyId: { name: 'E-Birr Merchant', companyId } },
    update: {},
    create: { companyId, name: 'E-Birr Merchant', balance: 50000, currency: 'ETB', type: 'MOBILE_MONEY', description: 'Local test account' }
  });
  const categories = [
    ['Bixinta Mushaharka (Salary)', 'SALARY'],
    ['Dalabka Raw Material', 'RAW_MATERIAL'],
    ['Consultancy & Service', 'SERVICE'],
    ['Equipment Rental', 'RENTAL'],
    ['Maintenance', 'MAINTENANCE'],
    ['Transport & Fuel', 'TRANSPORT'],
    ['Bills', 'BILLS']
  ];
  for (const [name, type] of categories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: { companyId, type },
      create: { companyId, name, type, description: `${name} local testing` }
    });
  }
  await prisma.employee.upsert({
    where: { email: 'qordheere.local@anindustry.test' },
    update: {},
    create: { companyId, fullName: 'qordheere', email: 'qordheere.local@anindustry.test', role: 'Worker', monthlySalary: 7000, phone: '0967025001' }
  });
  console.log(JSON.stringify({ companyId, userId, accountId: account.id }, null, 2));
}

main().finally(() => prisma.$disconnect());
