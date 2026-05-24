import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// TypeScript workaround: NextAuth v4 default export type issue in build environment
// This is a known compatibility issue between NextAuth v4 and TypeScript strict mode
import { NextRequest, NextResponse } from 'next/server';
import { authRateLimiter, getClientIP } from '@/lib/rate-limiter';

const handler = (NextAuth as any)(authOptions);

const POST = async (req: NextRequest, ctx: any) => {
  const ip = getClientIP(req);
  const result = authRateLimiter.checkLimit(ip);
  
  if (!result.allowed) {
    return NextResponse.json(
      { message: 'Too many login attempts. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  return handler(req, ctx);
};

export { handler as GET, POST };