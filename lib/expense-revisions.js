// Shared by Next.js and the long-running Telegram bot. No network/DB work at import time.
const OPEN = ['PENDING_APPROVAL', 'AWAITING_RECEIPT', 'RECEIPT_REVIEW'];
const ADMIN_IDS = new Set(['1836408854', '8230473166']);
const json = value => JSON.parse(JSON.stringify(value));
const money = value => Math.round(Number(value) * 100);
const paymentTypes = ['EXPENSE','DEBT_REPAID','INCOME'];
const signedPayment = p => (p.type === 'INCOME' ? -1 : 1) * money(p.amount);
const meta = (note, key) => String(note || '').match(new RegExp(`\\[${key}:\\s*([^\\]]*)\\]`))?.[1]?.trim() || '';
const cleanNote = note => String(note || '').replace(/\[(?:Dalbaday|TelegramId|PaymentPhone|RecipientName|Account|AccountId|ReceiptTelegramMessageId|TxId|AI-Verified|ExtractedAmount):[^\]]*\]/g, '').trim();
const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function assertAdmin(actor) {
  if (!actor || (!ADMIN_IDS.has(String(actor.id)) && !actor.local)) throw new Error('Admin permission required.');
}
function snapshot(expense) {
  return json({ amount: Number(expense.amount), accountId: expense.accountId, accountName: expense.account?.name || '',
    categoryId: expense.categoryId, category: expense.category, employeeId: expense.employeeId,
    employeeName: expense.employee?.fullName || '', note: cleanNote(expense.note),
    paymentPhone: meta(expense.note, 'PaymentPhone'), recipientName: meta(expense.note, 'RecipientName'),
    transportType: expense.transportType, equipmentName: expense.equipmentName, rentalPeriod: expense.rentalPeriod,
    consultantName: expense.consultantName, consultancyType: expense.consultancyType, subCategory: expense.subCategory,
    receiptUrl: expense.receiptUrl, receiptTransactionId: expense.receiptTransactionId || meta(expense.note,'TxId') || null,
    approved: expense.approved, paymentStatus: expense.paymentStatus, workflowStatus: expense.workflowStatus,
    description: expense.description });
}
function diff(before, proposed) {
  const fields = ['amount','accountId','employeeId','categoryId','recipientName','paymentPhone','note','transportType','equipmentName','rentalPeriod','consultantName','consultancyType','subCategory'];
  return fields.filter(k => String(before[k] ?? '') !== String(proposed[k] ?? '')).map(field => ({ field, before: before[field] ?? '', after: proposed[field] ?? '' }));
}
function settlementPlan(revision, mode) {
  const old = revision.payments;
  const proposed = revision.proposed;
  const total = old.reduce((s, p) => s + signedPayment(p), 0);
  const delta = money(proposed.amount) - total;
  const sameAccount = old.every(p => p.accountId === proposed.accountId);
  if (mode === 'CORRECTION') return { delta, total, correction: true };
  if (revision.before.employeeId !== proposed.employeeId) throw new Error('Employee changed: confirm a record correction to reconcile payroll.');
  if (!sameAccount) throw new Error('Account changed: manager must confirm a record correction with evidence.');
  if (mode === 'PAYMENT' && delta > 0) return { delta, total, correction: false };
  if (mode === 'REFUND' && delta < 0) return { delta, total, correction: false };
  if (mode === 'REVERIFY' && delta === 0) return { delta, total, correction: false };
  throw new Error('Settlement mode does not match the outstanding difference.');
}
async function audit(tx, revision, actor, action, details = {}) {
  await tx.financialAuditEvent.create({ data: { companyId: revision.companyId, actorId: String(actor.id), actorName: actor.name,
    actorSource: actor.source || 'TELEGRAM', action, entity: 'ExpenseRevision', entityId: revision.id, metadata: json(details) } });
}
async function getRevision(tx, id, companyId) {
  const r = await tx.expenseRevision.findFirst({ where: { id, companyId } });
  if (!r) throw new Error('Revision not found.');
  return r;
}
async function assertNoOpenRevision(db, expenseId) {
  // Row lock serializes legacy payment handlers with revision creation when
  // called inside their DB transaction.
  await db.$queryRawUnsafe('SELECT "_id" FROM "expenses" WHERE "_id" = $1 FOR UPDATE', expenseId);
  if (await db.expenseRevision.findFirst({ where: { expenseId, status: { in: OPEN } } })) {
    throw new Error('Edit-kan wuxuu sugayaa ansixin/rasiid. Isticmaal fariinta EDIT-ka cusub.');
  }
}
async function assertLegacyReceiptAllowed(db, expenseId) {
  await assertNoOpenRevision(db, expenseId);
  if (await db.expenseRevision.findFirst({ where: { expenseId, material: true, status: 'APPLIED' } })) {
    throw new Error('Receipt belongs to a confirmed edit. Start a new edit to replace it; old upload buttons are invalid.');
  }
}
async function createRevision(db, companyId, input, actor) {
  if (!actor?.id) throw new Error('Sign in through Telegram.');
  if (!String(input.reason || '').trim() || String(input.reason).length > 500) throw new Error('Sababta edit-ka waa khasab (ugu badnaan 500 xaraf).');
  if (!input.requestId || !Number.isInteger(input.expectedVersion)) throw new Error('Refresh the transaction before editing.');
  return db.$transaction(async tx => {
    const duplicate = await tx.expenseRevision.findUnique({ where: { requestId: input.requestId } });
    if (duplicate) {
      if (duplicate.companyId !== companyId || duplicate.expenseId !== input.id || duplicate.actorId !== String(actor.id)) throw new Error('Request conflict.');
      return duplicate;
    }
    const expense = await tx.expense.findFirst({ where: { id: input.id, companyId }, include: { account: true, employee: true } });
    if (!expense) throw new Error('Expense not found.');
    if (!actor.local && !ADMIN_IDS.has(String(actor.id)) && meta(expense.note,'TelegramId') !== String(actor.id)) throw new Error('You can only edit your own requests.');
    if (expense.version !== input.expectedVersion) throw new Error('Diiwaanka waa la beddelay. Refresh samee.');
    await assertNoOpenRevision(tx, expense.id);
    const before = snapshot(expense), proposed = { ...before };
    for (const key of ['amount','accountId','categoryId','employeeId','note','paymentPhone','recipientName','transportType','equipmentName','rentalPeriod','consultantName','consultancyType']) {
      if (input[key] !== undefined) proposed[key] = input[key];
    }
    if (input.billType !== undefined) proposed.subCategory = input.billType;
    const cents = money(proposed.amount);
    if (!Number.isFinite(cents) || cents <= 0 || cents > 999999999999 || Math.abs(Number(proposed.amount) * 100 - cents) > 0.00001) throw new Error('Enter a valid positive amount with at most two decimals.');
    proposed.amount = cents / 100;
    const account = await tx.account.findFirst({ where: { id: proposed.accountId, companyId, isActive: true } });
    if (!account) throw new Error('Account not found.');
    proposed.accountName = account.name;
    if (proposed.categoryId) {
      const category = await tx.expenseCategory.findFirst({ where: { id: proposed.categoryId, companyId } });
      if (!category) throw new Error('Category not found.');
      proposed.category = category.name;
    }
    if (proposed.employeeId) {
      const employee = await tx.employee.findFirst({ where: { id: proposed.employeeId, companyId } });
      if (!employee) throw new Error('Employee not found.');
      proposed.employeeName = employee.fullName;
    } else proposed.employeeName = '';
    const changes = diff(before, proposed);
    if (!changes.length) throw new Error('Wax isbeddel ah lama samayn.');
    const material = changes.some(c => ['amount','accountId','employeeId','recipientName','paymentPhone','categoryId'].includes(c.field));
    const payments = await tx.transaction.findMany({ where: { expenseId: expense.id, companyId, type: { in: paymentTypes }, reversedAt: null } });
    const r = await tx.expenseRevision.create({ data: { companyId, expenseId: expense.id, version: expense.version + 1,
      requestId: input.requestId, reason: input.reason.trim(), actorId: String(actor.id), actorName: actor.name,
      before, proposed: json(proposed), changes: json(changes), payments: json(payments), material,
      status: material ? 'PENDING_APPROVAL' : 'APPLIED', chatId: expense.telegramChatId || process.env.TELEGRAM_CHAT_ID || null } });
    const tags = ['Dalbaday','TelegramId'].map(key => meta(expense.note, key) ? `[${key}: ${meta(expense.note, key)}]` : '').filter(Boolean);
    const note = [proposed.note, ...tags, `[PaymentPhone: ${proposed.paymentPhone || ''}]`, `[RecipientName: ${proposed.recipientName || ''}]`].join('\n');
    await tx.expense.update({ where: { id: expense.id }, data: {
      amount: proposed.amount, accountId: proposed.accountId, paidFrom: proposed.accountName,
      category: proposed.category, categoryId: proposed.categoryId || null, employeeId: proposed.employeeId || null,
      description: proposed.note || proposed.category, note, transportType: proposed.transportType,
      equipmentName: proposed.equipmentName, rentalPeriod: proposed.rentalPeriod, consultantName: proposed.consultantName,
      consultancyType: proposed.consultancyType, subCategory: proposed.subCategory, version: { increment: 1 },
      ...(material ? { receiptUrl: null, receiptTransactionId: null, workflowStatus: 'REVISION_PENDING', approved: false } : {})
    } });
    if (material) {
      // Release only an actual reservation; never refund a historical payment on edit.
      const reservation = await tx.accountReservation.findUnique({ where: { expenseId: expense.id } });
      if (reservation?.status === 'ACTIVE') {
        await tx.account.update({ where: { id: reservation.accountId }, data: { reservedBalance: { decrement: reservation.amount } } });
        await tx.accountReservation.update({ where: { id: reservation.id }, data: { status: 'RELEASED', releasedAt: new Date() } });
        await tx.expense.update({ where: { id: expense.id }, data: { reservedAmount: 0 } });
      }
      await tx.receiptSession.updateMany({ where: { expenseId: expense.id, status: 'AWAITING_UPLOAD' }, data: { status: 'CANCELLED', completedAt: new Date() } });
    }
    await audit(tx, r, actor, 'EDIT_CREATED', { before, proposed, changes });
    return r;
  }, { isolationLevel: 'Serializable', timeout: 15000 });
}
async function approveRevision(db, companyId, id, actor, reject = false) {
  assertAdmin(actor);
  return db.$transaction(async tx => {
    const r = await getRevision(tx, id, companyId);
    if (r.status !== 'PENDING_APPROVAL') throw new Error('This revision has already been reviewed.');
    if (reject) {
      const b = r.before;
      const expense = await tx.expense.findUnique({ where: { id: r.expenseId } });
      const tags = ['Dalbaday','TelegramId'].map(k => meta(expense.note,k) ? `[${k}: ${meta(expense.note,k)}]` : '').filter(Boolean);
      const { accountName, employeeName, paymentPhone, recipientName, ...fields } = b;
      await tx.expense.update({ where: { id: r.expenseId }, data: { ...fields,
        note: [b.note,...tags,`[PaymentPhone: ${paymentPhone}]`,`[RecipientName: ${recipientName}]`].join('\n'),
        paidFrom: accountName, version: { increment: 1 } } });
    }
    const updated = await tx.expenseRevision.update({ where: { id }, data: { status: reject ? 'REJECTED' : 'AWAITING_RECEIPT', approvedBy: String(actor.id), syncStatus: 'PENDING', originalSynced: false } });
    await audit(tx, r, actor, reject ? 'EDIT_REJECTED' : 'EDIT_APPROVED');
    return updated;
  }, { isolationLevel: 'Serializable' });
}
async function submitRevisionReceipt(db, companyId, id, actor, receiptUrl, receiptRef) {
  if (!receiptUrl || !String(receiptRef || '').trim()) throw new Error('Ku qor Transaction ID-ga rasiidka caption-ka.');
  return db.$transaction(async tx => {
    const r = await getRevision(tx, id, companyId);
    if (r.status !== 'AWAITING_RECEIPT') throw new Error('Revision is not awaiting a receipt.');
    receiptRef = String(receiptRef).trim();
    if (receiptUrl === r.before.receiptUrl || r.payments.some(p => p.receiptUrl === receiptUrl) || (r.before.receiptTransactionId && receiptRef === r.before.receiptTransactionId)) throw new Error('Use a new receipt, not the archived receipt.');
    if (await tx.expense.findFirst({ where: { receiptTransactionId: receiptRef } }) || await tx.receiptVerification.findFirst({ where: { transactionReference: receiptRef } })) throw new Error('Receipt reference already used.');
    const updated = await tx.expenseRevision.update({ where: { id }, data: { receiptUrl, receiptRef: receiptRef.trim(), status: 'RECEIPT_REVIEW', syncStatus: 'PENDING', originalSynced: false } });
    await audit(tx, r, actor, 'EDIT_RECEIPT_SUBMITTED', { receiptRef });
    return updated;
  }, { isolationLevel: 'Serializable' });
}
async function confirmRevision(db, companyId, id, actor, mode) {
  assertAdmin(actor);
  return db.$transaction(async tx => {
    const r = await getRevision(tx, id, companyId);
    if (r.status === 'APPLIED') return r; // Telegram retries must not move money twice.
    if (r.status !== 'RECEIPT_REVIEW' || !r.receiptUrl || !r.receiptRef) throw new Error('New evidence and approval are required.');
    const plan = settlementPlan(r, mode), p = r.proposed;
    const current = await tx.transaction.findMany({ where: { expenseId: r.expenseId, companyId, type: { in: paymentTypes }, reversedAt: null } });
    if (current.length !== r.payments.length || current.some(t => !r.payments.some(old => old.id === t.id && money(old.amount) === money(t.amount) && old.accountId === t.accountId))) throw new Error('Ledger changed since edit. Resolve before confirming.');
    const expense = await tx.expense.findUnique({ where: { id: r.expenseId } });
    // Append actual deltas, never erase or mutate original settled transactions.
    const entries = [];
    if (plan.correction) {
      for (const payment of current) entries.push({ accountId: payment.accountId, employeeId: payment.employeeId, debit: -signedPayment(payment), reversalOfId: payment.id });
      entries.push({ accountId: p.accountId, employeeId: p.employeeId, debit: money(p.amount) });
    } else if (plan.delta) entries.push({ accountId: p.accountId, employeeId: p.employeeId, debit: plan.delta });
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const account = await tx.account.findFirst({ where: { id: entry.accountId, companyId } });
      if (!account || (entry.debit > 0 && entry.debit > money(account.balance) - money(account.reservedBalance))) throw new Error('Insufficient available funds. No money moved.');
      await tx.account.update({ where: { id: entry.accountId }, data: { balance: { decrement: entry.debit / 100 } } });
      await tx.transaction.create({ data: { companyId, expenseId: r.expenseId, accountId: entry.accountId, employeeId: entry.employeeId || null,
        userId: expense.userId, type: entry.debit > 0 ? 'EXPENSE' : 'INCOME', amount: Math.abs(entry.debit) / 100,
        description: `${mode}: ${p.note || p.category}`, receiptUrl: r.receiptUrl, idempotencyKey: `revision:${r.id}:${i}`, category: p.category,
        reversalOfId: entry.reversalOfId || null, balanceBefore: account.balance, balanceAfter: Number(account.balance) - entry.debit / 100,
        note: `Revision ${r.id}; ${mode}`, transactionDate: new Date() } });
    }
    await tx.expense.update({ where: { id: r.expenseId }, data: { paymentStatus: 'PAID', workflowStatus: 'PAID', approved: true,
      receiptUrl: r.receiptUrl, receiptTransactionId: r.receiptRef, paymentDate: new Date(), version: { increment: 1 } } });
    for (const employeeId of new Set([r.before.employeeId,p.employeeId].filter(Boolean))) {
      const now = new Date();
      const rows = await tx.transaction.findMany({ where: { companyId, employeeId, reversedAt: null, type: { in: paymentTypes }, transactionDate: { gte: new Date(now.getFullYear(),now.getMonth(),1) } } });
      await tx.employee.update({ where: { id: employeeId }, data: { salaryPaidThisMonth: rows.reduce((sum,t) => sum + signedPayment(t),0) / 100 } });
    }
    const updated = await tx.expenseRevision.update({ where: { id }, data: { status: 'APPLIED', settlementMode: mode, confirmedBy: String(actor.id), syncStatus: 'PENDING', originalSynced: false } });
    await audit(tx, r, actor, 'EDIT_SETTLED', { mode, entries, before: r.payments, newAmount: p.amount, receiptRef: r.receiptRef });
    return updated;
  }, { isolationLevel: 'Serializable', timeout: 15000 });
}
module.exports = { OPEN, ADMIN_IDS, snapshot, diff, settlementPlan, escapeHtml, assertNoOpenRevision, assertLegacyReceiptAllowed, createRevision, approveRevision, submitRevisionReceipt, confirmRevision };
