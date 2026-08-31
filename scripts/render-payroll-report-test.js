const {jsPDF}=require('jspdf');const {autoTable}=require('jspdf-autotable');
const {drawPayrollReport}=require('../lib/payroll-report-pdf');const {groupPayroll}=require('../lib/payroll-report');
const fs=require('fs'),path=require('path');
const rows=Array.from({length:30},(_,i)=>({id:String(i),isSalary:true,employeeId:i<20?'a':'b',person:i<20?'Aadan Maxamed':'Bashiir Cabdi',date:'2026-08-20',salaryType:i%3?'REGULAR':'ADVANCE',description:i%4?'Monthly salary payment':'Salary advance for employee - longer description to verify wrapping and readability',account:'E-Birr Merchant',outflow:500+i*10,inflow:0}));
const doc=new jsPDF();doc.setFontSize(12);doc.text('AN INDUSTRIES PARTNERSHIP - DEMO',15,18);doc.setFontSize(9);doc.text('August 2026 | Prepared by: Test User',15,25);
drawPayrollReport(doc,autoTable,groupPayroll(rows),40);
fs.mkdirSync(path.join(__dirname,'../output/pdf'),{recursive:true});doc.save(path.join(__dirname,'../output/pdf/payroll-layout-test.pdf'));
console.log(`Generated ${doc.getNumberOfPages()} pages with 30 sample payments.`);
