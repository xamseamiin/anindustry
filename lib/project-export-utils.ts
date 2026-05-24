import * as XLSX from 'xlsx';

/**
 * Utility to export a single project's full details to an Excel workbook.
 * This can be used both from the project detail page and from the bulk list page.
 * 
 * @param project The full project object (including expenses, materials, labor, payments, transactions)
 * @returns The XLSX workbook object
 */
export const generateProjectExcelWorkbook = (project: any) => {
  const workbook = XLSX.utils.book_new();

  // --- 1. PRE-CALCULATIONS (Same logic as in detail page) ---
  const expenses = project.expenses || [];
  const laborRecords = project.laborRecords || [];
  const transactions = project.transactions || [];

  const totalValue = typeof project.agreementAmount === 'number' ? project.agreementAmount : parseFloat(project.agreementAmount as any) || 0;
  const advancePaid = typeof project.advancePaid === 'number' ? project.advancePaid : parseFloat(project.advancePaid as any) || 0;
  
  const repayments = transactions
    .filter((t: any) => t.type === 'DEBT_REPAID' && (t.customerId || !t.vendorId))
    .reduce((sum: number, t: any) => sum + Math.abs(typeof t.amount === 'number' ? t.amount : parseFloat(t.amount as any) || 0), 0);
  
  const paymentsSum = (project.payments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const totalPaid = advancePaid + repayments + paymentsSum;
  const remainingAmount = totalValue - totalPaid;

  const expensesByCategory = expenses.reduce((acc: any, exp: any) => {
    const cat = exp.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exp);
    return acc;
  }, {});

  const getCategoryTotal = (catName: string) => {
    return (expensesByCategory[catName] || []).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  };

  const catTotals = {
    materials: getCategoryTotal('Material'),
    labor: getCategoryTotal('Labor'),
    transport: getCategoryTotal('Transport'),
    utilities: getCategoryTotal('Utilities'),
    equipment: getCategoryTotal('Equipment'),
    consultancy: getCategoryTotal('Consultancy') || getCategoryTotal('Subcontractor'),
  };

  // Adjust total expenses to avoid double counting labor if a labor expense exists
  let totalExpenses = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  if (catTotals.labor === 0) {
    totalExpenses += laborRecords.reduce((sum: number, l: any) => sum + (Number(l.paidAmount) || 0), 0);
  }

  // --- 2. SHEET GENERATION ---

  // Sheet 1: Guudmar (Summary)
  const summaryData = [{
    'Mashruuca (Project)': project.name,
    'Macmiil (Client)': project.customer?.name || project.customer || '-',
    'Heshiis (Amount)': totalValue,
    'La Bixiyay (Paid)': totalPaid,
    'Hadhay (Remaining)': remainingAmount,
    'Agabka (Materials)': catTotals.materials,
    'Shaqaalaha (Labor)': catTotals.labor,
    'Gidka/Transport (Transport)': catTotals.transport,
    'Adeegyada (Utilities)': catTotals.utilities,
    'Qalabka (Equipment)': catTotals.equipment,
    'La-talin (Consultancy)': catTotals.consultancy,
    'Guud ahaan (Total Expenses)': totalExpenses,
    "Faa'iido (Net Profit)": totalPaid - totalExpenses,
    'Xaalad (Status)': project.status,
    'Nooca (Type)': project.projectType || '-',
    'Taariikh (Date)': new Date().toLocaleDateString(),
  }];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
    { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Guudmar');

  // Sheet 2: Kharashaadka (Expenses)
  const allExpenses: any[] = [];
  Object.entries(expensesByCategory).forEach(([category, exps]: [string, any]) => {
    exps.forEach((exp: any) => {
      allExpenses.push({
        'Sharaxaad (Description)': exp.description,
        'Nooc (Category)': category,
        'Taariikhda (Date)': new Date(exp.expenseDate).toLocaleDateString(),
        'Qadarka (Amount Br)': typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0
      });
    });
  });
  if (allExpenses.length > 0) {
    const totalExpAmt = allExpenses.reduce((sum, e) => sum + e['Qadarka (Amount Br)'], 0);
    allExpenses.push({
      'Sharaxaad (Description)': 'WADARTA (TOTAL)',
      'Nooc (Category)': '',
      'Taariikhda (Date)': '',
      'Qadarka (Amount Br)': totalExpAmt
    });
    const wsExpenses = XLSX.utils.json_to_sheet(allExpenses);
    wsExpenses['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsExpenses, 'Kharashaadka');
  }

  // Sheet 3: Agabka (Materials) - Source from Expenses Material category for truth
  const materialExpenses = expensesByCategory['Material'] || [];
  const materialsData = materialExpenses.map((exp: any) => ({
    'Magaca Agabka (Material)': exp.description,
    'La Isticmaalay (Used)': '1 pcs', // Placeholder if not split by units
    'Hadhay (Leftover)': '0 pcs',
    'Qiimaha/Hal (Cost/Unit)': Number(exp.amount) || 0,
    'Wadarta (Total Cost)': Number(exp.amount) || 0,
    'Taariikhda (Date)': exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : '-'
  }));
  if (materialsData.length > 0) {
    const totalMatAmt = materialsData.reduce((sum: number, m: any) => sum + m['Wadarta (Total Cost)'], 0);
    materialsData.push({
      'Magaca Agabka (Material)': 'WADARTA (TOTAL)',
      'La Isticmaalay (Used)': '',
      'Hadhay (Leftover)': '',
      'Qiimaha/Hal (Cost/Unit)': 0,
      'Wadarta (Total Cost)': totalMatAmt,
      'Taariikhda (Date)': ''
    });
    const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
    wsMaterials['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsMaterials, 'Agabka');
  }

  // Sheet 4: Shaqaalaha (Labor)
  const laborData = (project.laborRecords || []).map((lab: any) => ({
    'Shaqaalaha (Employee)': lab.employeeName || lab.employee?.fullName || 'Unknown',
    'Sharaxaad (Work)': lab.workDescription || '-',
    'La Heshiiyay (Agreed)': typeof lab.agreedWage === 'number' ? lab.agreedWage : parseFloat(lab.agreedWage as any) || 0,
    'La Bixiyay (Paid)': typeof lab.paidAmount === 'number' ? lab.paidAmount : parseFloat(lab.paidAmount as any) || 0,
    'Hadhay (Remaining)': typeof lab.remainingWage === 'number' ? lab.remainingWage : parseFloat(lab.remainingWage as any) || 0,
    'Taariikhda (Date)': lab.dateWorked ? new Date(lab.dateWorked).toLocaleDateString() : '-'
  }));
  if (laborData.length > 0) {
    const totalLabPaid = laborData.reduce((sum: number, l: any) => sum + l['La Bixiyay (Paid)'], 0);
    const totalLabRemaining = laborData.reduce((sum: number, l: any) => sum + l['Hadhay (Remaining)'], 0);
    laborData.push({
      'Shaqaalaha (Employee)': 'WADARTA (TOTAL)',
      'Sharaxaad (Work)': '',
      'La Heshiiyay (Agreed)': 0,
      'La Bixiyay (Paid)': totalLabPaid,
      'Hadhay (Remaining)': totalLabRemaining,
      'Taariikhda (Date)': ''
    });
    const wsLabor = XLSX.utils.json_to_sheet(laborData);
    wsLabor['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsLabor, 'Shaqaalaha');
  }

  // Sheet 5: Lacag Helitaan (Payments)
  const allIncomings = [
    ...(project.advancePaid > 0 ? [{
      'Sharaxaad (Description)': 'Horumaris (Advance) - Heshiiska',
      'Taariikhda (Date)': new Date(project.createdAt).toLocaleDateString(),
      'Qadarka (Amount Br)': Number(project.advancePaid) || 0
    }] : []),
    ...(project.transactions || [])
      .filter((t: any) => t.type === 'DEBT_REPAID' && (t.customerId || !t.vendorId))
      .map((t: any) => ({
        'Sharaxaad (Description)': t.description || 'Deyn Bixin (Customer)',
        'Taariikhda (Date)': new Date(t.transactionDate).toLocaleDateString(),
        'Qadarka (Amount Br)': Math.abs(typeof t.amount === 'number' ? t.amount : parseFloat(t.amount as any) || 0)
      })),
    ...(project.payments || []).map((p: any) => ({
      'Sharaxaad (Description)': `Lacag Bixin - ${p.receivedIn || 'Akoon'}`,
      'Taariikhda (Date)': new Date(p.paymentDate).toLocaleDateString(),
      'Qadarka (Amount Br)': Number(p.amount) || 0
    }))
  ].sort((a, b) => new Date(b['Taariikhda (Date)']).getTime() - new Date(a['Taariikhda (Date)']).getTime());
  
  if (allIncomings.length > 0) {
    const totalPaymentsAmt = allIncomings.reduce((sum, p) => sum + p['Qadarka (Amount Br)'], 0);
    allIncomings.push({
      'Sharaxaad (Description)': 'WADARTA (TOTAL)',
      'Taariikhda (Date)': '',
      'Qadarka (Amount Br)': totalPaymentsAmt
    });
    const wsPayments = XLSX.utils.json_to_sheet(allIncomings);
    wsPayments['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsPayments, 'Lacagta_La_Dhiibay');
  }

  // Sheet 6: Dhaqdhaqaaqaadka (All Transactions)
  const allTransactionsData = (project.transactions || [])
    .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .map((trx: any) => ({
      'Taariikhda (Date)': new Date(trx.transactionDate).toLocaleDateString(),
      'Nooca (Type)': trx.type,
      'Account': trx.account?.name || trx.accountId || '-',
      'Sharaxaad (Description)': trx.description || '-',
      'Qadarka (Amount Br)': typeof trx.amount === 'number' ? trx.amount : parseFloat(trx.amount as any) || 0
    }));
  if (allTransactionsData.length > 0) {
    const wsAllTrx = XLSX.utils.json_to_sheet(allTransactionsData);
    wsAllTrx['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsAllTrx, 'Dhaqdhaqaaqaadka');
  }

  return workbook;
};

/**
 * Triggers a download of the project Excel workbook.
 */
export const downloadProjectExcel = (project: any) => {
  const workbook = generateProjectExcelWorkbook(project);
  XLSX.writeFile(workbook, `Project_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
