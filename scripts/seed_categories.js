const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const companyId = process.env.TELEGRAM_COMPANY_ID;

if (!companyId) {
    console.error("❌ ERROR: TELEGRAM_COMPANY_ID is not defined in .env");
    process.exit(1);
}

const defaultCategories = [
    { name: 'Utilities', description: 'Biilasha korontada, biyaha, internetka, iyo wixii la mid ah' },
    { name: 'Maintenance', description: 'Dayactirka guud ee warshada ama xafiisyada' },
    { name: 'Rent', description: 'Kirada dhismayaasha ama goobaha shaqada' },
    { name: 'Marketing', description: 'Suuqgeynta iyo xayeysiiska alaabta' },
    { name: 'Office Supplies', description: 'Agabka xafiiska sida waraaqaha, qalimaan, iwm' },
    { name: 'Transport & Fuel', description: 'Kharashka gaadiidka, shidaalka, iyo kirada baabuurta' },
    { name: 'Equipment Rental', description: 'Kireynta qalabka wax soo saarka ama mashiinada' },
    { name: 'Consultancy & Service', description: 'Kharashka la-taliyayaasha ama shirkadaha adeega bixiya' },
    { name: 'Raw Material', description: 'Iibsashada agabka cayriin ee wax soo saarka' }
];

async function main() {
    console.log(`🌱 Seeding expense categories for companyId: ${companyId}...`);
    
    for (const cat of defaultCategories) {
        const existing = await prisma.expenseCategory.findFirst({
            where: {
                companyId,
                name: cat.name
            }
        });

        if (!existing) {
            const created = await prisma.expenseCategory.create({
                data: {
                    name: cat.name,
                    description: cat.description,
                    companyId,
                    type: 'EXPENSE'
                }
            });
            console.log(`✅ Created category: ${created.name}`);
        } else {
            console.log(`ℹ️ Category already exists: ${existing.name}`);
        }
    }
    console.log("🌱 Seeding finished successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
