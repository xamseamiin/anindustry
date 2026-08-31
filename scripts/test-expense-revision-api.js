// HTTP integration smoke test against the compiled app and disposable localhost DB.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const dbUrl = 'postgresql://revision_test@127.0.0.1:55439/postgres';
const db = new PrismaClient({datasources:{db:{url:dbUrl}}});
const token = 'local-test-token-not-a-real-bot';
const base = 'http://127.0.0.1:3009';
let server;
function auth(id, first_name='Test') {
  const params = new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name})});
  const data = [...params].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256','WebAppData').update(token).digest();
  params.set('hash',crypto.createHmac('sha256',secret).update(data).digest('hex'));return params.toString();
}
async function put(body) {
  const response = await fetch(`${base}/api/telegram/expense-actions`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
}
(async()=>{
  const company=await db.company.create({data:{name:`HTTP TEST ${crypto.randomUUID()}`}});
  const account=await db.account.create({data:{companyId:company.id,name:'E-Birr Merchant',type:'BANK',balance:10000}});
  const expense=await db.expense.create({data:{companyId:company.id,accountId:account.id,paidFrom:account.name,category:'Transport',amount:2200,description:'Test',note:'Test\n[TelegramId: 777]',workflowStatus:'PAID',paymentStatus:'PAID',approved:true,receiptUrl:'/test-old'}});
  await db.transaction.create({data:{companyId:company.id,expenseId:expense.id,accountId:account.id,type:'EXPENSE',amount:2200,description:'Test old payment'}});
  const deposit=await db.transaction.create({data:{companyId:company.id,accountId:account.id,type:'INCOME',amount:500,description:'Actual deposit'}});
  server=spawn(process.execPath,[path.join(__dirname,'../node_modules/next/dist/bin/next'),'start','-p','3009'],{cwd:path.join(__dirname,'..'),windowsHide:true,stdio:'ignore',env:{...process.env,DATABASE_URL:dbUrl,TELEGRAM_COMPANY_ID:company.id,TELEGRAM_BOT_TOKEN:token,TELEGRAM_NOTIFICATIONS_DISABLED:'true',APP_ENV:'test',NODE_ENV:'production'}});
  let ready=false;
  for(let i=0;i<60;i++){try{await fetch(base);ready=true;break;}catch{await new Promise(r=>setTimeout(r,500));}}
  assert(ready,'Test app failed to start.');
  const input={id:expense.id,expectedVersion:1,requestId:crypto.randomUUID(),amount:2500,reason:'HTTP test reason'};
  assert.equal((await put(input)).status,403,'unsigned request must be rejected');
  assert.equal((await put({...input,initData:auth(888)})).status,409,'other member cannot edit');
  const saved=await put({...input,initData:auth(777)});
  assert.equal(saved.status,200,JSON.stringify(saved.data));assert.equal(saved.data.revision.status,'PENDING_APPROVAL');assert.equal(saved.data.telegramSync,'DISABLED');
  assert.equal((await db.account.findUnique({where:{id:account.id}})).balance,10000);
  const history=await (await fetch(`${base}/api/telegram/history`)).json();
  const row=history.expenses?.find(e=>e.id===expense.id) || history.data?.find(e=>e.id===expense.id);
  assert(row,'Edited expense must be returned in history');assert.equal(row.version,2);assert.equal(row.revision.status,'PENDING_APPROVAL');
  assert.equal(row.settledAmount,2200,'Pending amount must not be counted as money paid');
  assert(history.expenses.some(e=>e.id===deposit.id),'Regular deposits with no idempotency key remain visible');
  const emp=await db.employee.create({data:{companyId:company.id,fullName:'Salary Test Employee',role:'Worker'}});
  await db.transaction.create({data:{companyId:company.id,accountId:account.id,employeeId:emp.id,type:'EXPENSE',amount:700,category:'Salaries',description:'Hormaris mushaar'}});
  async function report(identity, extra={}) {const q=new URLSearchParams({reportType:'MONTHLY',category:'SALARY',initData:identity,...extra});return (await (await fetch(`${base}/api/telegram/reports?${q}`)).json()).report;}
  const hamse=await report(auth(1836408854,'Hamse Moalin'),{employeeIds:emp.id,salaryType:'ADVANCE'});
  assert.equal(hamse.generatedBy,'Hamse Moalin');assert.equal(hamse.payroll.length,1);assert.equal(hamse.payroll[0].advances,700);assert.equal(hamse.ledger.length,1);
  const abde=await report(auth(8230473166,'Abdehakim Mumin'));assert.equal(abde.generatedBy,'Abdehakim Mumin');
  const none=await report(auth(1836408854),{employeeIds:'unknown'});assert.equal(none.ledger.length,0);
  const memberReport=await report(auth(777));assert.equal(memberReport.ledger.length,0,'Member cannot see another employee payroll');
  console.log('PASS: Salary aliases, selected employee, advance filter, signed preparer names and member isolation over real HTTP.');
  console.log('PASS: HTTP auth, ownership, revision creation, truthful sync status, unchanged balance and history/version payload. No live Telegram calls.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{server?.kill();await db.$disconnect();});
