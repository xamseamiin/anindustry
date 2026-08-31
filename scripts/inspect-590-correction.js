const path = require('path');
require('dotenv').config({path:path.join(__dirname,'..','.env'),quiet:true});
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
(async()=>{
 const url=new URL(process.env.DATABASE_URL);
 console.log(JSON.stringify({databaseHost:url.hostname,databasePort:url.port,companyId:process.env.TELEGRAM_COMPANY_ID}));
 const rows=await db.$queryRawUnsafe('SELECT "_id", "amount", "description", "note", "paymentStatus", "approved", "receiptUrl", "accountId", "telegramChatId", "telegramMessageId", "createdAt", "updatedAt" FROM expenses WHERE "companyId"=$1 AND "amount" IN (590,3590) ORDER BY "updatedAt" DESC LIMIT 20',process.env.TELEGRAM_COMPANY_ID);
 for(const e of rows){
   const ledger=await db.$queryRawUnsafe('SELECT "_id", "type", "amount", "accountId", "description", "createdAt", "updatedAt", "balanceBefore", "balanceAfter" FROM transactions WHERE "expenseId"=$1 ORDER BY "createdAt"',e._id);
   const account=await db.$queryRawUnsafe('SELECT "_id", "name", "balance" FROM accounts WHERE "_id"=$1',e.accountId);
   console.log(JSON.stringify({expense:e,ledger,account},null,2));
   if(e._id==='6e8dcd38-d198-4751-afaa-a1de9287bc82' && e.receiptUrl){
     const fileId=new URL(e.receiptUrl,'https://anindustry.online').searchParams.get('fileId');
     const token=process.env.TELEGRAM_BOT_TOKEN;
     const info=await fetch(`https://api.telegram.org/bot${token}/getFile`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_id:fileId})}).then(r=>r.json());
     if(!info.ok)throw new Error('Receipt download unavailable');
     const data=await fetch(`https://api.telegram.org/file/bot${token}/${info.result.file_path}`).then(r=>r.arrayBuffer());
     require('fs').writeFileSync(path.join(__dirname,'..','tmp','590-receipt-review.jpg'),Buffer.from(data));
     console.log('Receipt saved locally for read-only visual verification.');
   }
 }
})().catch(e=>{console.error(String(e.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[redacted]'));process.exitCode=1;}).finally(()=>db.$disconnect());
