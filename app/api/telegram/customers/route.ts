import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

function allowed(initData: string) {
  const identity = verifyTelegramInitData(initData || '');
  if (process.env.APP_ENV === 'local') return identity || { id: process.env.TELEGRAM_USER_ID || 'local-admin' };
  return identity && isTelegramFinancialAdmin(identity as any) ? identity : null;
}

export async function GET() {
  try {
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });
    const customers = await prisma.customer.findMany({ where: { companyId }, select: { id: true, name: true, phone: true, phoneNumber: true, companyName: true }, orderBy: { name: 'asc' }, take: 500 });
    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Customers lama soo qaadin.' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!allowed(String(body.initData || ''))) return NextResponse.json({ error: 'Telegram admin access is required.' }, { status: 403 });
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const userId = process.env.TELEGRAM_USER_ID || 'telegram-mini-app';
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    if (!name || !phone) return NextResponse.json({ error: 'Magaca iyo lambarka customer-ka waa qasab.' }, { status: 400 });
    const existing = await prisma.customer.findFirst({ where: { companyId, OR: [{ name: { equals: name, mode: 'insensitive' } }, { phone }, { phoneNumber: phone }] } });
    if (existing) return NextResponse.json({ customer: existing, created: false, message: 'Customer-kan hore ayuu u jiray.' });
    const customer = await prisma.customer.create({ data: { companyId, userId, name, phone, phoneNumber: phone, companyName: body.companyName || null, type: body.type || 'Individual', notes: body.notes || null } });
    return NextResponse.json({ customer, created: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Customer lama kaydin.' }, { status: 500 });
  }
}
