require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COMPANY_ID = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const CUSTOMER_ID = '883ffa21-3188-4d5d-a85d-faf5fadbd55b';
const ACCOUNT_ID = '9d60b28e-52b7-4ffa-9c05-fd52880531ba';
const ORIGINAL_EXPENSE_ID = '1a9e1247-4f25-4d97-b609-9e02646b7397';
const ORIGINAL_TRANSACTION_ID = '0ca5ca52-629e-41d0-9365-9f2859db08a6';
const MARKER = '[CISMAAN-INSTALLATION-SPLIT-2026-09-09]';
const apply = process.argv.includes('--apply');
const expenseDate = new Date('2026-09-09T09:00:00+03:00');

const parts = [
  {
    amount: -8_000,
    category: 'Installation Payment Adjustment',
    description: 'Ka-jaris: 8,000 ETB oo system-ka hore looga bixiyay',
    note: 'Adjustment-ka kharashka Cismaan; wuxuu wadarta 111,450 ka dhigaya 103,450 ETB.',
  },
  {
    amount: 9_350,
    category: 'Spare Parts / Qalab Rakibid',
    description: 'Spare part $50 — rakibidda warshadda',
    note: 'Qayb ka mid ah kharashkii Cismaan ee rakibidda; qiimaha xaashida 9,350 ETB.',
  },
  {
    amount: 56_100,
    category: 'Installation Contractor Payment',
    description: 'Lacagtii Cismaan $300 — rakibidda warshadda',
    note: 'Lacag shaqo/rakibid ah; mushahar bille ah ma aha.',
  },
  {
    amount: 46_000,
    category: 'Daily Installation Work / Yawmiyo',
    description: 'Yawmiyadii Cismaan — rakibidda warshadda',
    note: 'Qadarka xaashida lagu xaqiijiyay waa 46,000 ETB; mushahar bille ah ma aha.',
  },
];

const total = parts.reduce((sum, part) => sum + part.amount, 0);

async function getState() {
  const [account, customer, users, employees, originalExpense, originalTransaction, existingSplitExpenses, existingSplitTransactions] = await Promise.all([
    prisma.account.findUnique({ where: { id: ACCOUNT_ID } }),
    prisma.customer.findUnique({ where: { id: CUSTOMER_ID } }),
    prisma.user.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, fullName: true, status: true } }),
    prisma.employee.findMany({
      where: {
        companyId: COMPANY_ID,
        OR: [
          { fullName: { contains: 'cismaan', mode: 'insensitive' } },
          { fullName: { contains: 'osman', mode: 'insensitive' } },
        ],
      },
    }),
    prisma.expense.findUnique({ where: { id: ORIGINAL_EXPENSE_ID }, include: { transactions: true } }),
    prisma.transaction.findUnique({ where: { id: ORIGINAL_TRANSACTION_ID } }),
    prisma.expense.findMany({ where: { companyId: COMPANY_ID, note: { contains: MARKER } } }),
    prisma.transaction.findMany({ where: { companyId: COMPANY_ID, note: { contains: MARKER } } }),
  ]);
  return { account, customer, users, employees, originalExpense, originalTransaction, existingSplitExpenses, existingSplitTransactions };
}

function validate(state) {
  if (total !== 103_450) throw new Error(`Split total is ${total}, expected 103450.`);
  if (!state.account) throw new Error('Main Cash / Khasnadda was not found.');
  if (!state.customer) throw new Error('Sh. Cabdixakiim customer was not found.');
  if (Math.abs(Number(state.account.balance)) > 0.01) throw new Error(`Main Cash must remain zero; found ${state.account.balance}.`);
  if (state.existingSplitExpenses.length || state.existingSplitTransactions.length) throw new Error('Cismaan split has already been applied.');
  if (!state.originalExpense || !state.originalTransaction) throw new Error('Original 103,450 installation records were not found.');
  if (Number(state.originalExpense.amount) !== 103_450 || Number(state.originalTransaction.amount) !== 103_450) {
    throw new Error('Original installation amounts no longer match 103,450.');
  }
}

async function main() {
  const before = await getState();
  validate(before);

  const plan = {
    apply,
    account: { name: before.account.name, balance: before.account.balance },
    employeeAction: before.employees.length ? `Use existing employee ${before.employees[0].fullName}` : 'Create Cismaan with monthly salary 0',
    original: { expense: before.originalExpense, transaction: before.originalTransaction },
    split: parts,
    splitTotal: total,
    salaryEffect: 0,
  };

  if (!apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `cismaan-installation-split-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), marker: MARKER, before, plan }, null, 2));

  const user = before.users.find((entry) => entry.status === 'Active') || before.users[0];
  if (!user) throw new Error('No active company user was found.');

  const result = await prisma.$transaction(async (tx) => {
    let employee = before.employees[0];
    if (!employee) {
      employee = await tx.employee.create({
        data: {
          companyId: COMPANY_ID,
          fullName: 'Cismaan',
          role: 'Factory Installation Technician',
          position: 'Installer / Farsamo-yaqaan',
          department: 'Factory Installation & Maintenance',
          monthlySalary: 0,
          salaryPaidThisMonth: 0,
          productionRate: 0,
          isPercentageLinked: false,
          isActive: true,
          startDate: expenseDate,
        },
      });
    } else {
      employee = await tx.employee.update({
        where: { id: employee.id },
        data: {
          role: employee.role || 'Factory Installation Technician',
          position: employee.position || 'Installer / Farsamo-yaqaan',
          department: employee.department || 'Factory Installation & Maintenance',
          monthlySalary: 0,
          salaryPaidThisMonth: 0,
          isPercentageLinked: false,
          productionRate: 0,
          isActive: true,
        },
      });
    }

    await tx.transaction.delete({ where: { id: ORIGINAL_TRANSACTION_ID } });
    await tx.expense.delete({ where: { id: ORIGINAL_EXPENSE_ID } });

    let runningBalance = 103_450;
    const created = [];
    for (const part of parts) {
      const balanceBefore = runningBalance;
      runningBalance -= part.amount;
      const expense = await tx.expense.create({
        data: {
          companyId: COMPANY_ID,
          userId: user.id,
          employeeId: employee.id,
          customerId: CUSTOMER_ID,
          accountId: ACCOUNT_ID,
          description: `${part.description} ${MARKER}`,
          amount: part.amount,
          paidFrom: 'Main Cash / Khasnadda',
          expenseDate,
          category: part.category,
          note: `${part.note} ${MARKER}`,
          approved: true,
          workflowStatus: 'PAID',
          paymentStatus: 'PAID',
          paymentDate: expenseDate,
          approvedBy: user.id,
          approvedAt: expenseDate,
        },
      });
      const transaction = await tx.transaction.create({
        data: {
          companyId: COMPANY_ID,
          customerId: CUSTOMER_ID,
          employeeId: employee.id,
          userId: user.id,
          accountId: ACCOUNT_ID,
          expenseId: expense.id,
          amount: part.amount,
          type: 'EXPENSE',
          category: part.category,
          description: `${part.description} ${MARKER}`,
          note: `${part.note} ${MARKER}`,
          transactionDate: expenseDate,
          balanceBefore,
          balanceAfter: runningBalance,
        },
      });
      created.push({ expenseId: expense.id, transactionId: transaction.id, amount: part.amount });
    }

    if (Math.abs(runningBalance) > 0.01) throw new Error(`Replacement ledger did not finish at zero: ${runningBalance}`);
    const account = await tx.account.findUnique({ where: { id: ACCOUNT_ID } });
    if (!account || Math.abs(Number(account.balance)) > 0.01) throw new Error('Main Cash balance changed unexpectedly.');
    return { employee, created, accountBalance: account.balance };
  }, { maxWait: 10_000, timeout: 30_000 });

  const [employeeAfter, expensesAfter, transactionsAfter, accountAfter] = await Promise.all([
    prisma.employee.findUnique({ where: { id: result.employee.id } }),
    prisma.expense.findMany({ where: { companyId: COMPANY_ID, employeeId: result.employee.id, note: { contains: MARKER } }, orderBy: { createdAt: 'asc' } }),
    prisma.transaction.findMany({ where: { companyId: COMPANY_ID, employeeId: result.employee.id, note: { contains: MARKER } }, orderBy: { createdAt: 'asc' } }),
    prisma.account.findUnique({ where: { id: ACCOUNT_ID }, select: { name: true, balance: true } }),
  ]);
  const expenseTotal = expensesAfter.reduce((sum, item) => sum + Number(item.amount), 0);
  const transactionTotal = transactionsAfter.reduce((sum, item) => sum + Number(item.amount), 0);
  console.log(JSON.stringify({
    success: true,
    backupPath,
    employee: employeeAfter,
    expenseCount: expensesAfter.length,
    expenseTotal,
    transactionCount: transactionsAfter.length,
    transactionTotal,
    accountAfter,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
