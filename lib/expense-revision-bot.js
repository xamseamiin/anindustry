const service = require('./expense-revisions');
const { syncExpenseRevision, revisionMessage, revisionButtons } = require('./expense-revision-telegram');
const actorOf = user => ({ id:String(user.id), name:[user.first_name,user.last_name].filter(Boolean).join(' '), source:'TELEGRAM' });
async function handleRevisionUpdate(db, update, companyId, send) {
  const query = update.callback_query;
  if (query?.data?.startsWith('rv_')) {
    const match = query.data.match(/^rv_(approve|reject|upload|PAYMENT|REFUND|CORRECTION|REVERIFY)_([a-f0-9-]{36})$/);
    if (!match) return true;
    const [,action,id] = match, actor = actorOf(query.from);
    try {
      const revision = await db.expenseRevision.findFirst({where:{id,companyId,chatId:String(query.message.chat.id)}});
      if (!revision) throw new Error('Revision not found in this chat.');
      if (action !== 'upload' && !service.ADMIN_IDS.has(actor.id)) throw new Error('Admins only.');
      if (action === 'upload') {
        if (revision.status !== 'AWAITING_RECEIPT') throw new Error('Sug ansixinta manager-ka.');
        // ForceReply and persisted message binding prevent selecting a different
        // expense when another user clicks a button or the bot restarts.
        const prompt = await send('sendMessage',{chat_id:revision.chatId,text:'Soo geli sawirka rasiidka CUSUB adigoo REPLY ku ah fariintan. Caption-ka ku qor TX:transaction-id. Balance ma beddelmayo ilaa manager xaqiijiyo.',reply_markup:{force_reply:true,selective:true},reply_to_message_id:query.message.message_id});
        if (!prompt?.ok) throw new Error('Upload prompt failed.');
        await db.receiptSession.updateMany({where:{telegramChatId:revision.chatId,telegramUserId:actor.id,status:'AWAITING_UPLOAD'},data:{status:'CANCELLED',completedAt:new Date()}});
        await db.receiptSession.create({data:{companyId,expenseId:revision.expenseId,telegramChatId:revision.chatId,telegramUserId:actor.id,
          telegramMessageId:prompt.result.message_id,idempotencyKey:`revision:${id}:${prompt.result.message_id}`,expiresAt:new Date(Date.now()+15*60000)}});
      } else if (action === 'approve' || action === 'reject') {
        await service.approveRevision(db,companyId,id,actor,action==='reject');
        await syncExpenseRevision(db,id,send);
      } else {
        // Explicit confirmation: the manager has the uploaded image and entered
        // bank reference. A receipt upload alone can never book a payment/refund.
        await service.confirmRevision(db,companyId,id,actor,action);
        await syncExpenseRevision(db,id,send);
      }
      await send('answerCallbackQuery',{callback_query_id:query.id,text:'Waa la qabtay.',show_alert:true});
    } catch (err) {
      await send('answerCallbackQuery',{callback_query_id:query.id,text:String(err.message).slice(0,190),show_alert:true});
    }
    return true;
  }
  const message = update.message;
  if (!message?.reply_to_message || (!message.photo?.length && !String(message.document?.mime_type || '').startsWith('image/'))) return false;
  const session = await db.receiptSession.findFirst({where:{companyId,telegramChatId:String(message.chat.id),telegramUserId:String(message.from.id),telegramMessageId:message.reply_to_message.message_id,idempotencyKey:{startsWith:'revision:'}}});
  if (!session) return false;
  try {
    if (session.status !== 'AWAITING_UPLOAD' || session.expiresAt < new Date()) throw new Error('Upload session expired/completed; click Gali Rasiidka again.');
    const id = session.idempotencyKey.split(':')[1];
    const ref = String(message.caption || '').match(/\bTX:\s*([A-Za-z0-9-]{4,100})/i)?.[1];
    const file = message.photo?.length ? message.photo[message.photo.length-1] : message.document;
    const revision = await service.submitRevisionReceipt(db,companyId,id,actorOf(message.from),`/api/telegram/receipt?fileId=${encodeURIComponent(file.file_id)}`,ref);
    await db.receiptSession.update({where:{id:session.id},data:{status:'COMPLETED',receiptFileId:file.file_id,completedAt:new Date()}});
    await syncExpenseRevision(db,id,send);
    await send('sendMessage',{chat_id:message.chat.id,reply_to_message_id:message.message_id,text:`Rasiidkii edit-ka waa la helay (TX: ${ref}). Manager: hubi lacagta, qofka iyo account-ka; ka dib xaqiiji bixinta/soo-celinta ama sixitaanka diiwaanka.`,reply_markup:revisionButtons(revision)});
  } catch (err) {
    await send('sendMessage',{chat_id:message.chat.id,reply_to_message_id:message.message_id,text:String(err.message).slice(0,500)});
  }
  return true;
}
module.exports = { handleRevisionUpdate };
