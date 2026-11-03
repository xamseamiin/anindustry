require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COMPANY_ID = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const EMPLOYEE_ID = '784c58ee-47bc-496d-abf0-820f58971efb';
const ACCOUNT_ID = '9d60b28e-52b7-4ffa-9c05-fd52880531ba';
const SOURCE_MARKER = '[CISMAAN-INSTALLATION-SPLIT-2026-09-09]';
const TARGET_MARKER = '[CISMAAN-LABOR-MIGRATION-2026-09-09]';
const apply = process.argv.includes('--apply');

async function getState() {
  const [employee, account, expenses, transactions, laborRecords] = await Promise.all([
    prisma.employee.findUnique({ where: { id: EMPLOYEE_ID } }),
    prisma.account.findUnique({ where: { id: ACCOUNT_ID } }),
    prisma.expense.findMany({
      where: { companyId: COMPANY_ID, employeeId: EMPLOYEE_ID, note: { contains: SOURCE_MARKER } },
      include: { transactions: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.transaction.findMany({
      where: { companyId: COMPANY_ID, employeeId: EMPLOYEE_ID, note: { contains: SOURCE_MARKER } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.companyLabor.findMany({
      where: { companyId: COMPANY_ID, employeeId: EMPLOYEE_ID, description: { contains: TARGET_MARKER } },
    }),
  ]);
  return { employee, account, expenses, transactions, laborRecords };
}

function sumAmounts(records) {
  return records.reduce((sum, record) => sum + Number(record.amount ?? record.paidAmount), 0);
}

function validate(state) {
  if (!state.employee) throw new Error('Cismaan employee record was not found.');
  if (!state.account) throw new Error('Main Cash / Khasnadda was not found.');
  if (Math.abs(Number(state.account.balance)) > 0.01) throw new Error(`Main Cash must remain zero; found ${state.account.balance}.`);
  if (state.laborRecords.length) throw new Error('These Cismaan records were already moved to Company Labor.');
  if (state.expenses.length !== 4 || state.transactions.length !== 4) {
    throw new Error(`Expected 4 expenses and 4 transactions; found ${state.expenses.length} and ${state.transactions.length}.`);
  }
  if (Math.abs(sumAmounts(state.expenses) - 103_450) > 0.01) throw new Error('Expense total is not 103,450.');
  if (Math.abs(sumAmounts(state.transactions) - 103_450) > 0.01) throw new Error('Transaction total is not 103,450.');
  if (Number(state.employee.monthlySalary || 0) !== 0 || Number(state.employee.salaryPaidThisMonth || 0) !== 0) {
    throw new Error('Cismaan salary fields must remain zero.');
  }
}

async function main() {
  const before = await getState();
  validate(before);

  const plan = {
    apply,
    employee: before.employee.fullName,
    action: 'Move 4 linked expenses to Company Labor records; retain 4 financial transactions without Expense links.',
    expenseTotal: sumAmounts(before.expenses),
    transactionTotal: sumAmounts(before.transactions),
    accountBalance: before.account.balance,
    salaryBefore: before.employee.monthlySalary,
    salaryPaidBefore: before.employee.salaryPaidThisMonth,
    records: before.expenses.map((expense) => ({
      description: expense.description,
      amount: Number(expense.amount),
      date: expense.expenseDate,
    })),
  };

  if (!apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `cismaan-expenses-to-labor-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), sourceMarker: SOURCE_MARKER, targetMarker: TARGET_MARKER, before, plan }, null, 2));

  const result = await prisma.$transaction(async (tx) => {
    const createdLabor = [];

    for (const expense of before.expenses) {
      const amount = Number(expense.amount);
      const cleanDescription = expense.description.replace(SOURCE_MARKER, '').trim();
      const labor = await tx.companyLabor.create({
        data: {
          companyId: COMPANY_ID,
          employeeId: EMPLOYEE_ID,
          agreedWage: amount,
          paidAmount: amount,
          remainingWage: 0,
          previousPaidAmount: 0,
          dateWorked: expense.expenseDate,
          paidFrom: 'Main Cash / Khasnadda',
          description: `${cleanDescription}. Lacagta waa la siiyay; mushahar ma aha. ${TARGET_MARKER}`,
        },
      });
      createdLabor.push(labor);

      for (const transaction of expense.transactions) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            expenseId: null,
            employeeId: EMPLOYEE_ID,
            category: 'Employee Work Payment / Shaqo Gaar ah',
            note: `${transaction.note || ''} Waxaa laga wareejiyay Expenses loona raray Cismaan Labor History. ${TARGET_MARKER}`.trim(),
          },
        });
      }
    }

    await tx.expense.deleteMany({
      where: { id: { in: before.expenses.map((expense) => expense.id) }, companyId: COMPANY_ID },
    });

    const employee = await tx.employee.update({
      where: { id: EMPLOYEE_ID },
      data: { monthlySalary: 0, salaryPaidThisMonth: 0 },
    });
    const account = await tx.account.findUnique({ where: { id: ACCOUNT_ID } });
    if (!account || Math.abs(Number(account.balance)) > 0.01) throw new Error('Main Cash balance changed during migration.');

    return {
      createdLaborIds: createdLabor.map((record) => record.id),
      deletedExpenseIds: before.expenses.map((expense) => expense.id),
      retainedTransactionIds: before.transactions.map((transaction) => transaction.id),
      employee,
      accountBalance: account.balance,
    };
  }, { maxWait: 10_000, timeout: 30_000 });

  const [afterExpenses, afterLabor, afterTransactions, employeeAfter, accountAfter] = await Promise.all([
    prisma.expense.findMany({ where: { companyId: COMPANY_ID, employeeId: EMPLOYEE_ID, note: { contains: SOURCE_MARKER } } }),
    prisma.companyLabor.findMany({ where: { companyId: COMPANY_ID, employeeId: EMPLOYEE_ID, description: { contains: TARGET_MARKER } }, orderBy: { dateWorked: 'asc' } }),
    prisma.transaction.findMany({ where: { companyId: COMPANY_ID, employeeId: EMPLOYEE_ID, note: { contains: TARGET_MARKER } }, orderBy: { createdAt: 'asc' } }),
    prisma.employee.findUnique({ where: { id: EMPLOYEE_ID } }),
    prisma.account.findUnique({ where: { id: ACCOUNT_ID }, select: { name: true, balance: true } }),
  ]);

  console.log(JSON.stringify({
    success: true,
    backupPath,
    result,
    verification: {
      remainingSourceExpenses: afterExpenses.length,
      laborRecordCount: afterLabor.length,
      laborPaidTotal: afterLabor.reduce((sum, record) => sum + Number(record.paidAmount), 0),
      retainedTransactionCount: afterTransactions.length,
      retainedTransactionTotal: afterTransactions.reduce((sum, record) => sum + Number(record.amount), 0),
      monthlySalary: employeeAfter.monthlySalary,
      salaryPaidThisMonth: employeeAfter.salaryPaidThisMonth,
      accountAfter,
    },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
