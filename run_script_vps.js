// run_script_vps.js
const { Client } = require('ssh2');

const VPS_HOST = '81.0.248.108';
const VPS_USER = 'root';
const VPS_PASS = '172885Moalin';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const content = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accs = await prisma.account.findMany();
  console.log("=== ACCOUNTS IN DATABASE ===");
  accs.forEach(a => console.log(a.name, "| Balance:", a.balance));

  const exps = await prisma.expense.findMany({ include: { account: true, employee: true } });
  console.log("\\n=== EXPENSES (" + exps.length + ") ===");
  let paidTotal = 0;
  let unpaidTotal = 0;
  exps.forEach(e => {
    if (e.isPaid) paidTotal += Number(e.amount);
    else unpaidTotal += Number(e.amount);
    console.log("EXP:", e.amount, "ETB | isPaid:", e.isPaid, "| Acc:", e.account?.name || e.paidFrom, "| Cat:", e.category, "| Note:", e.note);
  });
  console.log("\\nTOTAL PAID EXPENSES:", paidTotal);
  console.log("TOTAL UNPAID (PENDING RECEIPT) EXPENSES:", unpaidTotal);

  const mps = await prisma.materialPurchase.findMany();
  console.log("\\n=== MATERIAL PURCHASES (" + mps.length + ") ===");
  let mpPaid = 0;
  let mpUnpaid = 0;
  mps.forEach(m => {
    if (m.isPaid) mpPaid += Number(m.totalPrice);
    else mpUnpaid += Number(m.totalPrice);
    console.log("PURCHASE:", m.totalPrice, "ETB | isPaid:", m.isPaid, "| Mat:", m.materialName, "| Note:", m.notes);
  });
  console.log("TOTAL PAID PURCHASES:", mpPaid);
  console.log("TOTAL UNPAID PURCHASES:", mpUnpaid);

  const sales = await prisma.sale.findMany({ include: { account: true } });
  console.log("\\n=== SALES (" + sales.length + ") ===");
  let salesTotal = 0;
  sales.forEach(s => {
    salesTotal += Number(s.paidAmount);
    console.log("SALE:", s.paidAmount, "ETB | Acc:", s.account?.name);
  });
  console.log("TOTAL SALES DEPOSITS:", salesTotal);

  await prisma.$disconnect();
}
main().catch(console.error);
    `;

    const stream = sftp.createWriteStream('/root/an-industory/check_balance.js');
    stream.write(content);
    stream.end();

    stream.on('finish', () => {
      conn.exec('cd /root/an-industory && node check_balance.js', (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });
  });
}).connect({ host: VPS_HOST, port: 22, username: VPS_USER, password: VPS_PASS });
