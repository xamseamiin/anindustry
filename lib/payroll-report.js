const clean = value => String(value || '').replace(/\[[^\]]*\]/g, '').trim();
function isSalaryCategory(value) {
  return /^(salary|salaries|payroll|mushahar(?:ka|ada)?|mushaar(?:ka|ada)?)(?:\b|\s|$)/i.test(String(value || '').trim());
}
function payrollDetails(tx) {
  const expense = tx.expense;
  const category = expense?.category || tx.category || '';
  const salary = isSalaryCategory(category) || /^mushaharka:|^mushaarka:|^salary:/i.test(tx.description || '');
  const description = clean(tx.description || expense?.note || expense?.description);
  const advance = salary && /\b(hormaris\w*|hormar\w*|horumaris\w*|advance\w*)\b/i.test(description);
  return { salary, salaryType: salary ? (advance ? 'ADVANCE' : 'REGULAR') : null,
    employeeId: tx.employeeId || expense?.employeeId || null,
    employeeName: tx.employee?.fullName || expense?.employee?.fullName || null };
}
function groupPayroll(ledger) {
  const groups = new Map();
  for (const row of ledger.filter(r => r.isSalary)) {
    const key = row.employeeId || `unlinked:${row.person || 'unknown'}`;
    if (!groups.has(key)) groups.set(key, { employeeId: row.employeeId, name: row.person || 'Shaqaale aan la aqoonsan', paid: 0, advances: 0, refunds: 0, netPaid: 0, transactions: [] });
    const group = groups.get(key);
    group.paid += row.outflow; group.refunds += row.inflow;
    if (row.salaryType === 'ADVANCE') group.advances += row.outflow;
    group.netPaid = group.paid - group.refunds; group.transactions.push(row);
  }
  return [...groups.values()].sort((a,b) => a.name.localeCompare(b.name));
}
module.exports = { clean, isSalaryCategory, payrollDetails, groupPayroll };
