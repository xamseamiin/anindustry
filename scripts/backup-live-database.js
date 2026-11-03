require('dotenv').config({ path: '.env' });
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const output = `an-industry-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

function replacer(_key, value) {
  if (typeof value === 'bigint') return value.toString();
  if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') return value.toString();
  return value;
}

(async () => {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const snapshot = { createdAt: new Date().toISOString(), tables: {} };
  for (const { table_name: table } of tables) {
    const safe = String(table).replace(/"/g, '""');
    snapshot.tables[table] = await prisma.$queryRawUnsafe(`SELECT * FROM "${safe}"`);
  }
  fs.writeFileSync(output, JSON.stringify(snapshot, replacer, 2), 'utf8');
  const stat = fs.statSync(output);
  console.log(JSON.stringify({ output, tables: tables.length, bytes: stat.size }));
})()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
