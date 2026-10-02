import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MINI_APP_PERMISSION_KEYS, requireTelegramPermission, resolveTelegramAccess } from '@/lib/telegram-access';

export const dynamic = 'force-dynamic';

const initDataFrom = (request: Request, body?: any) =>
  String(body?.initData || request.headers.get('x-telegram-init-data') || new URL(request.url).searchParams.get('initData') || '');

export async function GET(request: Request) {
  try {
    const access = await resolveTelegramAccess(initDataFrom(request));
    if (!access) return NextResponse.json({ error: 'Telegram session lama xaqiijin.' }, { status: 403 });
    const users = access.permissions.manageUsers
      ? await prisma.telegramAppUser.findMany({ where: { companyId: access.companyId }, orderBy: [{ isAdmin: 'desc' }, { displayName: 'asc' }] })
      : [];
    return NextResponse.json({
      success: true,
      current: { telegramId: access.telegramId, displayName: access.record?.displayName || '', username: access.record?.username || null, permissions: access.permissions },
      users: users.map(user => ({
        id: user.id, telegramId: user.telegramId, displayName: user.displayName, username: user.username,
        lastSeenAt: user.lastSeenAt, createdAt: user.createdAt,
        permissions: Object.fromEntries(['isAdmin', 'isActive', ...MINI_APP_PERMISSION_KEYS].map(key => [key, Boolean((user as any)[key])]))
      }))
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Access-ka lama soo qaadin.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireTelegramPermission(initDataFrom(request, body), 'manageUsers');
    if (!access) return NextResponse.json({ error: 'User access maamulka fasax uma lihid.' }, { status: 403 });
    const targetId = String(body.id || '');
    const target = await prisma.telegramAppUser.findFirst({ where: { id: targetId, companyId: access.companyId } });
    if (!target) return NextResponse.json({ error: 'Qofkan access list-ka lagama helin.' }, { status: 404 });
    const changes = body.permissions && typeof body.permissions === 'object' ? body.permissions : {};
    const data: Record<string, boolean> = {};
    for (const key of ['isAdmin', 'isActive', ...MINI_APP_PERMISSION_KEYS]) {
      if (typeof changes[key] === 'boolean') data[key] = changes[key];
    }
    if (data.isAdmin === true) {
      data.isActive = true;
      for (const key of MINI_APP_PERMISSION_KEYS) data[key] = true;
    }
    // The two original financial admins are permanent recovery admins and cannot
    // accidentally lock each other out of the control panel.
    if (['1836408854', '8230473166'].includes(target.telegramId)) {
      data.isActive = true;
      data.isAdmin = true;
      data.manageUsers = true;
    }
    const updated = await prisma.telegramAppUser.update({ where: { id: target.id }, data });
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Permissions-ka lama kaydin.' }, { status: 500 });
  }
}
