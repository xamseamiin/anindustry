const {test}=require('node:test');const assert=require('node:assert/strict');
const {isSalaryCategory,payrollDetails,groupPayroll}=require('../lib/payroll-report');
test('salary aliases do not depend on database category options',()=>{
 for(const name of ['Salary','SALARY','Salaries','Mushahar','Mushaharka','Mushaar'])assert(isSalaryCategory(name));
 assert(!isSalaryCategory('Transport & Fuel'));
});
test('advances are recognized, with linked ledger employee preferred',()=>{
 const p=payrollDetails({category:'Salaries',description:'Mushaharka: Aadan (Hormaris mushaar)',employeeId:'a',employee:{fullName:'Aadan'},expense:{employeeId:'b',employee:{fullName:'Other'}}});
 assert.equal(p.salaryType,'ADVANCE');assert.equal(p.employeeId,'a');assert.equal(p.employeeName,'Aadan');
 assert.equal(payrollDetails({category:'Salary',description:'Monthly pay'}).salaryType,'REGULAR');
 assert.equal(payrollDetails({category:'Rent',description:'Advance rent'}).salary,false);
});
test('employee groups preserve every payment, advances and refunds without double counting',()=>{
 const rows=[{id:'1',isSalary:true,employeeId:'a',person:'Aadan',salaryType:'ADVANCE',outflow:500,inflow:0},{id:'2',isSalary:true,employeeId:'a',person:'Aadan',salaryType:'REGULAR',outflow:2000,inflow:0},{id:'3',isSalary:true,employeeId:'a',person:'Aadan',outflow:0,inflow:100},{id:'4',isSalary:true,employeeId:'b',person:'Bashiir',outflow:900,inflow:0}];
 const groups=groupPayroll(rows);assert.equal(groups.length,2);assert.equal(groups[0].transactions.length,3);assert.equal(groups[0].paid,2500);assert.equal(groups[0].advances,500);assert.equal(groups[0].netPaid,2400);
});
