import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { canUseCashierPaymentReader } from '@/lib/staff-device';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const companyId = session?.user?.companyId;
    const role = String(session?.user?.role || '');
    if (!session?.user?.id || !companyId) return NextResponse.json({ error: 'Login ayaa loo baahan yahay.' }, { status: 401 });

    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, type: true, currency: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({
      user: { id: session.user.id, name: session.user.name || '', role },
      accounts,
      canEnableSmsReader: canUseCashierPaymentReader(role)
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Device setup lama soo qaadin.' }, { status: 500 });
  }
}
