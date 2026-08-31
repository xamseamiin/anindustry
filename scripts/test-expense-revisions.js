// Real PostgreSQL integration tests. Deliberately cannot target .env/production.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const service = require('../lib/expense-revisions');
const { syncExpenseRevision, revisionMessage } = require('../lib/expense-revision-telegram');
const { handleRevisionUpdate } = require('../lib/expense-revision-bot');
const url = 'postgresql://revision_test@127.0.0.1:55439/postgres';
const db = new PrismaClient({ datasources:{db:{url}} });
const admin = {id:'1836408854',name:'Test Admin'};
const member = {id:'777',name:'Test Member'};
const bankRef = () => crypto.randomUUID();
let companyId;
before(async () => {
  await db.$queryRawUnsafe('SELECT 1');
  // Prisma db push cannot represent a partial index; test the deployed invariant too.
  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "expense_revisions_one_open" ON "expense_revisions"("expenseId") WHERE "status" IN ('PENDING_APPROVAL','AWAITING_RECEIPT','RECEIPT_REVIEW')`);
  companyId = (await db.company.create({data:{name:`Revision TEST ${crypto.randomUUID()}`}})).id;
});
after(async () => { await db.$disconnect(); });
async function fixture({ paid=2200, balance=10000, salary=false } = {}) {
  const account = await db.account.create({data:{name:bankRef(),companyId,type:'BANK',balance,currency:'ETB'}});
  const employee = salary ? await db.employee.create({data:{companyId,fullName:'Test Employee',role:'Worker',salaryPaidThisMonth:paid}}) : null;
  const expense = await db.expense.create({data:{companyId,description:'Original description',note:'Original description\n[TelegramId: 777]\n[RecipientName: Receiver]\n[PaymentPhone: 0900000000]',amount:2200,category:salary?'Salary':'Transport',accountId:account.id,paidFrom:account.name,employeeId:employee?.id,approved:!!paid,paymentStatus:paid?'PAID':'UNPAID',workflowStatus:paid?'PAID':'AWAITING_RECEIPT',receiptUrl:paid?'/old-receipt':null,receiptTransactionId:paid?bankRef():null,telegramChatId:'test-chat',telegramMessageId:10}});
  if (paid) await db.transaction.create({data:{companyId,expenseId:expense.id,employeeId:employee?.id,accountId:account.id,amount:paid,type:'EXPENSE',description:'Original payment',receiptUrl:'/old-receipt'}});
  return {account,expense,employee};
}
async function edit(f, fields={amount:2500}, actor=admin) {
  return service.createRevision(db,companyId,{id:f.expense.id,expectedVersion:f.expense.version,requestId:bankRef(),reason:'Correcting test request',...fields},actor);
}
const balance = async f => (await db.account.findUnique({where:{id:f.account.id}})).balance;
async function evidence(r) {
  await service.approveRevision(db,companyId,r.id,admin);
  return service.submitRevisionReceipt(db,companyId,r.id,member,`/api/telegram/receipt?fileId=${bankRef()}`,bankRef());
}
test('paid amount increase: edit/approve/upload move zero; confirmation moves delta once',async()=>{
  const f=await fixture({salary:true});const r=await edit(f);
  assert.equal(await balance(f),10000);
  assert.equal((await db.expense.findUnique({where:{id:f.expense.id}})).receiptUrl,null);
  await evidence(r); assert.equal(await balance(f),10000);
  await service.confirmRevision(db,companyId,r.id,admin,'PAYMENT');
  await service.confirmRevision(db,companyId,r.id,admin,'PAYMENT');
  assert.equal(await balance(f),9700);
  const entries=await db.transaction.findMany({where:{expenseId:f.expense.id},orderBy:{createdAt:'asc'}});
  assert.deepEqual(entries.map(t=>Number(t.amount)),[2200,300]);
  assert.equal(Number((await db.employee.findUnique({where:{id:f.employee.id}})).salaryPaidThisMonth),2500);
});
test('decrease credits only confirmed refund; original payment stays untouched',async()=>{
  const f=await fixture({salary:true});const r=await edit(f,{amount:2000});await evidence(r);
  assert.equal(await balance(f),10000);
  await assert.rejects(()=>service.confirmRevision(db,companyId,r.id,admin,'PAYMENT'));
  await service.confirmRevision(db,companyId,r.id,admin,'REFUND');
  assert.equal(await balance(f),10200);
  assert.equal(Number((await db.employee.findUnique({where:{id:f.employee.id}})).salaryPaidThisMonth),2000);
  assert.equal(await db.transaction.count({where:{expenseId:f.expense.id,type:'INCOME',amount:200}}),1);
});
test('unpaid edit deducts nothing; confirmation pays full revised amount',async()=>{
  const f=await fixture({paid:0});const r=await edit(f);await evidence(r);assert.equal(await balance(f),10000);
  await service.confirmRevision(db,companyId,r.id,admin,'PAYMENT');assert.equal(await balance(f),7500);
});
test('description-only edit keeps receipt, payment and balance',async()=>{
  const f=await fixture();const r=await edit(f,{note:'Fixed spelling'});
  assert.equal(r.status,'APPLIED');assert.equal(r.material,false);assert.equal(await balance(f),10000);
  assert.equal((await db.expense.findUnique({where:{id:f.expense.id}})).receiptUrl,'/old-receipt');
});
test('recipient-only re-verification moves zero money',async()=>{
  const f=await fixture();const r=await edit(f,{recipientName:'Correct Recipient'});await evidence(r);
  await service.confirmRevision(db,companyId,r.id,admin,'REVERIFY');assert.equal(await balance(f),10000);
  assert.equal(await db.transaction.count({where:{expenseId:f.expense.id}}),1);
});
test('account correction requires explicit correction and preserves old transaction',async()=>{
  const f=await fixture();const target=await fixture();const r=await edit(f,{accountId:target.account.id});await evidence(r);
  await assert.rejects(()=>service.confirmRevision(db,companyId,r.id,admin,'REVERIFY'));
  await service.confirmRevision(db,companyId,r.id,admin,'CORRECTION');
  assert.equal(await balance(f),12200);assert.equal(await balance(target),7800);
  assert.equal(await db.transaction.count({where:{expenseId:f.expense.id}}),3);
});
test('insufficient funds rolls back all settlement entries',async()=>{
  const f=await fixture({balance:100});const r=await edit(f);await evidence(r);
  await assert.rejects(()=>service.confirmRevision(db,companyId,r.id,admin,'PAYMENT'),/Insufficient/);
  assert.equal(await balance(f),100);assert.equal(await db.transaction.count({where:{expenseId:f.expense.id}}),1);
});
test('rejected revision restores old fields/receipt without moving money',async()=>{
  const f=await fixture();const r=await edit(f);await service.approveRevision(db,companyId,r.id,admin,true);
  const expense=await db.expense.findUnique({where:{id:f.expense.id}});
  assert.equal(Number(expense.amount),2200);assert.equal(expense.receiptUrl,'/old-receipt');assert.equal(await balance(f),10000);
});
test('owner can request edit, stranger cannot; members cannot approve/confirm',async()=>{
  const f=await fixture();await assert.rejects(()=>edit(f,{}, {id:'888',name:'Stranger'}),/own requests/);
  const r=await edit(f,{amount:2500},member);
  await assert.rejects(()=>service.approveRevision(db,companyId,r.id,member),/Admin/);
  await assert.rejects(()=>service.confirmRevision(db,companyId,r.id,member,'PAYMENT'),/Admin/);
});
test('reason, version, duplicate request and single-open constraints',async()=>{
  const f=await fixture();await assert.rejects(()=>edit(f,{reason:''}),/khasab/);
  await assert.rejects(()=>edit(f,{expectedVersion:0}),/Refresh/);
  const id=bankRef();const r=await edit(f,{amount:2500,requestId:id});
  const same=await edit(f,{amount:2500,requestId:id});assert.equal(r.id,same.id);
  await assert.rejects(()=>edit(f,{amount:2600,expectedVersion:2}),/sugayaa/);
});
test('old receipt and bank reference cannot be reused; upload before approval blocked',async()=>{
  const f=await fixture();const r=await edit(f);
  await assert.rejects(()=>service.submitRevisionReceipt(db,companyId,r.id,member,'/new',bankRef()),/not awaiting/);
  await service.approveRevision(db,companyId,r.id,admin);
  await assert.rejects(()=>service.submitRevisionReceipt(db,companyId,r.id,member,'/old-receipt',bankRef()),/new receipt/);
  await assert.rejects(()=>service.submitRevisionReceipt(db,companyId,r.id,member,'/new',f.expense.receiptTransactionId),/new receipt/);
});
test('two concurrent edits only create one proposal',async()=>{
  const f=await fixture();const results=await Promise.allSettled([edit(f),edit(f,{amount:2600})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(await balance(f),10000);
});
test('two concurrent confirmations cannot double-debit',async()=>{
  const f=await fixture();const r=await edit(f);await evidence(r);
  await Promise.allSettled([service.confirmRevision(db,companyId,r.id,admin,'PAYMENT'),service.confirmRevision(db,companyId,r.id,admin,'PAYMENT')]);
  assert.equal(await balance(f),9700);assert.equal(await db.transaction.count({where:{expenseId:f.expense.id}}),2);
});
test('Telegram rejection persists FAILED; retry sends notice once and replaces old photo',async()=>{
  const f=await fixture();const r=await edit(f);let notices=0;
  const failing=async(method)=>method==='sendMessage'?(notices++,{ok:true,result:{message_id:100}}):{ok:false,description:'Bad Request: message has no text'};
  assert.equal((await syncExpenseRevision(db,r.id,failing)).status,'FAILED');
  const methods=[];const retry=async(method)=>{methods.push(method);return {ok:method!=='editMessageText',result:{message_id:100},description:'no text'};};
  // Existing notice is text; only the original is a photo.
  const success=async(method,payload)=>method==='editMessageText'&&payload.message_id===100?{ok:true}:retry(method,payload);
  assert.equal((await syncExpenseRevision(db,r.id,success)).status,'SYNCED');assert.equal(notices,1);assert(methods.includes('editMessageMedia'));
});
test('ambiguous Telegram send is not blindly retried',async()=>{
  const f=await fixture();const r=await edit(f);let calls=0;const network=async()=>{calls++;throw new Error('timeout');};
  assert.equal((await syncExpenseRevision(db,r.id,network)).status,'UNCERTAIN');
  await syncExpenseRevision(db,r.id,network);assert.equal(calls,1);
});

test('text-only edit preserves unpaid request controls; receipt review refreshes original',async()=>{
  const f=await fixture({paid:0});
  await db.expense.update({where:{id:f.expense.id},data:{approved:true}});
  const r=await edit(f,{note:'Corrected spelling'});let original;
  await syncExpenseRevision(db,r.id,async(method,payload)=>{if(payload.message_id===10)original=payload;return {ok:true,result:{message_id:100}};});
  assert.equal(original.reply_markup.inline_keyboard[0][0].callback_data,`rcpt_${f.expense.id}`);
  const f2=await fixture();const r2=await edit(f2);await evidence(r2);
  assert.equal((await db.expenseRevision.findUnique({where:{id:r2.id}})).originalSynced,false);
});
test('Telegram HTML is escaped; requester data cannot become markup',async()=>{
  const f=await fixture();const r=await edit(f,{note:'<b>unsafe & text</b>'});
  assert(revisionMessage(r).includes('&lt;b&gt;'));assert(!revisionMessage(r).includes('<b>unsafe'));
});
test('revision upload is bound to exact chat/user/reply; restart-safe persisted session',async()=>{
  const f=await fixture();const r=await edit(f);await service.approveRevision(db,companyId,r.id,admin);
  await db.receiptSession.create({data:{companyId,expenseId:f.expense.id,telegramChatId:'test-chat',telegramUserId:'777',telegramMessageId:44,idempotencyKey:`revision:${r.id}:44`,expiresAt:new Date(Date.now()+60000)}});
  const message={chat:{id:'test-chat'},from:{id:777,first_name:'Test'},message_id:55,reply_to_message:{message_id:44},photo:[{file_id:'new-test-image'}],caption:`TX:${bankRef()}`};
  const send=async()=>({ok:true,result:{message_id:300}});
  assert.equal(await handleRevisionUpdate(db,{message:{...message,from:{id:888}}},companyId,send),false);
  assert.equal(await handleRevisionUpdate(db,{message},companyId,send),true);
  assert.equal((await db.expenseRevision.findUnique({where:{id:r.id}})).status,'RECEIPT_REVIEW');
  assert.equal(await balance(f),10000);
});
test('employee correction reconciles both payroll records without double cash debit',async()=>{
  const f=await fixture({salary:true});const other=await db.employee.create({data:{companyId,fullName:'Other employee',role:'Worker'}});
  const r=await edit(f,{employeeId:other.id});await evidence(r);
  await assert.rejects(()=>service.confirmRevision(db,companyId,r.id,admin,'REVERIFY'),/Employee changed/);
  await service.confirmRevision(db,companyId,r.id,admin,'CORRECTION');assert.equal(await balance(f),10000);
  assert.equal(Number((await db.employee.findUnique({where:{id:f.employee.id}})).salaryPaidThisMonth),0);
  assert.equal(Number((await db.employee.findUnique({where:{id:other.id}})).salaryPaidThisMonth),2200);
});
test('stale receipt buttons cannot replace a confirmed revision receipt',async()=>{
  const f=await fixture();const r=await edit(f);await evidence(r);
  await service.confirmRevision(db,companyId,r.id,admin,'PAYMENT');
  await assert.rejects(()=>service.assertLegacyReceiptAllowed(db,f.expense.id),/old upload buttons/);
});
test('release existing reservation on material edit, not historical money',async()=>{
  const f=await fixture({paid:0});
  await db.account.update({where:{id:f.account.id},data:{reservedBalance:2200}});
  await db.expense.update({where:{id:f.expense.id},data:{reservedAmount:2200}});
  await db.accountReservation.create({data:{companyId,expenseId:f.expense.id,accountId:f.account.id,amount:2200}});
  await edit(f);assert.equal(await balance(f),10000);
  assert.equal((await db.account.findUnique({where:{id:f.account.id}})).reservedBalance,0);
});
test('migration SQL applies in a fresh isolated test schema',async()=>{
  const fs=require('fs'),path=require('path');
  const sql=fs.readFileSync(path.join(__dirname,'../prisma/migrations/20260830000100_expense_revisions/migration.sql'),'utf8');
  const schema='revision_migration_'+Date.now();
  await db.$transaction(async tx=>{
    await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    for(const statement of sql.replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
    const result=await tx.$queryRawUnsafe('SELECT count(*)::int AS count FROM expense_revisions');assert.equal(result[0].count,0);
  });
});
