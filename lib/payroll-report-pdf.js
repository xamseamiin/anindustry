function drawPayrollReport(doc, autoTable, groups, startY = 66) {
  const width=doc.internal.pageSize.getWidth(), height=doc.internal.pageSize.getHeight();
  const money=n=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  let y=startY;
  for(const group of groups) {
    if(y>height-65){doc.addPage();y=20;}
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(7,23,47);
    const name=doc.splitTextToSize(group.name,width-30);doc.text(name,15,y);y+=name.length*5;
    doc.setFont('helvetica','normal');doc.setFontSize(8);
    doc.text(`Paid: ${money(group.paid)} ETB | Advances: ${money(group.advances)} ETB | Refunds: ${money(group.refunds)} ETB`,15,y+2);
    doc.setDrawColor(21,155,80);doc.line(15,y+5,width-15,y+5);
    autoTable(doc,{startY:y+8,margin:{top:18,left:15,right:15,bottom:18},theme:'plain',showHead:'everyPage',rowPageBreak:'avoid',
      head:[['DATE','TYPE','DESCRIPTION','ACCOUNT','PAID ETB','RETURNED ETB']],
      body:group.transactions.map(r=>[new Date(r.date).toLocaleDateString('en-GB',{timeZone:'Africa/Nairobi'}),r.salaryType==='ADVANCE'?'Advance':'Salary',r.description||'-',r.account||'-',r.outflow?money(r.outflow):'-',r.inflow?money(r.inflow):'-']),
      foot:[['','','NET PAID TO EMPLOYEE','',money(group.netPaid),'']],showFoot:'lastPage',
      styles:{fontSize:8,cellPadding:2.2,overflow:'linebreak'},
      headStyles:{fontStyle:'bold',textColor:[7,23,47],lineWidth:{bottom:0.5},lineColor:[185,190,195]},
      bodyStyles:{textColor:[7,23,47],lineWidth:{bottom:0.15},lineColor:[228,231,234]},
      footStyles:{fontStyle:'bold',fillColor:[240,248,244],textColor:[21,125,70]},
      columnStyles:{0:{cellWidth:23},1:{cellWidth:19},2:{cellWidth:'auto'},3:{cellWidth:28},4:{cellWidth:25,halign:'right'},5:{cellWidth:25,halign:'right'}}});
    y=doc.lastAutoTable.finalY+12;
  }
  return y;
}
module.exports={drawPayrollReport};
