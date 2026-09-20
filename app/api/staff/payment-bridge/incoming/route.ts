import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canUseCashierPaymentReader, hashStaffDeviceToken, normalizeDeviceText } from '@/lib/staff-device';

export const dynamic = 'force-dynamic';

const supportedProviders = new Set(['EBIRR', 'CBE', 'CBEBIRR']);

export async function POST(request: Request) {
  try {
    const token = request.headers.get('x-an-device-token') || '';
    if (!token) return NextResponse.json({ error: 'Device token ayaa maqan.' }, { status: 401 });
    const device = await prisma.staffDevice.findFirst({
      where: { apiTokenHash: hashStaffDeviceToken(token), isActive: true, smsReaderEnabled: true },
      include: { user: { select: { role: true } } }
    });
    if (!device || !canUseCashierPaymentReader(device.user.role)) return NextResponse.json({ error: 'Device-kan looma oggola SMS payment reader.' }, { status: 403 });

    const body = await request.json();
    const provider = normalizeDeviceText(body.provider, 20).toUpperCase();
    const accountId = normalizeDeviceText(body.accountId, 80);
    const providerReference = normalizeDeviceText(body.providerReference, 180);
    const senderName = normalizeDeviceText(body.senderName, 120) || null;
    const senderPhone = normalizeDeviceText(body.senderPhone, 40) || null;
    const messageHash = normalizeDeviceText(body.messageHash, 128) || null;
    const amount = Number(body.amount);
    const receivedAt = body.receivedAt ? new Date(body.receivedAt) : new Date();
    if (!supportedProviders.has(provider) || !accountId || !providerReference || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(receivedAt.getTime())) {
      return NextResponse.json({ error: 'Payment data ma dhammaystirna ama sax ma aha.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async tx => {
      const account = await tx.account.findFirst({ where: { id: accountId, companyId: device.companyId, isActive: true }, select: { id: true, name: true } });
      if (!account) throw new Error('Account-ka lama helin ama ma firfircoona.');
      const duplicate = await tx.incomingPayment.findFirst({ where: { companyId: device.companyId, OR: [{ provider, providerReference }, ...(messageHash ? [{ messageHash }] : [])] }, select: { id: true } });
      if (duplicate) return { duplicate: true, paymentId: duplicate.id, accountName: account.name };

      const payment = await tx.incomingPayment.create({ data: {
        companyId: device.companyId, accountId: account.id, deviceId: device.id, provider, providerReference,
        senderName, senderPhone, amount, receivedAt, messageHash, status: 'UNMATCHED',
        metadata: { source: 'ANDROID_SMS_BRIDGE' }
      } });
      await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
      await tx.transaction.create({ data: {
        companyId: device.companyId, accountId: account.id, amount, type: 'INCOME',
        description: `Incoming ${provider}: ${senderName || senderPhone || 'Unknown sender'}`,
        category: 'Unmatched Incoming Payment', transactionDate: receivedAt,
        note: `Provider: ${provider}. Reference: ${providerReference}. IncomingPaymentId: ${payment.id}`
      } });
      await tx.staffDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
      return { duplicate: false, paymentId: payment.id, accountName: account.name };
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Incoming payment lama kaydin.' }, { status: 500 });
  }
}
