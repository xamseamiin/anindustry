import crypto from 'crypto';

const ADMIN_IDS = new Set(['1836408854', '8230473166']);
const ADMIN_USERNAMES = new Set(['hamsemoalin', 'abdehakimmumin']);

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

export type TelegramIdentity = {
    id?: string | number | null;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
};

export function isTelegramFinancialAdmin(identity: TelegramIdentity | null | undefined) {
    if (!identity) return false;
    const id = String(identity.id || '');
    const username = normalize(identity.username).replace(/^@/, '');
    const fullName = normalize(`${identity.first_name || ''} ${identity.last_name || ''}`);
    return ADMIN_IDS.has(id) || ADMIN_USERNAMES.has(username) ||
        fullName.includes('hamse moalin') || fullName.includes('hamze amiin') ||
        fullName.includes('abdehakim mumin');
}

export function verifyTelegramInitData(initData: string): TelegramIdentity | null {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !initData) return null;

    const params = new URLSearchParams(initData);
    const receivedHash = params.get('hash');
    if (!receivedHash) return null;
    params.delete('hash');

    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (receivedHash.length !== expectedHash.length || !crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash))) return null;

    const authDate = Number(params.get('auth_date') || 0);
    if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
    try {
        return JSON.parse(params.get('user') || 'null');
    } catch {
        return null;
    }
}
