// lib/rate-limiter.ts - Rate Limiting for API endpoints
import { NextRequest } from 'next/server';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) { // 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    const current = this.requests.get(key);

    if (!current || now > current.resetTime) {
      // Reset or create new entry
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (current.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        message: 'Too many requests. Please try again later.'
      };
    }

    // Increment count
    current.count++;
    this.requests.set(key, current);

    return {
      allowed: true,
      remaining: this.maxRequests - current.count,
      resetTime: current.resetTime
    };
  }
}

// Create rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
export const uploadRateLimiter = new RateLimiter(10, 5 * 60 * 1000); // 10 uploads per 5 minutes
export const messageRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 messages per 15 minutes

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

export function createRateLimitResponse(remaining: number, resetTime: number, message: string) {
  return new Response(JSON.stringify({
    error: message,
    remaining,
    resetTime
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString()
    }
  });
}
