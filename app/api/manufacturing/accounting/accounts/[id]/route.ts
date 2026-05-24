// app/api/manufacturing/accounting/accounts/[id]/route.ts - Accounts Details & Updates API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId, requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch Single Account Details & Statement History
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const companyId = await getSessionCompanyId();
        const { id } = params;

        // 1. Fetch Account
        const account = await prisma.account.findFirst({
            where: { id, companyId }
        });

        if (!account) {
            return NextResponse.json({ message: 'Account not found' }, { status: 404 });
        }

        // 2. Fetch all transactions associated with this account (deposits, expenses, transfers)
        const transactions = await prisma.transaction.findMany({
            where: {
                companyId,
                OR: [
                    { accountId: id },
                    { fromAccountId: id },
                    { toAccountId: id }
                ]
            },
            orderBy: { transactionDate: 'desc' }
        });

        return NextResponse.json({ account, transactions });
    } catch (error: any) {
        console.error('Error fetching account details:', error);
        return NextResponse.json({ message: 'Error fetching account details', error: error.message }, { status: 500 });
    }
}

// PUT: Update Account Details
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const { id } = params;
        const body = await request.json();

        // Check if account exists
        const existingAccount = await prisma.account.findFirst({
            where: { id, companyId }
        });

        if (!existingAccount) {
            return NextResponse.json({ message: 'Account not found' }, { status: 404 });
        }

        // Update fields safely
        const updatedAccount = await prisma.account.update({
            where: { id },
            data: {
                name: body.name !== undefined ? body.name : existingAccount.name,
                type: body.type !== undefined ? body.type : existingAccount.type,
                balance: body.balance !== undefined ? parseFloat(body.balance) : existingAccount.balance,
                currency: body.currency !== undefined ? body.currency : existingAccount.currency,
                description: body.description !== undefined ? body.description : existingAccount.description,
                isActive: body.isActive !== undefined ? body.isActive : existingAccount.isActive
            }
        });

        return NextResponse.json({ account: updatedAccount, message: 'Account updated successfully!' });
    } catch (error: any) {
        console.error('Error updating account:', error);
        return NextResponse.json({ message: 'Error updating account', error: error.message }, { status: 500 });
    }
}

// DELETE: Delete Account
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const { id } = params;

        // Check if account has any associated transactions
        const transactionCount = await prisma.transaction.count({
            where: {
                companyId,
                OR: [
                    { accountId: id },
                    { fromAccountId: id },
                    { toAccountId: id }
                ]
            }
        });

        if (transactionCount > 0) {
            return NextResponse.json({ 
                message: 'Laguma tirtiri karo koontadan sababtoo ah waxay leedahay dhaqdhaqaaqyo maaliyadeed (transactions). Waxaad taa bedelkeeda ka dhigi kartaa mid aan shaqaynayn (Inactive).' 
            }, { status: 400 });
        }

        await prisma.account.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Account deleted successfully!' });
    } catch (error: any) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ message: 'Error deleting account', error: error.message }, { status: 500 });
    }
}
