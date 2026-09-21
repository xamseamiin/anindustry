import crypto from 'crypto';

// SMS payment ingestion is deliberately narrower than the rest of the staff
// portal. Administrative access must not silently grant access to device SMS.
const CASHIER_ROLES = new Set(['CASHIER']);

export const canUseCashierPaymentReader = (role?: string | null) => CASHIER_ROLES.has(String(role || '').toUpperCase());

export const createStaffDeviceToken = () => crypto.randomBytes(32).toString('base64url');

export const hashStaffDeviceToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const normalizeDeviceText = (value: unknown, max = 160) => String(value || '').trim().slice(0, max);
