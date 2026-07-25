// investigate_balance.js
const { Client } = require('ssh2');

const VPS_HOST = '81.0.248.108';
const VPS_USER = 'root';
const VPS_PASS = '172885Moalin';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to VPS. Running database balance inspection script...');
  
  const nodeScript = `
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
      const purchases = await prisma.materialPurchase.findMany();
      console.log("Total purchases count:", purchases.length);
      let sumPurchases = 0;
      purchases.forEach(p => sumPurchases += Number(p.totalPrice));
      console.log("Sum Purchases:", sumPurchases);

      console.log("\\n=== SALES (INCOME DEPOSITS) ===");
      const sales = await prisma.sale.findMany({
        include: { account: true }
      });
      console.log("Total sales count:", sales.length);
      let sumSalesPaid = 0;
      sales.forEach(s => sumSalesPaid += Number(s.paidAmount));
      console.log("Sum Sales Paid Amount:", sumSalesPaid);

      console.log("\\n=== DETAILED EXPENSES BREAKDOWN ===");
      expenses.forEach(e => {
        console.log(\`ID: \${e.id} | Amount: \${e.amount} | isPaid: \${e.isPaid} | PaidFrom: \${e.paidFrom} | Category: \${e.category} | Employee: \${e.employee?.fullName || 'N/A'}\`);
      });

      await prisma.$disconnect();
    }
    run().catch(console.error);
  `;

  const cmd = `node -e "${nodeScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  conn.exec(`cd /root/an-industory && ${cmd}`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', (d) => process.stdout.write(d.toString()))
      .stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
}).connect({
  host: VPS_HOST,
  port: 22,
  username: VPS_USER,
  password: VPS_PASS
});
