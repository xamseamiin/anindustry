import prisma from '@/lib/db';

// This file is now a stub to satisfy imports but disable enforcement.

/**
 * Checks if the current request comes from a trusted device.
 * ALWAYS RETURNS TRUE (Security Disabled).
 */
export async function isCurrentDeviceTrusted(userId: string): Promise<boolean> {
    return true;
}

export function generateSecret() {
    return "";
}

export function generateKeyUri(email: string, secret: string) {
    return "";
}

export async function verifyTOTPAndTrustDevice(userId: string, token: string, userAgent: string = 'Unknown') {
    return true;
}
