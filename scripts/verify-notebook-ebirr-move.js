require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
  const [accounts, sales, transfers] = await Promise.all([
    prisma.account.findMany({ where: { companyId }, select: { name: true, balance: true, isActive: true } }),
    prisma.sale.findMany({ where: { companyId, invoiceNumber: { startsWith: 'AN-NB-202609' } }, select: { invoiceNumber: true, account: { select: { name: true } }, paidAmount: true, paymentStatus: true } }),
    prisma.transaction.findMany({ where: { companyId, description: { contains: '[NOTEBOOK-E-BIRR-MOVE]' } }, select: { type: true, amount: true, account: { select: { name: true } } } })
  ]);
  const result = {
    accounts,
    notebookSales: sales.length,
    salesLinkedToEbirr: sales.every(s => s.account.name.toLowerCase() === 'e-birr'),
    fullyPaidTotal: sales.reduce((sum, s) => sum + Number(s.paidAmount), 0),
    transfers
  };
  if (sales.length !== 14 || !result.salesLinkedToEbirr || result.fullyPaidTotal !== 825500 || transfers.length !== 2 || !accounts.some(a => a.name.toLowerCase() === 'e-birr' && a.isActive && Number(a.balance) === 825500)) throw new Error('E-birr move verification failed.');
  console.log(JSON.stringify(result, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
