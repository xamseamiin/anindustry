// inspect_db_remote.js
const { Client } = require('ssh2');
const fs = require('fs');

const VPS_HOST = '81.0.248.108';
const VPS_USER = 'root';
const VPS_PASS = '172885Moalin';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to VPS. Uploading inspect script...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remoteScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== ACCOUNTS IN DATABASE ===");
  const accounts = await prisma.account.findMany();
  console.log(JSON.stringify(accounts, null, 2));

  console.log("\\n=== EXPENSES (PAID vs UNPAID) ===");
  const expenses = await prisma.expense.findMany({
    include: { account: true, employee: true }
  });
  console.log("Total expenses count:", expenses.length);
  
  let sumPaidExpenses = 0;
  let sumUnpaidExpenses = 0;
  expenses.forEach(e => {
    if (e.isPaid) {
      sumPaidExpenses += Number(e.amount);
    } else {
      sumUnpaidExpenses += Number(e.amount);
    }
  });
  console.log("Sum Paid Expenses:", sumPaidExpenses);
  console.log("Sum Unpaid Expenses (Pending Receipt):", sumUnpaidExpenses);

  console.log("\\n=== MATERIAL PURCHASES ===");
  const purchases = await prisma.materialPurchase.findMany({
    include: { vendor: true }
  });
  console.log("Total purchases count:", purchases.length);
  let sumPurchasesPaid = 0;
  let sumPurchasesUnpaid = 0;
  purchases.forEach(p => {
    if (p.isPaid) sumPurchasesPaid += Number(p.totalPrice);
    else sumPurchasesUnpaid += Number(p.totalPrice);
  });
  console.log("Sum Paid Purchases:", sumPurchasesPaid);
  console.log("Sum Unpaid Purchases:", sumPurchasesUnpaid);

  console.log("\\n=== SALES (INCOME DEPOSITS) ===");
  const sales = await prisma.sale.findMany({
    include: { account: true }
  });
  console.log("Total sales count:", sales.length);
  let sumSalesPaid = 0;
  sales.forEach(s => sumSalesPaid += Number(s.paidAmount));
  console.log("Sum Sales Paid Amount:", sumSalesPaid);

  console.log("\\n=== DETAILED EXPENSES LIST ===");
  expenses.forEach((e, idx) => {
    console.log(\`\${idx+1}. ID: \${e.id} | Amount: \${e.amount} | isPaid: \${e.isPaid} | PaidFrom: \${e.paidFrom} | Category: \${e.category} | Employee: \${e.employee?.fullName || 'N/A'} | Note: \${e.note}\`);
  });

  await prisma.$disconnect();
}
run().catch(console.error);
    `;

    const stream = sftp.createWriteStream('/root/an-industory/scratch_inspect.js');
    stream.write(remoteScript);
    stream.end();

    stream.on('finish', () => {
      console.log('Script uploaded. Executing...');
      conn.exec('cd /root/an-industory && node scratch_inspect.js', (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => conn.end())
          .on('data', (d) => process.stdout.write(d.toString()))
          .stderr.on('data', (d) => process.stderr.write(d.toString()));
      });
    });
  });
}).connect({
  host: VPS_HOST,
  port: 22,
  username: VPS_USER,
  password: VPS_PASS
});
