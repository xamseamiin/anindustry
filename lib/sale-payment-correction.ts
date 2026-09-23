export function salePaymentCorrection(total: number, oldPaid: number, newPaid: unknown) {
    if (typeof newPaid !== 'number' || !Number.isFinite(newPaid) || newPaid < 0 || newPaid > total) {
        throw new Error('Lacagta la bixiyey waa inay u dhexaysaa 0 iyo total-ka iibka.');
    }
    const paidAmount = Math.round(newPaid * 100) / 100;
    return {
        paidAmount,
        debt: Math.round((total - paidAmount) * 100) / 100,
        balanceChange: Math.round((paidAmount - oldPaid) * 100) / 100,
        paymentStatus: paidAmount >= total ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid'
    };
}
