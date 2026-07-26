// fix_telegram_photo_captions.js
const { Client } = require('ssh2');

const VPS_HOST = '81.0.248.108';
const VPS_USER = 'root';
const VPS_PASS = '172885Moalin';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to VPS. Running Telegram caption updater script...');

  const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const token = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;

async function sendBotRequest(method, payload) {
    if (!token) return null;
    try {
        const res = await fetch(\`https://api.telegram.org/bot\${token}/\${method}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('Bot API Error:', e.message);
        return null;
    }
}

function cleanNoteForTelegram(note) {
    if (!note) return '';
    return note.replace(/\\[(?:Dalbaday|TelegramId|PaymentPhone|RecipientName|Account|AccountId):[^\\]]*\\]/g, '').trim();
}

function parseMetadata(note) {
    if (!note) return {};
    const reqMatch = note.match(/\\[Dalbaday:\\s*([^\\]]+)\\]/);
    const idMatch = note.match(/\\[TelegramId:\\s*([^\\]]+)\\]/);
    const phoneMatch = note.match(/\\[PaymentPhone:\\s*([^\\]]+)\\]/);
    const recipMatch = note.match(/\\[RecipientName:\\s*([^\\]]+)\\]/);
    return {
        requesterName: reqMatch ? reqMatch[1].trim() : '',
        requesterId: idMatch ? idMatch[1].trim() : '',
        paymentPhone: phoneMatch ? phoneMatch[1].trim() : '',
        recipientName: recipMatch ? recipMatch[1].trim() : ''
    };
}

async function fixAllCaptions() {
    console.log("=== FIXING ALL TELEGRAM PHOTO CAPTIONS IN GROUP ===");
    
    // Get live E-Birr balance
    const eBirrAcc = await prisma.account.findFirst({
        where: { name: { contains: 'E-Birr' } }
    });
    const liveBalanceStr = eBirrAcc ? Number(eBirrAcc.balance).toLocaleString() + ' ETB' : '79,780 ETB';

    const expenses = await prisma.expense.findMany({
        where: { telegramMessageId: { not: null } },
        include: { employee: true, account: true },
        orderBy: { createdAt: 'desc' }
    });

    console.log("Found", expenses.length, "expenses to check & update");

    for (const exp of expenses) {
        const chatId = exp.telegramChatId || defaultChatId;
        const msgId = exp.telegramMessageId;
        if (!chatId || !msgId) continue;

        const formattedDate = new Date(exp.paymentDate || exp.createdAt).toLocaleString('so-SO', { timeZone: 'Africa/Mogadishu' });
        const cleanNote = cleanNoteForTelegram(exp.note);
        const meta = parseMetadata(exp.note);

        let requesterLine = '';
        if (meta.requesterId) {
            requesterLine = \`🗣 <b>Soo Dalbay:</b> <a href="tg://user?id=\${meta.requesterId}">\${meta.requesterName}</a>\\n\`;
        } else if (meta.requesterName) {
            requesterLine = \`🗣 <b>Soo Dalbay:</b> \${meta.requesterName}\\n\`;
        }

        let paymentContactLine = '';
        if (meta.recipientName && meta.paymentPhone) {
            paymentContactLine = \`👤 Loo dirayo: \${meta.recipientName}\\n📱 Lambarka: \${meta.paymentPhone}\\n\`;
        } else if (meta.paymentPhone) {
            paymentContactLine = \`📱 Lambarka: \${meta.paymentPhone}\\n\`;
        } else if (meta.recipientName) {
            paymentContactLine = \`👤 Loo dirayo: \${meta.recipientName}\\n\`;
        }

        const isPaid = exp.approved || exp.paymentStatus === 'PAID' || !!exp.receiptUrl;
        let newText = '';

        if (exp.employeeId) {
            if (isPaid) {
                newText = \`<b>AN-Industory</b>\\n\` +
                          \`<b>✅ Mushahar Bixin Guulaystay!</b>\\n\\n\` +
                          requesterLine +
                          \`👤 Shaqaalaha: \${exp.employee?.fullName || 'Shaqaale'}\\n\` +
                          \`💵 Lacagta la bixiyey: \${Number(exp.amount).toLocaleString()} ETB\\n\` +
                          (meta.paymentPhone ? \`📱 Lambarka: \${meta.paymentPhone}\\n\` : '') +
                          \`💳 Koontada la doortay: \${exp.paidFrom} (Haraa: \${liveBalanceStr})\\n\` +
                          \`📝 Sharaxaad: \${cleanNote || 'Mushaharka bisha'}\\n\\n\` +
                          (meta.paymentPhone ? \`[PaymentPhone: \${meta.paymentPhone}]\\n\` : '') +
                          (meta.recipientName ? \`[RecipientName: \${meta.recipientName}]\\n\` : '') +
                          \`📅 Taariikhda: \${formattedDate}\`;
            } else {
                newText = \`<b>AN-Industory</b>\\n\` +
                          \`<b>📋 Codsiga Mushaharka (Sugaya Rasiidka)</b>\\n\\n\` +
                          requesterLine +
                          \`👤 Shaqaalaha: \${exp.employee?.fullName || 'Shaqaale'}\\n\` +
                          \`💵 Lacagta la dalbay: \${Number(exp.amount).toLocaleString()} ETB\\n\` +
                          (meta.paymentPhone ? \`📱 Lambarka: \${meta.paymentPhone}\\n\` : '') +
                          \`💳 Koontada la doortay: \${exp.paidFrom} (Haraa: \${liveBalanceStr})\\n\` +
                          \`📝 Sharaxaad: \${cleanNote || 'Mushaharka bisha'}\\n\\n\` +
                          \`⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...\`;
            }
        } else {
            let customFieldsText = '';
            if (exp.category === 'Transport & Fuel' && exp.transportType) {
                customFieldsText = \`🚗 Nooca Gadiidka: \${exp.transportType}\\n\`;
            } else if (exp.category === 'Equipment Rental' && exp.equipmentName) {
                customFieldsText = \`⚙️ Qalabka: \${exp.equipmentName}\\n📅 Muddada Kirada: \${exp.rentalPeriod || ''}\\n\`;
            } else if (exp.category === 'Consultancy & Service' && exp.consultantName) {
                customFieldsText = \`👤 La-taliyaha: \${exp.consultantName}\\n📋 Adeegga: \${exp.consultancyType || ''}\\n\`;
            }

            if (isPaid) {
                newText = \`<b>AN-Industory</b>\\n\` +
                          \`<b>✅ Diiwaangelinta Kharashka (Waala Bixiyey)</b>\\n\\n\` +
                          requesterLine +
                          \`📂 Qaybta: \${exp.category}\\n\` +
                          \`💵 Lacagta la bixiyey: \${Number(exp.amount).toLocaleString()} ETB\\n\` +
                          customFieldsText +
                          paymentContactLine +
                          \`💳 Koontada la doortay: \${exp.paidFrom} (Haraa: \${liveBalanceStr})\\n\` +
                          \`📝 Sharaxaad: \${cleanNote}\\n\\n\` +
                          \`✅ Lacagtaas waa la diray.\`;
            } else {
                newText = \`<b>AN-Industory</b>\\n\` +
                          \`<b>📋 Codsiga Kharashka (Sugaya Rasiidka)</b>\\n\\n\` +
                          requesterLine +
                          \`📂 Qaybta: \${exp.category}\\n\` +
                          \`💵 Lacagta la dalbay: \${Number(exp.amount).toLocaleString()} ETB\\n\` +
                          customFieldsText +
                          paymentContactLine +
                          \`💳 Koontada la doortay: \${exp.paidFrom} (Haraa: \${liveBalanceStr})\\n\` +
                          \`📝 Sharaxaad: \${cleanNote}\\n\\n\` +
                          \`⏳ Sugaya rasiidka si loo xaqiijiyo in lacagtaas la diray...\`;
            }
        }

        console.log("Updating MsgID", msgId, "ChatId", chatId, "Expense", exp.id);
        
        // Try editMessageCaption first (since photo attached)
        let res = await sendBotRequest('editMessageCaption', {
            chat_id: chatId,
            message_id: Number(msgId),
            caption: newText,
            parse_mode: 'HTML'
        });

        if (!res || !res.ok) {
            // Fallback to editMessageText if text-only message
            res = await sendBotRequest('editMessageText', {
                chat_id: chatId,
                message_id: Number(msgId),
                text: newText,
                parse_mode: 'HTML'
            });
        }

        if (res && res.ok) {
            console.log("✅ Successfully updated MsgID:", msgId);
        } else {
            console.log("❌ Failed to update MsgID:", msgId, "Reason:", res?.description || 'Unknown error');
        }
    }

    await prisma.$disconnect();
}

fixAllCaptions().catch(console.error);
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;

    const stream = sftp.createWriteStream('/root/an-industory/fix_captions.js');
    stream.write(scriptContent);
    stream.end();

    stream.on('finish', () => {
      conn.exec('cd /root/an-industory && node fix_captions.js', (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });
  });
}).connect({ host: VPS_HOST, port: 22, username: VPS_USER, password: VPS_PASS });
