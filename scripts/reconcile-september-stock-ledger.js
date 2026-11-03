// Reviewed transcription of the owner's September stock notebook. Dry-run by default.
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const companyId = 'e69f8480-0cc9-4263-9abb-c6fbfeee2ac2';
const marker = '[SEPTEMBER-NOTEBOOK-2026]';
const productionRows = [[15,5000],[16,4750],[17,8150],[19,7200],[20,7350]];
const rows = [
  ['1L',13,11150], ['1L',14,350], ['1L',15,5500], ['1L',16,600],
  ['1L',17,5250], ['1L',18,6200], ['1L',19,5050], ['1L',20,6200],
  ['0.5L',13,100], ['0.5L',14,300], ['0.5L',15,500],
  ['0.5L',16,100], ['0.5L',19,100], ['0.5L',20,200]
];
const date = day => new Date(`2026-09-${day}T12:00:00+03:00`);
async function main() {
  const result = await prisma.$transaction(async tx => {
    const materials = await tx.factoryMaterial.findMany({where:{companyId}});
    const byName = new Map(materials.map(m=>[m.name,m]));
    const account = await tx.account.findFirstOrThrow({where:{companyId,name:'E-Birr Merchant',isActive:true}});
    const orders = await tx.productionOrder.findMany({where:{companyId,orderNumber:{in:['PO-1789924939909','PO-1789925023236']}},include:{manufacturingUsed:true,costTracking:true}});
    if(orders.length!==2) throw new Error('Expected both original production orders.');
    const prior = await tx.sale.findMany({where:{companyId,createdAt:{gte:date(13),lte:new Date('2026-09-21T00:00:00+03:00')}},include:{items:true}});
    const plan = rows.map(([name,day,quantity])=> {
      const product=byName.get(name);
      if(!product || product.sellingPrice !== (name==='1L'?20:15)) throw new Error('Product/price changed; review required.');
      return {name,day,quantity,price:product.sellingPrice,total:quantity*product.sellingPrice,invoice:`AN-NB-202609${day}-${name==='1L'?'1L':'05L'}`};
    });
    if(prior.some(s=>!s.notes?.includes(marker))) throw new Error('Other sales overlap notebook dates; review duplicates before importing.');
    const pending=plan.filter(row=>!prior.some(s=>s.invoiceNumber===row.invoice));
    const existingProduction=await tx.productionOrder.findMany({where:{companyId,orderNumber:{startsWith:'AN-NB-PROD-'}}});
    const production=productionRows.map(([day,quantity])=>({day,quantity,orderNumber:`AN-NB-PROD-202609${day}-1L`})).filter(row=>!existingProduction.some(order=>order.orderNumber===row.orderNumber));
    const produced=production.reduce((s,row)=>s+row.quantity,0);
    const raw=byName.get('Resin 1L');
    const catalog=await tx.productCatalog.findFirstOrThrow({where:{companyId,name:'1L'}});
    if(!raw || raw.inStock<produced) throw new Error('Insufficient raw 1L stock.');
    const caps=byName.get('Fur');
    if(!caps) throw new Error('Cap stock missing.');
    const restore=orders.flatMap(o=>o.manufacturingUsed.filter(m=>m.materialName==='Fur'));
    const restoredCaps=restore.reduce((sum,m)=>sum+m.quantityUsed,0);
    const soldCaps=pending.reduce((sum,row)=>sum+row.quantity,0);
    const income=pending.reduce((sum,row)=>sum+row.total,0);
    const summary={pending,production,produced,restoredCaps,soldCaps,income,account:account.name,balanceBefore:Number(account.balance),balanceAfter:Number(account.balance)+income,stockAfter:Object.fromEntries(['1L','0.5L'].map(name=>[name,byName.get(name).inStock+(name==='1L'?produced:0)-pending.filter(r=>r.name===name).reduce((s,r)=>s+r.quantity,0)]))};
    if(!process.argv.includes('--apply')) return summary;
    const userId=byName.get('1L').userId;
    const closed=await tx.financialPeriod.findFirst({where:{companyId,isClosed:true,startDate:{lte:date(20)},endDate:{gte:date(13)}}});
    if(closed) throw new Error('Financial period is closed.');
    for(const order of orders) {
      const expectedQuantity=order.orderNumber==='PO-1789925023236'?3750:3800;
      if(order.quantity!==expectedQuantity || order.status!=='COMPLETED') throw new Error('Production changed since review.');
      const restoredCost=order.manufacturingUsed.filter(m=>m.materialName==='Fur').reduce((s,m)=>s+m.totalCost,0);
      await tx.productionOrder.update({where:{id:order.id},data:{startDate:date(expectedQuantity===3750?14:13),completedDate:date(expectedQuantity===3750?14:13),notes:order.notes?.includes(marker)?order.notes:`${order.notes||''}\n${marker} Production date corrected; cap consumption reversed, caps deducted at sale.`}});
      await tx.manufacturingUsed.updateMany({where:{productionOrderId:order.id},data:{usedDate:date(expectedQuantity===3750?14:13)}});
      for(const usage of order.manufacturingUsed.filter(m=>m.materialName==='Fur')) {
        await tx.manufacturingUsed.delete({where:{id:usage.id}});
      }
      if(restoredCost && order.costTracking) await tx.costTracking.update({where:{id:order.costTracking.id},data:{actualMaterialCost:{decrement:restoredCost}}});
    }
    await tx.factoryMaterial.update({where:{id:caps.id},data:{inStock:{increment:restoredCaps}}});
    for(const row of production) {
      const order=await tx.productionOrder.create({data:{companyId,productId:catalog.id,productName:'1L',quantity:row.quantity,status:'COMPLETED',orderNumber:row.orderNumber,startDate:date(row.day),completedDate:date(row.day),notes:`${marker} Historical quantity confirmed by owner. One Resin 1L per bottle; caps consumed at sale. Packaging and labor not provided in notebook; costs require separate reconciliation.`}});
      const updated=await tx.factoryMaterial.updateMany({where:{id:raw.id,inStock:{gte:row.quantity}},data:{inStock:{decrement:row.quantity}}});
      if(updated.count!==1) throw new Error('Raw stock changed.');
      await tx.factoryMaterial.update({where:{id:byName.get('1L').id},data:{inStock:{increment:row.quantity}}});
      await tx.manufacturingUsed.create({data:{companyId,productionOrderId:order.id,materialName:raw.name,quantityUsed:row.quantity,unit:raw.unit,costPerUnit:raw.purchasePrice,totalCost:raw.purchasePrice*row.quantity,usedDate:date(row.day),notes:marker}});
      await tx.costTracking.create({data:{companyId,productionOrderId:order.id,actualMaterialCost:raw.purchasePrice*row.quantity,notes:`${marker} Raw bottle cost only; historical labor/packaging not supplied.`}});
    }
    for(const row of pending) {
      const product=byName.get(row.name);
      const cost=product.purchasePrice+caps.purchasePrice;
      const sale=await tx.sale.create({data:{companyId,userId,invoiceNumber:row.invoice,customerId:null,accountId:account.id,subtotal:row.total,tax:0,total:row.total,paidAmount:row.total,paymentMethod:'E-BIRR',paymentStatus:'Paid',status:'Completed',createdAt:date(row.day),autoConvertDebt:false,notes:`${marker} Walk-in daily sales from owner notebook; full payment to E-Birr recorded on owner instruction. [CapDeducted:${row.quantity}]`,items:{create:[{productId:product.id,productName:product.name,quantity:row.quantity,unitPrice:row.price,total:row.total,costPrice:cost,totalCost:cost*row.quantity}]}}});
      for(const [id,quantity] of [[product.id,row.quantity],[caps.id,row.quantity]]) {
        const updated=await tx.factoryMaterial.updateMany({where:{id,companyId,inStock:{gte:quantity}},data:{inStock:{decrement:quantity}}});
        if(updated.count!==1) throw new Error('Insufficient stock; all changes rolled back.');
      }
      await tx.transaction.create({data:{companyId,userId,accountId:account.id,description:`Iibka ${sale.invoiceNumber}`,amount:row.total,type:'INCOME',category:'Sales Income',transactionDate:date(row.day),note:`${marker} Historical Walk-in receipt recorded by owner instruction.`}});
    }
    if(income) await tx.account.update({where:{id:account.id},data:{balance:{increment:income}}});
    await tx.auditLog.create({data:{companyId,userId,action:'RECONCILE_NOTEBOOK',entity:'Sale',details:JSON.stringify({summary,originalOrders:orders})}});
    return summary;
  },{isolationLevel:'Serializable',timeout:60000});
  console.log(JSON.stringify({applied:process.argv.includes('--apply'),...result},null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
