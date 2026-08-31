// One explicitly authorized production repair. Default is read-only inspection.
require('dotenv').config({path:require('path').join(__dirname,'..','.env'),quiet:true});
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
const expenseId='6e8dcd38-d198-4751-afaa-a1de9287bc82';
const paymentId='3e154628-799b-480c-b247-fb9aaec54792';
const marker='confirmed-full-refund-3590-reopen-590-20260831';
const companyId='e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const chatId='-5307882362';
const oldMessageId=711;
const reason='Lacag ka badan tii saxda ahayd ayaa la qoray.';
const json=x=>JSON.parse(JSON.stringify(x));
const escape=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
async function telegram(method,payload){
 const response=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
 const result=await response.json();if(!result.ok)throw new Error(`${method}: ${result.description}`);return result.result;
}
(async()=>{
 const existing=await db.financialAuditEvent.findFirst({where:{companyId,action:marker}});
 if(existing)throw new Error('Repair already recorded. Inspect audit metadata; do not repeat any cash adjustment or send.');
 const e=await db.expense.findUnique({where:{id:expenseId}});
 const p=await db.transaction.findUnique({where:{id:paymentId}});
 const a=await db.account.findUnique({where:{id:e?.accountId}});
 if(!e||e.companyId!==companyId||Number(e.amount)!==590||e.paymentStatus!=='PAID'||e.telegramMessageId!==oldMessageId||e.telegramChatId!==chatId||!p||p.expenseId!==expenseId||Number(p.amount)!==590||p.accountId!==a.id)throw new Error('Unexpected current state; stop for review.');
 if(await db.transaction.count({where:{expenseId}})!==1)throw new Error('Unexpected linked payments.');
 console.log(JSON.stringify({mode:process.argv.includes('--apply')?'APPLY':'READ_ONLY',expenseId,oldMessageId,currentBalance:Number(a.balance),balanceAdjustment:590,expectedBalance:Number(a.balance)+590,newRequest:590,receiptStatus:'AWAITING_RECEIPT'}));
 if(!process.argv.includes('--apply'))return;
 const audit=await db.$transaction(async tx=>{
   await tx.$queryRawUnsafe('SELECT "_id" FROM expenses WHERE "_id"=$1 FOR UPDATE',expenseId);
   const current=await tx.expense.findUnique({where:{id:expenseId}});
   const payment=await tx.transaction.findUnique({where:{id:paymentId}});
   if(current.updatedAt.getTime()!==e.updatedAt.getTime()||payment.updatedAt.getTime()!==p.updatedAt.getTime())throw new Error('Concurrent change; stop.');
   if(await tx.accountReservation.count({where:{expenseId,status:'ACTIVE'}}))throw new Error('Active reservation needs separate reconciliation.');
   const account=await tx.account.findUnique({where:{id:a.id}});
   // Restore historical payment to the amount shown on the actual receipt, and
   // detach from the reopened request so the legacy upload creates ONE new debit.
   await tx.transaction.update({where:{id:paymentId},data:{amount:3590,expenseId:null,description:'Historical payment to Abdehakim — 3,590 ETB; fully refunded',note:`${p.note||''}\n[OriginalExpenseId: ${expenseId}]\n[Repair: ${marker}]\nFull refund confirmed by account owner in this conversation.`}});
   await tx.transaction.create({data:{companyId,accountId:a.id,type:'INCOME',amount:3590,description:'Full refund of 3,590 ETB from Abdehakim (owner confirmed)',note:`[Repair: ${marker}] [OriginalPaymentId: ${paymentId}]\nRefund confirmation supplied by owner; refund receipt not supplied.`,idempotencyKey:marker,reversalOfId:paymentId}});
   // Old edit had already net-credited 3,000. Only the remaining 590 is added.
   await tx.account.update({where:{id:a.id},data:{balance:{increment:590}}});
   await tx.receiptSession.updateMany({where:{expenseId,status:'AWAITING_UPLOAD'},data:{status:'CANCELLED',completedAt:new Date()}});
   await tx.expense.update({where:{id:expenseId},data:{amount:590,paymentStatus:'UNPAID',paymentDate:null,receiptUrl:null,receiptTransactionId:null,approved:true,workflowStatus:'AWAITING_RECEIPT',reservedAmount:0,version:{increment:1},description:'Engineer ka warshada bacda',note:`${e.note}\n[CorrectionReason: ${reason}]\n[Repair: ${marker}]`}});
   return tx.financialAuditEvent.create({data:{companyId,actorName:'Account owner — explicit chat instruction',actorSource:'AUTHORIZED_MANUAL_REPAIR',action:marker,entity:'Expense',entityId:expenseId,before:json({expense:e,payment:p,balance:account.balance}),after:{amount:590,paymentStatus:'UNPAID',balance:Number(account.balance)+590},metadata:{reason,fullRefundConfirmedByOwner:true,refundReceiptProvided:false,previousAutomaticCredit:3000,additionalCredit:590,oldMessageId,chatId,telegramStatus:'NOT_SENT'}}});
 },{isolationLevel:'Serializable',timeout:20000});
 const account=await db.account.findUnique({where:{id:a.id}});
 const text=`<b>AN-Industry</b>\n<b>📋 Codsiga la saxay — Sugaya Rasiidka</b>\n\n🗣 Soo Dalbay: Abdehakim Mumin (@Abdehakimmumin)\n📂 Qaybta: ${escape(e.category)}\n💵 Lacagta cusub: <b>590 ETB</b>\n👤 Loo dirayo: Abdehakim\n📱 Lambarka: 0913437741\n💳 Koontada: E-Birr Merchant\n📝 Sharaxaad: Engineer ka warshada bacda\n\n✏️ Isbeddelka: 3,590 → 590 ETB (farqi 3,000 ETB).\nSababta: ${reason}\n↩️ Milkiiluhu wuxuu xaqiijiyey in 3,590-kii oo dhan la soo celiyey.\n\n⏳ Dalabkan 590 ETB wali lama bixin. Gali rasiidka CUSUB ee 590 ETB; marka la diiwaangeliyo ayaa 590 laga jarayaa account-ka. Rasiidkii hore ha isticmaalin.`;
 await db.financialAuditEvent.update({where:{id:audit.id},data:{metadata:{...audit.metadata,telegramStatus:'SENDING'}}});
 const sent=await telegram('sendMessage',{chat_id:chatId,text,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:'➕ Gali Rasiidka 590 ETB',callback_data:`rcpt_${expenseId}`}]]}});
 await db.$transaction(async tx=>{
   await tx.expense.update({where:{id:expenseId},data:{telegramMessageId:sent.message_id}});
   await tx.financialAuditEvent.update({where:{id:audit.id},data:{metadata:{...audit.metadata,telegramStatus:'SENT',newMessageId:sent.message_id}}});
 });
 await telegram('deleteMessage',{chat_id:chatId,message_id:oldMessageId});
 await db.financialAuditEvent.update({where:{id:audit.id},data:{metadata:{...audit.metadata,telegramStatus:'COMPLETE',newMessageId:sent.message_id,oldMessageDeleted:true}}});
 const final=await db.expense.findUnique({where:{id:expenseId}});
 console.log(JSON.stringify({success:true,newMessageId:sent.message_id,oldMessageDeleted:true,balance:Number(account.balance),amount:Number(final.amount),paymentStatus:final.paymentStatus,receiptUrl:final.receiptUrl,linkedPaymentCount:await db.transaction.count({where:{expenseId,type:'EXPENSE'}})}));
})().catch(err=>{console.error(String(err.message));process.exitCode=1;}).finally(()=>db.$disconnect());
