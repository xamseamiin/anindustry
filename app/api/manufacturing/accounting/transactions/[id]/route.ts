import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const companyId = await getSessionCompanyId();
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: params.id,
                companyId
            },
            include: {
                customer: { select: { name: true } },
                vendor: { select: { name: true } }
            }
        });

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({ transaction });
    } catch (error: any) {
        console.error('Error fetching transaction:', error);
        return NextResponse.json({ message: 'Error fetching transaction' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const body = await request.json();
        
        const { 
            amount, 
            type, 
            description, 
            note, 
            reference, 
            transactionDate, 
            accountId, 
            fromAccountId, 
            toAccountId, 
            customerId, 
            vendorId 
        } = body;

        const existingTransaction = await prisma.transaction.findFirst({
            where: { id: params.id, companyId }
        });

        if (!existingTransaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        const txAmount = amount !== undefined ? parseFloat(amount) : Number(existingTransaction.amount);
        if (isNaN(txAmount) || txAmount <= 0) {
            return NextResponse.json({ message: 'Qadarku waa inuu ahaadaa tiro ka weyn eber.' }, { status: 400 });
        }

        const date = transactionDate ? new Date(transactionDate) : existingTransaction.transactionDate;

        // Reconstruct description with reference if reference is provided/updated
        let finalDescription = existingTransaction.description;
        if (description !== undefined) {
            finalDescription = `${description}${reference ? ` (Ref: ${reference})` : ''}`;
        } else if (reference !== undefined) {
            const baseDesc = existingTransaction.description.replace(/\s*\(Ref:\s*[^)]+\)/, '');
            finalDescription = `${baseDesc}${reference ? ` (Ref: ${reference})` : ''}`;
        }

        await prisma.$transaction(async (tx) => {
            // Find sibling if it was a transfer
            let siblingTransaction = null;
            if (existingTransaction.type === 'TRANSFER_IN' || existingTransaction.type === 'TRANSFER_OUT') {
                siblingTransaction = await tx.transaction.findFirst({
                    where: {
                        companyId,
                        fromAccountId: existingTransaction.fromAccountId,
                        toAccountId: existingTransaction.toAccountId,
                        amount: existingTransaction.amount,
                        type: existingTransaction.type === 'TRANSFER_IN' ? 'TRANSFER_OUT' : 'TRANSFER_IN',
                        id: { not: existingTransaction.id },
                        createdAt: {
                            gte: new Date(existingTransaction.createdAt.getTime() - 30000),
                            lte: new Date(existingTransaction.createdAt.getTime() + 30000)
                        }
                    }
                });
            }

            // --- 1. REVERSE OLD BALANCES ---
            // Reverse existingTransaction balance
            const oldType = existingTransaction.type;
            const oldAmount = Number(existingTransaction.amount);
            const oldAccountId = existingTransaction.accountId;

            if ((oldType === 'INCOME' || oldType === 'DEBT_TAKEN' || oldType === 'DEBT_RECEIVED' || oldType === 'TRANSFER_IN') && oldAccountId) {
                await tx.account.update({
                    where: { id: oldAccountId },
                    data: { balance: { decrement: oldAmount } }
                });
            } else if ((oldType === 'EXPENSE' || oldType === 'DEBT_GIVEN' || oldType === 'DEBT_REPAID' || oldType === 'TRANSFER_OUT') && oldAccountId) {
                await tx.account.update({
                    where: { id: oldAccountId },
                    data: { balance: { increment: oldAmount } }
                });
            }

            // Reverse siblingTransaction balance if exists
            if (siblingTransaction) {
                const sibType = siblingTransaction.type;
                const sibAmount = Number(siblingTransaction.amount);
                const sibAccountId = siblingTransaction.accountId;

                if ((sibType === 'INCOME' || sibType === 'DEBT_TAKEN' || sibType === 'DEBT_RECEIVED' || sibType === 'TRANSFER_IN') && sibAccountId) {
                    await tx.account.update({
                        where: { id: sibAccountId },
                        data: { balance: { decrement: sibAmount } }
                    });
                } else if ((sibType === 'EXPENSE' || sibType === 'DEBT_GIVEN' || sibType === 'DEBT_REPAID' || sibType === 'TRANSFER_OUT') && sibAccountId) {
                    await tx.account.update({
                        where: { id: sibAccountId },
                        data: { balance: { increment: sibAmount } }
                    });
                }
            }

            // --- 2. UPDATE DATABASE RECORDS & APPLY NEW BALANCES ---
            const finalType = type !== undefined ? type : oldType;

            // If it was a transfer and is edited
            if (siblingTransaction) {
                // If converted to a non-transfer
                if (finalType !== 'TRANSFER' && finalType !== 'TRANSFER_IN' && finalType !== 'TRANSFER_OUT') {
                    // Delete sibling
                    await tx.transaction.delete({
                        where: { id: siblingTransaction.id }
                    });

                    // Update existing to non-transfer
                    await tx.transaction.update({
                        where: { id: existingTransaction.id },
                        data: {
                            amount: txAmount,
                            type: finalType,
                            description: finalDescription,
                            note: note !== undefined ? note : existingTransaction.note,
                            transactionDate: date,
                            accountId: accountId || null,
                            fromAccountId: null,
                            toAccountId: null,
                            customerId: (finalType !== 'TRANSFER' && finalType !== 'TRANSFER_IN' && finalType !== 'TRANSFER_OUT') ? (customerId || null) : null,
                            vendorId: (finalType !== 'TRANSFER' && finalType !== 'TRANSFER_IN' && finalType !== 'TRANSFER_OUT') ? (vendorId || null) : null
                        }
                    });

                    // Apply new balance for the single transaction
                    if ((finalType === 'INCOME' || finalType === 'DEBT_TAKEN' || finalType === 'DEBT_RECEIVED') && accountId) {
                        await tx.account.update({
                            where: { id: accountId },
                            data: { balance: { increment: txAmount } }
                        });
                    } else if ((finalType === 'EXPENSE' || finalType === 'DEBT_GIVEN' || finalType === 'DEBT_REPAID') && accountId) {
                        await tx.account.update({
                            where: { id: accountId },
                            data: { balance: { decrement: txAmount } }
                        });
                    }
                } else {
                    // Still a transfer. Update both.
                    const newFromAccId = fromAccountId || existingTransaction.fromAccountId;
                    const newToAccId = toAccountId || existingTransaction.toAccountId;

                    // Update existing
                    await tx.transaction.update({
                        where: { id: existingTransaction.id },
                        data: {
                            amount: txAmount,
                            description: finalDescription,
                            note: note !== undefined ? note : existingTransaction.note,
                            transactionDate: date,
                            accountId: existingTransaction.type === 'TRANSFER_OUT' ? newFromAccId : newToAccId,
                            fromAccountId: newFromAccId,
                            toAccountId: newToAccId
                        }
                    });

                    // Update sibling
                    await tx.transaction.update({
                        where: { id: siblingTransaction.id },
                        data: {
                            amount: txAmount,
                            description: finalDescription,
                            note: note !== undefined ? note : existingTransaction.note,
                            transactionDate: date,
                            accountId: siblingTransaction.type === 'TRANSFER_OUT' ? newFromAccId : newToAccId,
                            fromAccountId: newFromAccId,
                            toAccountId: newToAccId
                        }
                    });

                    // Apply transfer balances
                    if (newFromAccId) {
                        await tx.account.update({
                            where: { id: newFromAccId },
                            data: { balance: { decrement: txAmount } }
                        });
                    }
                    if (newToAccId) {
                        await tx.account.update({
                            where: { id: newToAccId },
                            data: { balance: { increment: txAmount } }
                        });
                    }
                }
            } else {
                // Was not a transfer.
                // If converted to a transfer
                if (finalType === 'TRANSFER') {
                    // Update existing to be TRANSFER_OUT (Source)
                    await tx.transaction.update({
                        where: { id: existingTransaction.id },
                        data: {
                            amount: txAmount,
                            type: 'TRANSFER_OUT',
                            description: finalDescription,
                            note: note !== undefined ? note : existingTransaction.note,
                            transactionDate: date,
                            accountId: fromAccountId || null,
                            fromAccountId: fromAccountId || null,
                            toAccountId: toAccountId || null,
                            customerId: null,
                            vendorId: null
                        }
                    });

                    // Create new sibling TRANSFER_IN
                    await tx.transaction.create({
                        data: {
                            companyId,
                            amount: txAmount,
                            type: 'TRANSFER_IN',
                            description: finalDescription,
                            note: note !== undefined ? note : existingTransaction.note,
                            transactionDate: date,
                            accountId: toAccountId || null,
                            fromAccountId: fromAccountId || null,
                            toAccountId: toAccountId || null,
                            userId: existingTransaction.userId
                        }
                    });

                    // Apply transfer balances
                    if (fromAccountId) {
                        await tx.account.update({
                            where: { id: fromAccountId },
                            data: { balance: { decrement: txAmount } }
                        });
                    }
                    if (toAccountId) {
                        await tx.account.update({
                            where: { id: toAccountId },
                            data: { balance: { increment: txAmount } }
                        });
                    }
                } else {
                    // Standard update (non-transfer to non-transfer)
                    await tx.transaction.update({
                        where: { id: existingTransaction.id },
                        data: {
                            amount: txAmount,
                            type: finalType,
                            description: finalDescription,
                            note: note !== undefined ? note : existingTransaction.note,
                            transactionDate: date,
                            accountId: accountId || null,
                            customerId: (finalType !== 'TRANSFER' && finalType !== 'TRANSFER_IN' && finalType !== 'TRANSFER_OUT') ? (customerId || null) : null,
                            vendorId: (finalType !== 'TRANSFER' && finalType !== 'TRANSFER_IN' && finalType !== 'TRANSFER_OUT') ? (vendorId || null) : null
                        }
                    });

                    // Apply new balance for the single transaction
                    if ((finalType === 'INCOME' || finalType === 'DEBT_TAKEN' || finalType === 'DEBT_RECEIVED') && accountId) {
                        await tx.account.update({
                            where: { id: accountId },
                            data: { balance: { increment: txAmount } }
                        });
                    } else if ((finalType === 'EXPENSE' || finalType === 'DEBT_GIVEN' || finalType === 'DEBT_REPAID') && accountId) {
                        await tx.account.update({
                            where: { id: accountId },
                            data: { balance: { decrement: txAmount } }
                        });
                    }
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Transaction updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({ message: 'Error updating transaction', error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId } = await requireManufacturingAccess();
        
        const existingTransaction = await prisma.transaction.findFirst({
            where: {
                id: params.id,
                companyId
            }
        });

        if (!existingTransaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Reverse the account balance
        await prisma.$transaction(async (tx) => {
            // Find sibling if it is a transfer
            let siblingTransaction = null;
            if (existingTransaction.type === 'TRANSFER_IN' || existingTransaction.type === 'TRANSFER_OUT') {
                siblingTransaction = await tx.transaction.findFirst({
                    where: {
                        companyId,
                        fromAccountId: existingTransaction.fromAccountId,
                        toAccountId: existingTransaction.toAccountId,
                        amount: existingTransaction.amount,
                        type: existingTransaction.type === 'TRANSFER_IN' ? 'TRANSFER_OUT' : 'TRANSFER_IN',
                        id: { not: existingTransaction.id },
                        createdAt: {
                            gte: new Date(existingTransaction.createdAt.getTime() - 30000),
                            lte: new Date(existingTransaction.createdAt.getTime() + 30000)
                        }
                    }
                });
            }

            // Reverse existing transaction balance
            const type = existingTransaction.type;
            const amount = Number(existingTransaction.amount);
            const accountId = existingTransaction.accountId;
            
            if ((type === 'INCOME' || type === 'DEBT_TAKEN' || type === 'DEBT_RECEIVED' || type === 'TRANSFER_IN') && accountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: amount } }
                });
            } else if ((type === 'EXPENSE' || type === 'DEBT_GIVEN' || type === 'DEBT_REPAID' || type === 'TRANSFER_OUT') && accountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: amount } }
                });
            }

            // Delete existing transaction
            await tx.transaction.delete({
                where: { id: params.id }
            });

            // Reverse sibling transaction balance and delete it if exists
            if (siblingTransaction) {
                const sibType = siblingTransaction.type;
                const sibAmount = Number(siblingTransaction.amount);
                const sibAccountId = siblingTransaction.accountId;

                if ((sibType === 'INCOME' || sibType === 'DEBT_TAKEN' || sibType === 'DEBT_RECEIVED' || sibType === 'TRANSFER_IN') && sibAccountId) {
                    await tx.account.update({
                        where: { id: sibAccountId },
                        data: { balance: { decrement: sibAmount } }
                    });
                } else if ((sibType === 'EXPENSE' || sibType === 'DEBT_GIVEN' || sibType === 'DEBT_REPAID' || sibType === 'TRANSFER_OUT') && sibAccountId) {
                    await tx.account.update({
                        where: { id: sibAccountId },
                        data: { balance: { increment: sibAmount } }
                    });
                }

                await tx.transaction.delete({
                    where: { id: siblingTransaction.id }
                });
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Transaction deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ message: 'Error deleting transaction', error: error.message }, { status: 500 });
    }
}
