import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || '').trim();
  if (!phone) return NextResponse.json({ error: 'Lambarka waa qasab.' }, { status: 400 });
  const endpoint = process.env.EBIRR_CUSTOMER_LOOKUP_URL;
  const token = process.env.EBIRR_API_TOKEN;
  if (!endpoint || !token) return NextResponse.json({ configured: false, error: 'E-Birr customer lookup API weli lama xirin.' }, { status: 501 });
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ phone }), cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ configured: true, error: data.message || 'E-Birr lookup wuu fashilmay.' }, { status: response.status });
    return NextResponse.json({ configured: true, name: data.name || data.accountName || data.customerName || '', phone, raw: undefined });
  } catch (error: any) {
    return NextResponse.json({ configured: true, error: error.message || 'E-Birr service lama xiriirin.' }, { status: 502 });
  }
}
