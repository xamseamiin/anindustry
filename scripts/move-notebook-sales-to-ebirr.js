require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';

async function main() {
  const result = await prisma.$transaction(async tx => {
    const [source, destination, sales] = await Promise.all([
      tx.account.findFirst({ where: { companyId, name: 'E-Birr Merchant', isActive: true } }),
      tx.account.findFirst({ where: { companyId, name: { equals: 'E-birr', mode: 'insensitive' } } }),
      tx.sale.findMany({ where: { companyId, invoiceNumber: { startsWith: 'AN-NB-202609' } }, include: { paymentAllocations: true } })
    ]);
    if (!source || !destination || source.id === destination.id) throw new Error('Correct source/destination accounts not found.');
    if (sales.length !== 14 || sales.some(s => Number(s.paidAmount) !== Number(s.total) || s.paymentStatus !== 'Paid' || s.paymentAllocations.length || !s.notes?.includes('[SEPTEMBER-NOTEBOOK-2026]') || s.accountId !== source.id)) throw new Error('Notebook sales differ from the reviewed batch; no changes applied.');
    const saleTransactions = await tx.transaction.findMany({ where: { companyId, type: 'INCOME', description: { startsWith: 'Iibka AN-NB-202609' } }, orderBy: { description: 'asc' } });
    if (saleTransactions.length !== 14 || saleTransactions.some(t => t.accountId !== source.id || Number(t.amount) !== Number(sales.find(s => 'Iibka ' + s.invoiceNumber === t.description)?.paidAmount))) throw new Error('Sale income ledger mismatch; no changes applied.');
    const total = sales.reduce((sum, s) => sum + Number(s.paidAmount), 0);
    if (Math.abs(total - 825500) > 0.001 || Number(source.balance) + 0.001 < total) throw new Error('Source balance is insufficient or batch total changed.');
    const priorMove = await tx.transaction.findMany({ where: { companyId, description: { contains: '[NOTEBOOK-E-BIRR-MOVE]' } } });
    if (priorMove.length) throw new Error('Previous correction already recorded.');
    const userId = sales[0].userId;
    const date = new Date('2026-09-20T12:00:00+03:00');
    await tx.account.update({ where: { id: source.id }, data: { balance: { decrement: total } } });
    await tx.account.update({ where: { id: destination.id }, data: { balance: { increment: total }, isActive: true } });
    await tx.sale.updateMany({ where: { id: { in: sales.map(s => s.id) }, companyId }, data: { accountId: destination.id } });
    await tx.transaction.updateMany({ where: { id: { in: saleTransactions.map(t => t.id) }, companyId }, data: { accountId: destination.id } });
    await tx.auditLog.create({ data: { companyId, userId, action: 'RECLASSIFY_NOTEBOOK_SALES_TO_EBIRR', entity: 'Account', entityId: destination.id, details: JSON.stringify({ amount: total, source: source.name, destination: destination.name, saleIds: sales.map(s => s.id), transactionIds: saleTransactions.map(t => t.id), activatedAccount: !destination.isActive, note: 'Corrects internal account attribution; does not assert an external cash transfer.' }) } });
    return { amount: total, source: source.name, destination: destination.name, salesMoved: sales.length, saleIncomesMoved: saleTransactions.length, accountActivated: !destination.isActive, before: { source: Number(source.balance), destination: Number(destination.balance) } };
  }, { isolationLevel: 'Serializable', timeout: 30000 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
