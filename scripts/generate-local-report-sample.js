const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const money = value => `${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB`;
const imageData = file => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;

async function main() {
  const response = await fetch('http://localhost:3001/api/telegram/reports?reportType=DAILY');
  if (!response.ok) throw new Error(`Report API failed: ${response.status}`);
  const { report } = await response.json();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const navy = [11, 26, 51];
  const green = [8, 157, 104];
  const pale = [243, 247, 249];
  const red = [220, 38, 38];
  const logo = imageData(path.join(process.cwd(), 'public', 'an-industory-logo.png'));
  const date = new Date(report.period.end).toLocaleDateString('en-CA');
  const ref = `AN-${date.replaceAll('-', '')}`;

  // One-page branded top bar.
  doc.setFillColor(...pale); doc.rect(0, 0, width, 46, 'F');
  doc.addImage(logo, 'PNG', 15, 8, 31, 31);
  doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.text('AN-INDUSTORY', 52, 23);
  doc.setTextColor(...green); doc.setFontSize(11); doc.text('DAILY FINANCIAL REPORT', 52, 32);
  doc.setFontSize(8); doc.setTextColor(90); doc.setFont('helvetica', 'normal'); doc.text('Factory Financial Operations', 52, 38);
  const metaX = 208;
  [['DATE', date], ['REF NUMBER', ref], ['PREPARED BY', report.generatedBy || 'Local Admin']].forEach(([label, value], i) => {
    const y = 14 + i * 10; doc.setFont('helvetica', 'bold'); doc.setTextColor(...navy); doc.text(label, metaX, y);
    doc.setFont('helvetica', 'normal'); doc.text(String(value), metaX + 29, y);
  });
  doc.setDrawColor(...green); doc.setLineWidth(0.7); doc.line(15, 46, width - 15, 46);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(...navy); doc.setFontSize(13); doc.text('Account Balance', 15, 57);
  autoTable(doc, {
    startY: 62, margin: { left: 15, right: 15 }, theme: 'plain',
    head: [['ACCOUNT', 'OPENING BALANCE', 'CURRENT BALANCE', 'CHANGE']],
    body: report.accounts.map(account => [account.name, money(report.summary.openingBalance), money(report.summary.closingBalance), money(report.summary.netCashFlow)]),
    headStyles: { textColor: navy, fontStyle: 'bold', lineColor: [185, 190, 195], lineWidth: { bottom: 0.6 }, cellPadding: 2.4 },
    bodyStyles: { textColor: [35, 46, 60], lineColor: [224, 228, 232], lineWidth: { bottom: 0.25 }, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right', textColor: report.summary.netCashFlow < 0 ? red : green, fontStyle: 'bold' } }
  });

  const summaryY = doc.lastAutoTable.finalY + 9;
  doc.setFontSize(13); doc.text('Cash Summary', 15, summaryY);
  const cards = [['MONEY IN', report.summary.totalIn, green], ['MONEY OUT', report.summary.totalOut, red], ['AVAILABLE BALANCE', report.summary.available, navy]];
  cards.forEach(([label, value, color], i) => {
    const x = 15 + i * 89; doc.setFillColor(...pale); doc.roundedRect(x, summaryY + 5, 82, 18, 2, 2, 'F');
    doc.setTextColor(90); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.text(label, x + 5, summaryY + 12);
    doc.setTextColor(...color); doc.setFontSize(11); doc.text(money(value), x + 77, summaryY + 17, { align: 'right' });
  });

  const expenseY = summaryY + 34;
  doc.setTextColor(...navy); doc.setFontSize(13); doc.text('Expense Details', 15, expenseY);
  const rows = report.ledger.filter(x => x.outflow > 0).slice(0, 8).map(x => [
    new Date(x.date).toLocaleDateString('en-GB'), x.category || 'General', x.requester || x.recipient || '-', x.description || '-', money(x.outflow)
  ]);
  autoTable(doc, {
    startY: expenseY + 5, margin: { left: 15, right: 15 }, theme: 'plain',
    head: [['DATE', 'CATEGORY', 'EMPLOYEE / VENDOR', 'DESCRIPTION', 'AMOUNT']],
    body: rows.length ? rows : [['-', 'No expenses', '-', '-', money(0)]],
    foot: [['', '', '', 'TOTAL EXPENSE', money(report.summary.totalOut)]],
    headStyles: { textColor: navy, fontStyle: 'bold', lineColor: [185, 190, 195], lineWidth: { bottom: 0.6 }, cellPadding: 2.3 },
    bodyStyles: { textColor: [35, 46, 60], lineColor: [228, 231, 234], lineWidth: { bottom: 0.2 }, cellPadding: 2.3, fontSize: 8 },
    footStyles: { textColor: navy, fontStyle: 'bold', fillColor: [250, 250, 250], halign: 'right' },
    columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 50 }, 2: { cellWidth: 55 }, 3: { cellWidth: 96 }, 4: { halign: 'right', fontStyle: 'bold' } }
  });

  doc.setDrawColor(...green); doc.line(15, 194, width - 15, 194);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(105);
  doc.text('AN-Industory financial system - locally generated report', 15, 199);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, width - 15, 199, { align: 'right' });

  const outDir = path.join(process.cwd(), 'output', 'pdf'); fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'AN-Industory-One-Page-Daily-Financial-Report.pdf');
  fs.writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
  console.log(out);
}

main().catch(error => { console.error(error); process.exit(1); });
