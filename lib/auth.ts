import type { Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from './db';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from './constants';
import { getServerSession } from "next-auth/next";
import crypto from 'crypto';

// Hubi in env variables-ka ay jiraan
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set in environment variables');
}

// On Netlify, process.env.URL is automatically set to the site URL.
// This ensures auth works correctly on deployed environments.
if (!process.env.NEXTAUTH_URL && process.env.URL) {
  process.env.NEXTAUTH_URL = process.env.URL;
}
if (!process.env.NEXTAUTH_URL) {
  console.warn('NEXTAUTH_URL is not set. Auth redirects may not work correctly.');
}


// Module declaration moved to next-auth.d.ts

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        impersonateToken: { label: "Impersonate Token", type: "text" }
      },
      async authorize(credentials, req) {
        // Handle Impersonation Login
        if (credentials?.impersonateToken) {
          const user = await prisma.user.findFirst({
            where: { 
               resetToken: credentials.impersonateToken,
               resetTokenExpires: { gt: new Date() }
            },
            include: { company: true }
          });
          
          if (!user) {
            throw new Error("Waqtigu waa ka dhacay token-kan ama waa khalad. Fadlan dib isku day.");
          }
          
          const adminId = user.impersonatedBy;
          
          // Cleanup token
          await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: null, resetTokenExpires: null, impersonatedBy: null }
          });
          
          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            companyName: user.company?.name,
            companyId: user.company?.id,
            companyLogoUrl: user.company?.logoUrl || undefined,
            planType: user.company?.planType || 'COMBINED',
            impersonatedBy: adminId,
            sessionToken: crypto.randomUUID() // Added for session check
          };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            company: {
              select: { id: true, name: true, logoUrl: true, planType: true }
            }
          }
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        if (user.status === 'Inactive') {
          throw new Error("Akoonkaagu waa la damiyay. Fadlan la xiriir maamulaha.");
        }

        if (passwordMatch) {
          // Check if device is trusted (Optional logging)
          // Note: Full enforcement happens in Middleware/Layouts
          // const { isCurrentDeviceTrusted } = await import('./security');

          try {
            const isTrusted = true; // Disabled for fix

            if (!isTrusted) {
              console.log("New Device Detected for user (TOTP Required for Sensitive Areas):", user.email);
            }
          } catch (error) {
            console.error("Error in Trusted Device Check:", error);
          }
        }

        // Generate a new unique session token for this login
        const newSessionToken = crypto.randomUUID();

        // Save the new session token to DB (this invalidates all previous sessions!)
        await prisma.user.update({
          where: { id: user.id },
          data: { sessionToken: newSessionToken }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          companyName: user.company?.name,
          companyId: user.company?.id,
          companyLogoUrl: user.company?.logoUrl || undefined,
          planType: user.company?.planType || 'COMBINED',
          sessionToken: newSessionToken,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        const customUser = user as any;

        token.id = customUser.id;
        token.role = customUser.role;
        token.name = customUser.name;
        token.email = customUser.email;
        if (customUser.companyName) token.companyName = customUser.companyName;
        if (customUser.companyId) token.companyId = customUser.companyId;
        if (customUser.companyLogoUrl) token.companyLogoUrl = customUser.companyLogoUrl;
        if (customUser.planType) token.planType = customUser.planType;
        if (customUser.impersonatedBy) token.impersonatedBy = customUser.impersonatedBy;
        if (customUser.sessionToken) token.sessionToken = customUser.sessionToken;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        if (token.companyName) session.user.companyName = token.companyName as string;
        if (token.companyId) session.user.companyId = token.companyId as string;
        if (token.companyLogoUrl) session.user.companyLogoUrl = token.companyLogoUrl as string;
        if (token.planType) session.user.planType = token.planType as string;
        if (token.impersonatedBy) session.user.impersonatedBy = token.impersonatedBy as string;
        if (token.sessionToken) session.user.sessionToken = token.sessionToken as string;
      }
      return session;
    },
    // MUHIIM: Hagaajinta redirect callback
    async redirect({ url, baseUrl, token }: { url: string; baseUrl: string; token?: any }) {
      // Direct redirect logic based on token/role if available in scope (requires modifying next-auth types or logic flow)
      // Since token is not easily available in this callback signature in all versions, we rely on the client-side/middleware mainly.
      // BUT, we can check if the URL is /login or invalid, and redirect to a default.

      if (url === `${baseUrl}/login` || url.startsWith(`${baseUrl}/api/auth/error`)) {
        return `${baseUrl}/dashboard`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// NextAuth should not be called directly in app directory (Next.js 13+)
// Instead, export only authOptions and use in [...nextauth].ts API route

export const isAdmin = (userRole: string): boolean => {
  return userRole === USER_ROLES.ADMIN;
};

export const isManagerOrAdmin = (userRole: string): boolean => {
  return userRole === USER_ROLES.MANAGER || userRole === USER_ROLES.ADMIN;
};

// Mustaqbalka, waxaad halkan ku isticmaali kartaa getServerSession si aad u hesho user-ka server-side
// import { getServerSession } from "next-auth";
// export const getCurrentUser = async () => {
//   const session = await getServerSession(authOptions);
//   return session?.user;
// };

// Helper to get companyId and userId from session (for API routes)
export async function getSessionCompanyUser() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    return null; // Return null instead of throwing error
  }
  if (!session.user?.companyId) {
    return null; // Return null instead of throwing error
  }
  if (!session.user?.id) {
    return null; // Return null instead of throwing error
  }
  
  return {
    companyId: session.user.companyId,
    userId: session.user.id,
    userName: session.user.name,
    companyName: session.user.companyName,
    companyLogoUrl: session.user.companyLogoUrl,
    role: session.user.role as string
  };
}
