require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async()=>{
  const companyId='e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
  const date=new Date('2026-11-09T00:00:00+03:00');
  const sales=await p.sale.findMany({where:{companyId,invoiceNumber:{in:['AN-TG-R115-20261100115-1','AN-TG-R115-20261100115-2']}}});
  for(const s of sales){
    await p.sale.update({where:{id:s.id},data:{createdAt:date}});
    await p.transaction.updateMany({where:{companyId,description:'Iibka '+s.invoiceNumber},data:{transactionDate:date}});
  }
  console.log('updated',sales.length);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>p.$disconnect());
