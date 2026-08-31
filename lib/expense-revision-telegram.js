const { escapeHtml: e } = require('./expense-revisions');
const ok = response => response?.ok || /message is not modified/i.test(response?.description || '');
const short = value => e(String(value ?? '').slice(0, 80));
function revisionMessage(r) {
  const p = r.proposed, b = r.before;
  const labels = { amount:'Lacag',accountId:'Account',employeeId:'Shaqaale',recipientName:'Loo dirayo',paymentPhone:'Lambar',note:'Sharaxaad',categoryId:'Qaybta' };
  const changes = r.changes.map(c => {
    let before = c.before, after = c.after;
    if (c.field === 'accountId') { before = b.accountName; after = p.accountName; }
    if (c.field === 'employeeId') { before = b.employeeName; after = p.employeeName; }
    if (c.field === 'categoryId') { before = b.category; after = p.category; }
    return `${labels[c.field] || c.field}: ${short(before)} → ${short(after)}`;
  }).join('\n');
  const status = { PENDING_APPROVAL:'Sugaya ansixin cusub',AWAITING_RECEIPT:'La ansixiyey — gali rasiidka cusub',RECEIPT_REVIEW:'Rasiid la helay — sugaya xaqiijinta manager-ka',APPLIED:'Isbeddelka waa la dhammaystiray',REJECTED:'Edit-ka waa la diiday; xogtii hore waa la soo celiyey' };
  return `<b>AN-Industry — Wax ka beddel #${r.version}</b>\n${e(status[r.status] || r.status)}\n\n` +
    `${changes}\n\nFarqiga dalabka: ${(Number(p.amount)-Number(b.amount)).toFixed(2)} ETB\n` +
    `Sababta: ${short(r.reason)}\nWax ka beddelay: ${short(r.actorName)}\n` +
    `Account: ${short(p.accountName)}\nLoo dirayo: ${short(p.employeeName || p.recipientName)}\n` +
    (r.status === 'APPLIED' ? `Xaqiijin: ${e(r.settlementMode || 'Qoraal keliya')}\n` : 'Edit keliya balance ma beddelo.\n') +
    `ID: <code>${e(r.id)}</code>`;
}
function revisionButtons(r) {
  if (r.status === 'PENDING_APPROVAL') return { inline_keyboard: [[{text:'Oggolow edit-ka',callback_data:`rv_approve_${r.id}`},{text:'Diid edit-ka',callback_data:`rv_reject_${r.id}`}]] };
  if (r.status === 'AWAITING_RECEIPT') return { inline_keyboard: [[{text:'Gali rasiidka CUSUB',callback_data:`rv_upload_${r.id}`}]] };
  if (r.status === 'RECEIPT_REVIEW') {
    const total = r.payments.reduce((sum,t) => sum + (t.type === 'INCOME' ? -1 : 1)*Number(t.amount),0);
    const delta = Math.round((Number(r.proposed.amount)-total)*100)/100;
    const same = r.payments.every(t => t.accountId === r.proposed.accountId) && r.before.employeeId === r.proposed.employeeId;
    const buttons = [];
    if (same) buttons.push([{text:delta>0?`Xaqiiji bixinta ${delta} ETB`:delta<0?`Xaqiiji soo-celinta ${-delta} ETB`:'Xaqiiji rasiidka (0 ETB)',callback_data:`rv_${delta>0?'PAYMENT':delta<0?'REFUND':'REVERIFY'}_${r.id}`}]);
    buttons.push([{text:'Sixitaan diiwaan hore (ma aha bixin cusub)',callback_data:`rv_CORRECTION_${r.id}`}]);
    return { inline_keyboard: buttons };
  }
  return { inline_keyboard: [] };
}
async function telegramRequest(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Telegram not configured.');
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:AbortSignal.timeout(15000) });
  return res.json();
}
async function syncExpenseRevision(db, id, request = telegramRequest) {
  if (process.env.TELEGRAM_NOTIFICATIONS_DISABLED === 'true') return { status:'DISABLED' };
  // Durable claim avoids two retries sending the same edit notice simultaneously.
  const claim = await db.expenseRevision.updateMany({ where:{ id, syncStatus:{in:['PENDING','FAILED']} }, data:{syncStatus:'SENDING'} });
  if (!claim.count) return {status:(await db.expenseRevision.findUnique({where:{id}}))?.syncStatus || 'FAILED'};
  let sendingNotice = false;
  try {
    const r = await db.expenseRevision.findUnique({where:{id}});
    const expense = await db.expense.findUnique({where:{id:r.expenseId}});
    if (!r.chatId) throw new Error('No chat configured.');
    const text = revisionMessage(r), reply_markup = revisionButtons(r);
    if (!r.messageId) {
      sendingNotice = true;
      const sent = await request('sendMessage',{chat_id:r.chatId,text,parse_mode:'HTML',reply_markup});
      if (!sent?.ok) { sendingNotice = false; throw new Error('Notice failed.'); }
      await db.expenseRevision.update({where:{id},data:{messageId:sent.result.message_id}});
      sendingNotice = false;
    } else {
      const edited = await request('editMessageText',{chat_id:r.chatId,message_id:r.messageId,text,parse_mode:'HTML',reply_markup});
      if (!ok(edited)) throw new Error('Notice edit failed.');
    }
    const latest = await db.expenseRevision.findFirst({where:{expenseId:r.expenseId},orderBy:{version:'desc'}});
    if (!r.originalSynced && expense.telegramMessageId && latest?.id === r.id) {
      const p = r.status === 'REJECTED' ? r.before : r.proposed;
      const caption = `<b>AN-Industry — ${e(r.status)}</b>\nQaybta: ${short(p.category)}\nLacagta: ${Number(p.amount).toFixed(2)} ETB\nLoo dirayo: ${short(p.employeeName || p.recipientName)}\nAccount: ${short(p.accountName)}\nSharaxaad: ${short(p.note)}\n\n${r.material && !['APPLIED','REJECTED'].includes(r.status) ? 'Rasiidkii hore waa laga noqday; sugaya xaqiijin cusub.' : 'Faahfaahinta isbeddelka waxay ku jirtaa fariinta EDIT-ka.'}`;
      // A text-only edit (or rejection) must not strand an unpaid request by
      // removing its original approval/upload controls.
      let originalButtons = revisionButtons(r);
      if (!r.material || r.status === 'REJECTED') {
        originalButtons = r.before.paymentStatus === 'PAID' ? {inline_keyboard:[]} : !r.before.approved
          ? {inline_keyboard:[[{text:'Oggolow',callback_data:`approve_exp_${r.expenseId}`},{text:'Diid',callback_data:`reject_exp_${r.expenseId}`}]]}
          : {inline_keyboard:[[{text:'Gali Rasiidka',callback_data:`rcpt_${r.expenseId}`}]]};
      }
      const base = {chat_id:r.chatId,message_id:expense.telegramMessageId,parse_mode:'HTML',reply_markup:originalButtons};
      let result;
      const receipt = r.status === 'APPLIED' ? (r.receiptUrl || r.before.receiptUrl) : r.status === 'REJECTED' ? r.before.receiptUrl : null;
      const fileId = receipt ? new URL(receipt,'https://anindustry.online').searchParams.get('fileId') : null;
      if (fileId) {
        result = await request('editMessageMedia',{...base,media:{type:'photo',media:fileId,caption,parse_mode:'HTML'}});
      } else {
        result = await request('editMessageText',{...base,text:caption});
        if (!ok(result) && r.material && r.status !== 'REJECTED') {
          // Telegram cannot remove media to turn a photo into text. Replace only
          // the visible old receipt with the company logo, preserving message ID.
          result = await request('editMessageMedia',{...base,media:{type:'photo',media:'https://anindustry.online/logo.png',caption,parse_mode:'HTML'}});
        } else if (!ok(result)) result = await request('editMessageCaption',{...base,caption});
      }
      if (!ok(result)) throw new Error('Original message update failed.');
      await db.expenseRevision.update({where:{id},data:{originalSynced:true}});
    }
    await db.expenseRevision.update({where:{id},data:{syncStatus:'SYNCED'}});
    return {status:'SYNCED'};
  } catch {
    // An ambiguous send response is NOT retried automatically (avoids duplicates).
    const status = sendingNotice ? 'UNCERTAIN' : 'FAILED';
    await db.expenseRevision.update({where:{id},data:{syncStatus:status}});
    return {status};
  }
}
module.exports = { revisionMessage, revisionButtons, telegramRequest, syncExpenseRevision };
