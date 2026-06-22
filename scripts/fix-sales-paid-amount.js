const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== Starting Sales Paid Amount Repair Script ===");
    
    // 1. Fetch all sales where paidAmount is 0 (or very close to 0)
    const sales = await prisma.sale.findMany({
        where: {
            paidAmount: 0
        },
        include: {
            customer: true
        }
    });

    console.log(`Found ${sales.length} sales with paidAmount = 0 in the database.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const sale of sales) {
        const invoiceNumber = sale.invoiceNumber;
        const total = Number(sale.total);
        const paymentStatus = sale.paymentStatus;
        const customerName = sale.customer ? sale.customer.name : 'Unknown';

        console.log(`\nProcessing sale: Invoice: ${invoiceNumber}, Customer: ${customerName}, Total: ${total} ETB, Current Status: ${paymentStatus}`);

        // Try to find a transaction associated with this sale
        const transaction = await prisma.transaction.findFirst({
            where: {
                companyId: sale.companyId,
                description: {
                    contains: invoiceNumber
                }
            }
        });

        let targetPaidAmount = 0;
        let targetStatus = paymentStatus;

        if (transaction) {
            targetPaidAmount = Number(transaction.amount);
            console.log(`-> Found matching Transaction! Amount paid in transaction: ${targetPaidAmount} ETB`);
            // Determine status based on actual paid amount
            targetStatus = targetPaidAmount >= total ? 'Paid' : targetPaidAmount > 0 ? 'Partial' : 'Unpaid';
        } else {
            console.log(`-> No matching transaction found.`);
            if (paymentStatus === 'Paid') {
                console.log(`-> Sale status is 'Paid' but paidAmount is 0. Setting paidAmount to total (${total} ETB)`);
                targetPaidAmount = total;
            } else if (paymentStatus === 'Partial') {
                console.log(`-> WARNING: Sale status is 'Partial' but paidAmount is 0 and no transaction was found. Skipping.`);
                skippedCount++;
                continue;
            } else {
                console.log(`-> Sale status is 'Unpaid' and no transaction was found. This is correct. Skipping.`);
                skippedCount++;
                continue;
            }
        }

        // Only update if targetPaidAmount > 0 or status changed
        if (targetPaidAmount > 0 || targetStatus !== paymentStatus) {
            console.log(`-> UPDATING: Setting paidAmount = ${targetPaidAmount} ETB, paymentStatus = '${targetStatus}'`);
            
            await prisma.sale.update({
                where: { id: sale.id },
                data: {
                    paidAmount: targetPaidAmount,
                    paymentStatus: targetStatus
                }
            });
            updatedCount++;
        } else {
            console.log(`-> No changes needed.`);
            skippedCount++;
        }
    }

    console.log(`\n=== Repair Summary ===`);
    console.log(`Total checked: ${sales.length}`);
    console.log(`Total updated: ${updatedCount}`);
    console.log(`Total skipped: ${skippedCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
