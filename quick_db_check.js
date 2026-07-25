// quick_db_check.js
const { Client } = require('ssh2');

const VPS_HOST = '81.0.248.108';
const VPS_USER = 'root';
const VPS_PASS = '172885Moalin';

const conn = new Client();
conn.on('ready', () => {
  const queryCmd = `node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    async function main() {
      const accs = await p.account.findMany();
      console.log('--- ACCOUNTS ---');
      accs.forEach(a => console.log(a.name, '| Balance:', a.balance, '| ID:', a.id));

      const exps = await p.expense.findMany({ include: { account: true, employee: true } });
      console.log('--- EXPENSES COUNT ---', exps.length);
      let paidTotal = 0;
      let unpaidTotal = 0;
      exps.forEach(e => {
        if (e.isPaid) paidTotal += Number(e.amount);
        else unpaidTotal += Number(e.amount);
        console.log('EXP:', e.amount, '| isPaid:', e.isPaid, '| Account:', e.account?.name || e.paidFrom, '| Category:', e.category, '| Note:', e.note);
      });
      console.log('Paid Expenses Total:', paidTotal);
      console.log('Unpaid Expenses Total:', unpaidTotal);

      const mps = await p.materialPurchase.findMany();
      console.log('--- PURCHASES COUNT ---', mps.length);
      let mpTotal = 0;
      mps.forEach(m => {
        mpTotal += Number(m.totalPrice);
        console.log('PURCHASE:', m.totalPrice, '| isPaid:', m.isPaid, '| Material:', m.materialName, '| Note:', m.notes);
      });
      console.log('Purchases Total:', mpTotal);

      const sales = await p.sale.findMany({ include: { account: true } });
      console.log('--- SALES COUNT ---', sales.length);
      let salesTotal = 0;
      sales.forEach(s => {
        salesTotal += Number(s.paidAmount);
        console.log('SALE:', s.paidAmount, '| Account:', s.account?.name);
      });
      console.log('Sales Total:', salesTotal);

      await p.disconnect();
    }
    main();
  "`;

  conn.exec(`cd /root/an-industory && ${queryCmd}`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: VPS_HOST, port: 22, username: VPS_USER, password: VPS_PASS });
