require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const userId = '5af215e6-6338-4bb5-aa78-60b35ef04d2f';
const money = n => Math.round(Number(n) * 100) / 100;
const day = n => new Date(`2026-11-${String(n).padStart(2,'0')}T00:00:00+03:00`);

async function main() {
  const mats = await prisma.factoryMaterial.findMany({ where: { companyId, name: { in: ['1L','0.5L'] } } });
  const m1 = mats.find(x => x.name === '1L'), m05 = mats.find(x => x.name === '0.5L');
  if (!m1 || !m05) throw new Error('1L/0.5L materials not found');
  const customers = await prisma.customer.findMany({ where: { companyId }, select: { id:true,name:true } });
  const customer = name => customers.find(c => c.name.toLowerCase() === name.toLowerCase()) || customers.find(c => c.name.toLowerCase().replace(/[^a-z]/g,'').includes(name.toLowerCase().replace(/[^a-z]/g,'')));
  const cRax = customer('CRaxman Jibriga'), bashiir = customer('Bashiir community'), max = customer('Maxamuud Badiici'), muk = customer('mukhtaaar sahyda'), farax = customer('Farax Wali');
  if (![cRax,bashiir,max,muk,farax].every(Boolean)) throw new Error('One or more customers not found');
  const ebirr = await prisma.account.findFirst({ where: { companyId, name: 'E-Birr Merchant' } });
  let cbe = await prisma.account.findFirst({ where: { companyId, name: 'CBE' } });
  const existing = await prisma.sale.findMany({ where: { companyId, invoiceNumber: { startsWith: 'AN-TG-R115-202611' } }, include: { items:true } });
  const relevantTx = await prisma.transaction.findMany({ where: { companyId, description: { startsWith: 'Iibka AN-TG-R115-202611' } } });
  const backupPath = `an-industry-receipts-11-14-backup-${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify({createdAt:new Date().toISOString(),accounts:[ebirr,cbe],sales:existing,transactions:relevantTx,materials:mats},(_,v)=>v?.toJSON?.()||v,2));
  await prisma.$transaction(async tx => {
    cbe = cbe || await tx.account.create({ data: { companyId, name:'CBE', type:'Bank', currency:'ETB', balance:0, isActive:true } });
    const rows = [
      { inv:'00115-1', d:11, cust:cRax, account:ebirr, items:[{m:m1,q:4000,p:20},{m:m05,q:200,p:15}] },
      { inv:'00115-2', d:11, cust:bashiir, account:ebirr, items:[{m:m1,q:100,p:20}] },
      { inv:'00117-1', d:12, cust:bashiir, account:ebirr, items:[{m:m1,q:100,p:20}] },
      { inv:'00118-1', d:13, cust:max, account:ebirr, items:[{m:m1,q:200,p:20}] },
      { inv:'00118-2', d:13, cust:muk, account:cbe, items:[{m:m1,q:5000,p:20}] },
      { inv:'00118-3', d:13, cust:muk, account:cbe, items:[{m:m05,q:200,p:15}] },
      { inv:'00118-4', d:13, cust:farax, account:ebirr, items:[{m:m1,q:1000,p:20}] },
      { inv:'00119-1', d:14, cust:max, account:ebirr, items:[{m:m1,q:200,p:20}] }
    ];
    for (const row of rows) {
      const invoiceNumber = `AN-TG-R115-202611${row.inv}`;
      if (await tx.sale.findUnique({where:{invoiceNumber}})) continue;
      const total = money(row.items.reduce((s,i)=>s+i.q*i.p,0));
      await tx.sale.create({data:{companyId,userId,invoiceNumber,customerId:row.cust.id,accountId:row.account.id,subtotal:total,tax:0,total,paidAmount:total,paymentMethod:row.account.name==='CBE'?'BANK_TRANSFER':'CASH',paymentStatus:'Paid',status:'Completed',currency:'ETB',autoConvertDebt:false,createdAt:day(row.d),items:{create:row.items.map(i=>({productId:i.m.id,productName:i.m.name,quantity:i.q,unitPrice:i.p,total:i.q*i.p,costPrice:Number(i.m.purchasePrice),totalCost:Number(i.m.purchasePrice)*i.q}))}}});
      await tx.transaction.create({data:{companyId,userId,accountId:row.account.id,customerId:row.cust.id,description:`Iibka ${invoiceNumber}`,amount:total,type:'INCOME',category:'Sales Income',transactionDate:day(row.d),note:`Receipt ${row.inv.split('-')[0]} entered from scanned receipt; paid in full.`}});
      await tx.account.update({where:{id:row.account.id},data:{balance:{increment:total}}});
      for (const i of row.items) await tx.factoryMaterial.update({where:{id:i.m.id},data:{inStock:{decrement:i.q}}});
    }
  },{timeout:30000});
  console.log(JSON.stringify({ok:true,backupPath,cbeAccount:'CBE',enteredReceipts:['00115','00117','00118','00119'],note:'00118 Mukhtaar two lines entered as two CBE sales'},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
