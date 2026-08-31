# Expense revision rollout

## Scope and accounting

An edit creates an immutable before/after snapshot and requires a reason and the
current expense version. The request owner or either configured administrator can
request an edit; only the two administrators can approve and confirm settlement.

Amount, account, employee, recipient, phone and category changes invalidate the
current receipt and require approval and fresh evidence. Text-only edits retain
the receipt and existing unpaid-request controls. Old evidence stays in the audit
snapshot; it is not erased from history.

Editing, approving and uploading a receipt do not move cash. Existing reservations
are released on a material edit. Settlement is explicit:

- PAYMENT: debit only new amount minus previously booked net payments.
- REFUND: credit only the confirmed refund difference.
- REVERIFY: zero movement where amount, employee and account permit it.
- CORRECTION: append reversals and the corrected booking, preserving original
  ledger entries. This is an administrator-confirmed record correction, not a
  claim that a bank transfer/refund has just occurred.

The app records internal balances; it does not execute bank transfers. Managers
must inspect the receipt and bank reference before confirmation. Receipt upload
alone is not proof that money moved. There is no OCR or bank verification added
by this change.

## Telegram

The original message and a separate edit notice are updated. A photo message
cannot be converted into a text-only message using the Telegram Bot API, so the
old displayed receipt is replaced by the company logo until confirmed evidence
is attached. Historical audit evidence is preserved.

Uploads are bound to an expiring persisted user/chat/reply session. Reply to the
bot prompt with an image and `TX:bank-reference` in its caption. Only an admin can
confirm the settlement action. Stale legacy receipt controls are blocked.

Known failures remain FAILED and are retried by the bot or the mini app retry
button. Ambiguous send results remain UNCERTAIN to avoid duplicate notices; an
operator must inspect the chat before reconciling them. A process crash while
SENDING also requires inspection. Never blindly reset these records to PENDING.

## Coordinated deployment (not executed in this implementation)

1. Confirm actual production targets and existing deployment runbook. Back up the
   database and record the running frontend/bot versions. Pause edits and receipt
   settlement during the coordinated rollout; do not stop unrelated services.
2. Review migration status and apply
   `prisma/migrations/20260830000100_expense_revisions/migration.sql` through the
   project's normal migration deployment process. It adds the revision table,
   unique request/reference keys, and a partial index enforcing one open revision.
   Do not use destructive schema reset or `db push --accept-data-loss`.
3. Generate Prisma client for both app and bot. Deploy the new frontend/API and
   the bot together, including all three `lib/expense-revision*.js` modules.
   A frontend-only deployment leaves Telegram callbacks unsupported by the bot.
4. Verify the real company ID, chat ID and bot configuration without printing
   secrets. Ensure notifications are not disabled and local authentication bypass
   is not enabled in production.
5. Run a controlled authorized test in the intended chat, including original
   message replacement, fresh receipt prompt, owner/admin permissions and exact
   ledger delta. Re-enable workflows only after verification. Do not fabricate a
   payment or change a real balance merely to test the system.

## Local verification

Tests use a dedicated loopback PostgreSQL on port 55439, never the database in
`.env`. The test database is disposable, and fixture rows remain there.

- `node --test scripts/test-expense-revisions.js`: real database transactions,
  concurrency, permission, receipt binding, accounting and migration tests;
  Telegram responses are mocked and no group message is sent.
- `node scripts/test-expense-revision-api.js`: starts the compiled production app
  on port 3009 with fake signed Telegram identity and notifications disabled;
  verifies HTTP authentication, ownership, history and unchanged cash balance.
- `node node_modules/next/dist/bin/next build`: production compilation. The
  existing project configuration skips lint/type validation; a successful build
  is not a claim that the entire repository is free of pre-existing type errors.

Live deployment and end-to-end Telegram verification remain separate from these
local tests. Raw-material purchases and deposits use their existing separate
edit flows; this revision workflow applies to expenses/salary transactions.
