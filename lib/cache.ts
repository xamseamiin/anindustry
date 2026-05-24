// lib/cache.ts - Redis-like caching system for reports
import { NextRequest } from 'next/server';

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private maxSize = 1000; // Maximum cache entries

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Generate cache key for reports
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

// Singleton instance
export const cache = new MemoryCache();

// Cache helper functions
export const getCachedData = async <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> => {
  // Try to get from cache first
  const cached = cache.get(key);
  if (cached) {
    console.log(`Cache hit for key: ${key}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`Cache miss for key: ${key}, fetching fresh data`);
  const data = await fetchFunction();
  
  // Store in cache
  cache.set(key, data, ttl);
  
  return data;
};

// Cache keys for different report types
export const CACHE_KEYS = {
  OVERVIEW_STATS: 'reports:overview',
  DAILY_REPORT: 'reports:daily',
  PROFIT_LOSS: 'reports:profit-loss',
  EXPENSES: 'reports:expenses',
  PROJECT_PERFORMANCE: 'reports:project-performance',
  DEBTS: 'reports:debts',
  BANK: 'reports:bank',
  PAYMENT_SCHEDULE: 'reports:payment-schedule'
} as const;
