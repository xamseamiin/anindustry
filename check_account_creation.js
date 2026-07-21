const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = "e69f8480-0cc9-4263-9abb-c6fbfeee2ac2";
  console.log("Analyzing account E-birr details...");

  const ebirr = await prisma.account.findFirst({
    where: { companyId, name: 'E-birr' }
  });

  if (ebirr) {
    console.log("E-birr details:", {
      id: ebirr.id,
      name: ebirr.name,
      balance: ebirr.balance,
      createdAt: ebirr.createdAt,
      updatedAt: ebirr.updatedAt
    });
  } else {
    console.log("E-birr not found!");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
