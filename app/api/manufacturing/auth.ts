// app/api/manufacturing/auth.ts - Manufacturing Module Authentication
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function getSessionCompanyId(): Promise<string> {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session found');
  }

  // Get user's company ID
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true }
  });

  if (!user?.companyId) {
    throw new Error('Unauthorized: User not associated with any company');
  }

  return user.companyId;
}

export async function requireManufacturingAccess(): Promise<{ userId: string; companyId: string }> {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session found');
  }

  // Get user's company ID
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true }
  });

  if (!user?.companyId) {
    throw new Error('Unauthorized: User not associated with any company');
  }

  return {
    userId: session.user.id,
    companyId: user.companyId
  };
}
