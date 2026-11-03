// Isolated API checks: never loads credentials or connects to a database.
const fs = require('fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
function load(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'exports', code)(name => { if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`); return dependencies[name]; }, exports);
  return exports;
}
const helper = load('lib/sale-payment-correction.ts', {});
let state, role, closed;
const originalDate = '2026-09-22T10:00:00.000Z';
function reset() {
  role = 'ADMIN'; closed = false;
  state = { balance: 10000, audit: [], sale: { id:'sale1', companyId:'company1', invoiceNumber:'AN-NB-1', total:1500, paidAmount:1500, accountId:'account1', customerId:null, paymentMethod:'E-BIRR', paymentStatus:'Paid', status:'Completed', notes:'[CapDeducted:100]', createdAt:new Date('2026-09-13'), updatedAt:new Date(originalDate), paymentAllocations:[] }, transaction: { id:'tx1', amount:1500, accountId:'account1', reversedAt:null } };
}
const prisma = {
  user: { findUnique:async () => ({ companyId:'company1', role }) },
  $transaction: async callback => {
    const draft = structuredClone(state);
    const tx = {
      sale: {
        findFirst:async ({where}) => { assert.equal(where.companyId,'company1'); return draft.sale; },
        update:async ({data}) => Object.assign(draft.sale, data)
      },
      financialPeriod: { findFirst:async () => closed ? {name:'closed'} : null },
      customer: { findFirst:async ({where}) => { assert.equal(where.companyId,'company1'); return where.id==='known' ? {id:'known',phone:'0911111111'} : where.id==='no-phone' ? {id:'no-phone',phone:null} : null; } },
      transaction: { findMany:async () => [draft.transaction], update:async ({data}) => Object.assign(draft.transaction,data) },
      account: { update:async ({data}) => { draft.balance += data.balance.increment; } },
      auditLog: { create:async ({data}) => { draft.audit.push(data); } }
      // Deliberately no stock API: any attempt to mutate physical stock fails.
    };
    const result=await callback(tx); state=draft; return result;
  }
};
const route = load('app/api/manufacturing/sales/[id]/route.ts', {
  'next/server': { NextResponse: { json:(data, options={}) => ({data,status:options.status||200}) } },
  'next-auth/next': {getServerSession:async () => ({user:{id:'admin'}})},
  '@/lib/auth': {authOptions:{}}, '@/lib/prisma': {default:prisma}, '@/lib/audit': {logAudit:async()=>{}},
  '@/lib/sale-payment-correction': helper
});
const request = body => route.PATCH({json:async()=>({reason:'Originally recorded as paid in error',updatedAt:originalDate,...body})},{params:{id:'sale1'}});
(async()=>{
  reset(); let r=await request({paidAmount:500,customerId:'known'}); assert.equal(r.status,200); assert.equal(state.balance,9000); assert.equal(state.sale.paymentStatus,'Partial'); assert.equal(state.transaction.amount,500); assert.equal(state.audit.length,1);
  r=await request({paidAmount:500,customerId:'known'}); assert.equal(r.status,200); assert.equal(state.balance,9000); // No double debit.
  r=await request({paidAmount:0,customerId:'known'}); assert.equal(r.status,200); assert.equal(state.balance,8500); assert.equal(state.sale.paymentStatus,'Unpaid');
  r=await request({paidAmount:1500,customerId:null}); assert.equal(r.status,200); assert.equal(state.balance,10000); assert.equal(state.sale.paymentStatus,'Paid');
  for(const customerId of [null,'no-phone','other-company']) {reset(); r=await request({paidAmount:0,customerId}); assert.equal(r.status,400); assert.equal(state.balance,10000);}
  for(const paidAmount of [-1,1501,NaN,'0',null]) {reset(); r=await request({paidAmount,customerId:'known'}); assert.equal(r.status,400); assert.equal(state.balance,10000);}
  reset(); r=await request({paidAmount:0,customerId:'known',updatedAt:'stale'}); assert.equal(r.status,400);
  reset(); closed=true; r=await request({paidAmount:0,customerId:'known'}); assert.equal(r.status,400);
  reset(); role='MEMBER'; r=await request({paidAmount:0,customerId:'known'}); assert.equal(r.status,403);
  reset(); state.sale.paymentAllocations=[{id:'incoming'}]; r=await request({paidAmount:0,customerId:'known'}); assert.equal(r.status,400);
  reset(); state.transaction.amount=100; r=await request({paidAmount:0,customerId:'known'}); assert.equal(r.status,400); assert.equal(state.balance,10000);
  console.log('PASS: paid/partial/debt reconciliation, idempotent balance delta, customer/phone validation, role, closed-period, stale-record and ledger mismatch guards; no stock mutations.');
})().catch(e=>{console.error(e);process.exitCode=1});
