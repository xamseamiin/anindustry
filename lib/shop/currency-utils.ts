import prisma from '@/lib/prisma';
import { subDays } from 'date-fns';

/**
 * Automatically converts ETB debts older than 7 days to USD.
 * This preserves the value of the debt in dollars.
 */
export async function autoConvertAgedDebts(companyId: string) {
    try {
        // Fetch all ETB credit sales that have auto-conversion enabled and are not yet converted
        const potentialSales = await prisma.sale.findMany({
            where: {
                companyId,
                currency: 'ETB',
                autoConvertDebt: true,
                isConvertedToUSD: false,
                paymentStatus: { in: ['Unpaid', 'Partial'] }
            }
        });

        if (potentialSales.length === 0) return 0;

        let convertedCount = 0;
        const now = new Date();

        for (const sale of potentialSales) {
            // Check if specifically aged for THIS sale
            const threshold = subDays(now, sale.convertDebtAfterDays || 7);

            if (new Date(sale.createdAt) < threshold) {
                const usdTotal = sale.total / sale.exchangeRate;
                const usdPaid = sale.paidAmount / sale.exchangeRate;
                const usdSubtotal = sale.subtotal / sale.exchangeRate;
                const usdTax = sale.tax / sale.exchangeRate;

                await prisma.sale.update({
                    where: { id: sale.id },
                    data: {
                        currency: 'USD',
                        isConvertedToUSD: true,
                        convertedAt: new Date(),
                        originalTotal: sale.total,
                        total: usdTotal,
                        paidAmount: usdPaid,
                        subtotal: usdSubtotal,
                        tax: usdTax,
                    }
                });
                convertedCount++;
            }
        }

        return convertedCount;
    } catch (error) {
        console.error('Error in autoConvertAgedDebts:', error);
        return 0;
    }
}

/**
 * Calculates current payment required in ETB for a USD-denominated debt.
 */
export function calculateETBRequired(usdAmount: number, currentRate: number) {
    return usdAmount * currentRate;
}
