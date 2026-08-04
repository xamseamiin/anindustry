import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isTelegramFinancialAdmin } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

const permissionsForRole = (role: string) => {
    const normalized = role.toUpperCase();
    const isAdmin = normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
    const isManager = isAdmin || normalized === 'MANUFACTURING_ADMIN';
    return {
        add: true,
        edit: isManager,
        delete: isManager,
        approve: isManager,
        reports: isManager,
        approvalLimit: isAdmin ? null : isManager ? 50000 : 5000
    };
};

const editDistance = (a: string, b: string) => {
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            rows[i][j] = Math.min(
                rows[i - 1][j] + 1,
                rows[i][j - 1] + 1,
                rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return rows[a.length][b.length];
};

export async function GET(request: Request) {
    try {
        const companyId = process.env.TELEGRAM_COMPANY_ID;
        if (!companyId) return NextResponse.json({ error: 'Company is not configured' }, { status: 400 });

        const params = new URL(request.url).searchParams;
        const telegramId = params.get('telegramId') || '';
        const username = params.get('username') || '';
        const name = (params.get('name') || '').replace(/\s*\(@[^)]+\)\s*$/, '').trim();
        const firstName = name.split(/\s+/)[0] || '';

        const users = await prisma.user.findMany({
            where: { companyId, status: 'Active' },
            include: { trustedDevices: { orderBy: { lastUsed: 'desc' }, take: 5 } }
        });
        const user = users.find(u => {
            if (!name) return false;
            const databaseName = u.fullName.toLowerCase();
            const databaseFirstName = databaseName.split(/\s+/)[0];
            return databaseName === name.toLowerCase() || editDistance(databaseFirstName, firstName.toLowerCase()) <= 1;
        }) || null;

        const identityFilters: any[] = [];
        if (telegramId) identityFilters.push({ note: { contains: `[TelegramId: ${telegramId}]` } });
        if (user) identityFilters.push({ userId: user.id });

        const expenses = identityFilters.length ? await prisma.expense.findMany({
            where: { companyId, OR: identityFilters },
            orderBy: { createdAt: 'desc' },
            take: 100
        }) : [];

        const paid = expenses.filter(e => e.paymentStatus === 'PAID' || !!e.receiptUrl);
        const pending = expenses.filter(e => e.paymentStatus !== 'PAID' && !e.receiptUrl);
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthlyTotal = expenses
            .filter(e => e.createdAt >= monthStart)
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const nameParts = name.split(/\s+/);
        const isFinancialAdmin = isTelegramFinancialAdmin({
            id: telegramId,
            username,
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' ')
        });
        const role = isFinancialAdmin ? 'ADMIN' : 'MEMBER';
        return NextResponse.json({
            success: true,
            profile: {
                databaseUserId: user?.id || null,
                fullName: user?.fullName || name || 'Telegram User',
                email: user?.email || null,
                phone: user?.phone || null,
                role,
                status: user?.status || 'Active',
                twoFAEnabled: user?.TwoFAEnabled || false,
                lastLogin: user?.lastLogin || null,
                lastActiveAt: user?.lastActiveAt || null,
                lastDevice: user?.lastDevice || null,
                permissions: permissionsForRole(role),
                trustedDevices: user?.trustedDevices.map(d => ({
                    id: d.id,
                    userAgent: d.userAgent || 'Unknown device',
                    lastUsed: d.lastUsed,
                    createdAt: d.createdAt
                })) || [],
                activity: {
                    total: expenses.length,
                    paid: paid.length,
                    pending: pending.length,
                    monthlyTotal
                },
                recent: expenses.slice(0, 5).map(e => ({
                    id: e.id,
                    description: e.description,
                    amount: Number(e.amount),
                    status: e.paymentStatus || 'UNPAID',
                    date: e.createdAt
                }))
            }
        });
    } catch (error: any) {
        console.error('Telegram profile error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
