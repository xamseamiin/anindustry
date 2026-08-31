require('dotenv').config({path:require('path').join(__dirname,'..','.env'),quiet:true});
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
(async()=>{
 const id='6e8dcd38-d198-4751-afaa-a1de9287bc82';
 const e=await db.expense.findUnique({where:{id},select:{amount:true,paymentStatus:true,workflowStatus:true,receiptUrl:true,telegramMessageId:true,account:{select:{balance:true}}}});
 const audit=await db.financialAuditEvent.findFirst({where:{entityId:id,action:'confirmed-full-refund-3590-reopen-590-20260831'}});
 if(process.argv.includes('--record-missing-old') && audit?.metadata?.newMessageId===725 && audit.metadata.oldMessageId===711){
   await db.financialAuditEvent.update({where:{id:audit.id},data:{metadata:{...audit.metadata,telegramStatus:'NEW_SENT_OLD_NOT_FOUND',oldMessageDeleteResult:'Telegram: message to delete not found; no other message IDs attempted'}}});
 }
 const sessions=await db.receiptSession.findMany({where:{expenseId:id},select:{telegramMessageId:true,status:true}});
 const verification=await db.receiptVerification.findMany({where:{expenseId:id}});
 console.log(JSON.stringify({expense:e,audit:audit?.metadata,sessions,verification,linkedPayments:await db.transaction.count({where:{expenseId:id,type:'EXPENSE'}})},null,2));
})().catch(e=>console.error(e.message)).finally(()=>db.$disconnect());
