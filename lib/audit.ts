import prisma from '@/lib/prisma';

export async function logAudit({
    action,
    entity,
    entityId,
    details,
    userId,
    companyId,
    ipAddress,
    userAgent
}: {
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    userId: string;
    companyId: string;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                details,
                userId,
                companyId,
                ipAddress,
                userAgent
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
