import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { canUseCashierPaymentReader, createStaffDeviceToken, hashStaffDeviceToken, normalizeDeviceText } from '@/lib/staff-device';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const companyId = session?.user?.companyId;
    const role = String(session?.user?.role || '');
    if (!userId || !companyId) return NextResponse.json({ error: 'Login ayaa loo baahan yahay.' }, { status: 401 });
    if (!canUseCashierPaymentReader(role)) return NextResponse.json({ error: 'Kaliya cashier ama maamulka ayaa device-kan diiwaangelin kara.' }, { status: 403 });

    const body = await request.json();
    const deviceFingerprint = normalizeDeviceText(body.deviceFingerprint, 180);
    const name = normalizeDeviceText(body.name, 80);
    const enableSmsReader = body.enableSmsReader === true;
    if (!deviceFingerprint || !name) return NextResponse.json({ error: 'Device fingerprint iyo magaca device-ka waa qasab.' }, { status: 400 });
    if (enableSmsReader && !canUseCashierPaymentReader(role)) return NextResponse.json({ error: 'SMS reader waxaa loo oggol yahay cashier oo keliya.' }, { status: 403 });

    const rawToken = createStaffDeviceToken();
    const device = await prisma.staffDevice.upsert({
      where: { companyId_deviceFingerprint: { companyId, deviceFingerprint } },
      create: { companyId, userId, deviceFingerprint, name, role: canUseCashierPaymentReader(role) ? 'CASHIER' : 'STAFF', smsReaderEnabled: enableSmsReader, apiTokenHash: hashStaffDeviceToken(rawToken), lastSeenAt: new Date() },
      update: { userId, name, role: canUseCashierPaymentReader(role) ? 'CASHIER' : 'STAFF', smsReaderEnabled: enableSmsReader, isActive: true, apiTokenHash: hashStaffDeviceToken(rawToken), lastSeenAt: new Date() },
      select: { id: true, name: true, role: true, smsReaderEnabled: true, isActive: true }
    });
    // This token is deliberately returned only once, immediately after a logged-in
    // cashier registers their approved Android device.
    return NextResponse.json({ success: true, device, deviceToken: rawToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Device lama diiwaangelin.' }, { status: 500 });
  }
}
