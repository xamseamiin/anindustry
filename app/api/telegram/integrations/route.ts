import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, verifyTelegramInitData } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

function admin(request: Request, body?: any) {
  const identity = verifyTelegramInitData(String(body?.initData || request.headers.get('x-telegram-init-data') || ''));
  return identity && isTelegramFinancialAdmin(identity) ? identity : null;
}

export async function GET(request: Request) {
  const identity = admin(request);
  if (!identity) return NextResponse.json({ error: 'API settings-ka Hamse oo keliya ayaa geli kara.' }, { status: 403 });
  const companyId = process.env.TELEGRAM_COMPANY_ID || '';
  const settings = await prisma.personalizationSettings.findUnique({ where: { companyId }, select: { enabledFeatures: true } });
  const integrations = ((settings?.enabledFeatures as any)?.bankIntegrations || {}) as Record<string, any>;
  return NextResponse.json({ integrations: Object.fromEntries(Object.entries(integrations).map(([key, value]) => [key, { ...value, token: value?.token ? '••••••••' : '' }])) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identity = admin(request, body);
  if (!identity) return NextResponse.json({ error: 'API settings-ka Hamse oo keliya ayaa geli kara.' }, { status: 403 });
  const companyId = process.env.TELEGRAM_COMPANY_ID || '';
  const provider = String(body.provider || '').toUpperCase();
  if (!['EBIRR', 'CBE'].includes(provider)) return NextResponse.json({ error: 'Provider-ka dooro: E-Birr ama CBE.' }, { status: 400 });
  const current = await prisma.personalizationSettings.findUnique({ where: { companyId }, select: { enabledFeatures: true } });
  const enabledFeatures = ((current?.enabledFeatures as any) || {}) as Record<string, any>;
  const existing = enabledFeatures.bankIntegrations?.[provider] || {};
  const next = { ...existing, enabled: Boolean(body.enabled), baseUrl: String(body.baseUrl || '').trim(), accountId: String(body.accountId || '').trim(), token: String(body.token || '').trim() || existing.token || '' };
  enabledFeatures.bankIntegrations = { ...(enabledFeatures.bankIntegrations || {}), [provider]: next };
  await prisma.personalizationSettings.upsert({ where: { companyId }, create: { companyId, enabledFeatures }, update: { enabledFeatures } });
  return NextResponse.json({ saved: true, provider, integration: { ...next, token: next.token ? '••••••••' : '' } });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identity = admin(request, body);
  if (!identity) return NextResponse.json({ error: 'API settings-ka Hamse oo keliya ayaa geli kara.' }, { status: 403 });
  const provider = String(body.provider || '').toUpperCase();
  const baseUrl = String(body.baseUrl || '').trim();
  if (!baseUrl) return NextResponse.json({ error: 'Marka hore geli API URL.' }, { status: 400 });
  try { const response = await fetch(baseUrl, { method: 'GET', headers: { Authorization: `Bearer ${String(body.token || '')}` }, cache: 'no-store' }); return NextResponse.json({ ok: response.ok, status: response.status, provider, message: response.ok ? 'API-ga wuu jawaabay.' : `API-ga wuxuu soo celiyey ${response.status}.` }); }
  catch (error: any) { return NextResponse.json({ ok: false, provider, message: error.message || 'API-ga lama xiriirin.' }, { status: 502 }); }
}
