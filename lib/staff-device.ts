import crypto from 'crypto';

const CASHIER_ROLES = new Set(['CASHIER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SHOP_ADMIN', 'MANUFACTURING_ADMIN']);

export const canUseCashierPaymentReader = (role?: string | null) => CASHIER_ROLES.has(String(role || '').toUpperCase());

export const createStaffDeviceToken = () => crypto.randomBytes(32).toString('base64url');

export const hashStaffDeviceToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const normalizeDeviceText = (value: unknown, max = 160) => String(value || '').trim().slice(0, max);
