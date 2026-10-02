import prisma from '@/lib/prisma';
import { isTelegramFinancialAdmin, TelegramIdentity, verifyTelegramInitData } from '@/lib/telegram-admin';

export const MINI_APP_PERMISSION_KEYS = [
  'viewDashboard', 'viewTransactions', 'addExpense', 'viewSales', 'addSales',
  'viewProduction', 'addProduction', 'viewReports', 'viewProfile', 'manageUsers', 'manageExpenses'
] as const;

export type MiniAppPermission = typeof MINI_APP_PERMISSION_KEYS[number];
export type MiniAppPermissions = Record<MiniAppPermission, boolean> & { isAdmin: boolean; isActive: boolean };

const memberDefaults: MiniAppPermissions = {
  isAdmin: false,
  isActive: true,
  viewDashboard: true,
  viewTransactions: false,
  addExpense: true,
  viewSales: false,
  addSales: false,
  viewProduction: false,
  addProduction: false,
  viewReports: false,
  viewProfile: true,
  manageUsers: false,
  manageExpenses: false
};

const adminDefaults: MiniAppPermissions = {
  ...memberDefaults,
  isAdmin: true,
  viewTransactions: true,
  viewSales: true,
  addSales: true,
  viewProduction: true,
  addProduction: true,
  viewReports: true,
  manageUsers: true,
  manageExpenses: true
};

export const telegramDisplayName = (identity: TelegramIdentity) =>
  [identity.first_name, identity.last_name].filter(Boolean).join(' ').trim() || identity.username || `Telegram ${identity.id}`;

export async function resolveTelegramAccess(initData: string, options: { register?: boolean } = {}) {
  const local = process.env.APP_ENV === 'local';
  const identity = verifyTelegramInitData(initData || '') || (local ? { id: process.env.TELEGRAM_USER_ID || 'local-admin', first_name: 'Local', last_name: 'Admin' } : null);
  if (!identity?.id) return null;
  const companyId = process.env.TELEGRAM_COMPANY_ID || '';
  if (!companyId) return null;

  const telegramId = String(identity.id);
  const bootstrapAdmin = local || isTelegramFinancialAdmin(identity);
  let record = await prisma.telegramAppUser.findUnique({ where: { companyId_telegramId: { companyId, telegramId } } });
  if (!record && options.register !== false) {
    record = await prisma.telegramAppUser.create({
      data: {
        companyId,
        telegramId,
        username: identity.username || null,
        displayName: telegramDisplayName(identity),
        ...(bootstrapAdmin ? adminDefaults : memberDefaults)
      }
    });
  } else if (record && options.register !== false) {
    record = await prisma.telegramAppUser.update({
      where: { id: record.id },
      data: { username: identity.username || null, displayName: telegramDisplayName(identity), lastSeenAt: new Date() }
    });
  }

  const permissions: MiniAppPermissions = bootstrapAdmin
    ? adminDefaults
    : record
      ? Object.fromEntries(['isAdmin', 'isActive', ...MINI_APP_PERMISSION_KEYS].map(key => [key, Boolean((record as any)[key])])) as MiniAppPermissions
      : memberDefaults;
  return { identity, companyId, telegramId, record, permissions, bootstrapAdmin };
}

export async function requireTelegramPermission(initData: string, permission: MiniAppPermission) {
  const access = await resolveTelegramAccess(initData);
  if (!access || !access.permissions.isActive || !access.permissions[permission]) return null;
  return access;
}
