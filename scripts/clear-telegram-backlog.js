const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const base = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  const latest = await fetch(`${base}/getUpdates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offset: -1, timeout: 0 })
  }).then(response => response.json());

  const lastUpdateId = latest.result?.at(-1)?.update_id;
  if (lastUpdateId !== undefined) {
    await fetch(`${base}/getUpdates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offset: lastUpdateId + 1, timeout: 0 })
    });
  }

  const info = await fetch(`${base}/getWebhookInfo`).then(response => response.json());
  console.log(JSON.stringify({ clearedThrough: lastUpdateId, pending: info.result?.pending_update_count }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
