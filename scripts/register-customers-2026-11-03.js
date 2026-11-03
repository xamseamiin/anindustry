require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const customers = [
  ['Yuusuf Keela', '0914642333'],
  ['Abdirahman Jibriga', '0956568422'],
  ['Mukhtaar Caagado', '0968311394'],
  ['Sh Abdifitah Gadhwayne', '0915016053'],
  ['Maxamuud Badiici', '0915442266'],
  ['Abdiqani Badiici', '0915638444'],
  ['Alaale Badiici', '0915774703'],
  ['Adde Badiici', '0915063573'],
  ['Qasaale', '0915157863'],
  ['Farax Wali', '0954003701'],
  ['Maxamad Dhay Geel', '0946868962'],
  ['Waabari Hotel', '0943920792'],
  ['Abdirashid Keela', '0963917517'],
  ['Ahmad Nur Lafaciise', '0915784870'],
];

(async () => {
  const rows = [];
  for (const [name, phone] of customers) {
    const row = await prisma.customer.upsert({
      where: { name_companyId: { name, companyId } },
      update: { phone, phoneNumber: phone },
      create: { name, phone, phoneNumber: phone, companyId, type: 'Individual' },
      select: { id: true, name: true, phone: true, phoneNumber: true },
    });
    rows.push(row);
  }
  console.log(JSON.stringify({ count: rows.length, customers: rows }, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
