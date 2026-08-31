require('dotenv').config({path:require('path').join(__dirname,'..','.env'),quiet:true});
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
(async()=>{
const accountId='e2124894-d151-432d-90c4-9e5025b71fb9';
const account=await db.account.findUnique({where:{id:accountId},select:{balance:true,name:true}});
const rows=await db.transaction.findMany({where:{accountId,transactionDate:{gte:new Date('2026-08-29T00:00:00+03:00')}},orderBy:[{transactionDate:'asc'},{createdAt:'asc'}],select:{id:true,type:true,amount:true,transactionDate:true,createdAt:true,updatedAt:true,expenseId:true,description:true,balanceBefore:true,balanceAfter:true,reversedAt:true,reversalOfId:true,expense:{select:{telegramMessageId:true,telegramChatId:true,amount:true,paymentStatus:true,receiptUrl:true,category:true}}}});
console.log(JSON.stringify({account,rows},null,2));
})().catch(e=>console.error(e.message)).finally(()=>db.$disconnect());
