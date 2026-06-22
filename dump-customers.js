const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const user = await prisma.user.findFirst({
            where: { fullName: { contains: "hamse", mode: "insensitive" } }
        });
        if (!user) {
            console.log("No user found!");
            return;
        }
        const customers = await prisma.customer.findMany({
            where: { companyId: user.companyId }
        });
        console.log(`User: ${user.fullName}, Company: ${user.companyId}`);
        console.log(`Loaded ${customers.length} customers.`);
        console.log(JSON.stringify(customers.map(c => ({ id: c.id, name: c.name })), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
run();
