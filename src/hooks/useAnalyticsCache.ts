import { useState, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const analyticsCache = new AnalyticsCache();

export function useAnalyticsCache() {
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  const getCached = useCallback(<T>(key: string): T | null => {
    const result = analyticsCache.get<T>(key);
    setCacheStats(prev => ({
      hits: result ? prev.hits + 1 : prev.hits,
      misses: result ? prev.misses : prev.misses + 1
    }));
    return result;
  }, []);

  const setCached = useCallback(<T>(key: string, data: T, ttl?: number): void => {
    analyticsCache.set(key, data, ttl);
  }, []);

  const hasCached = useCallback((key: string): boolean => {
    return analyticsCache.has(key);
  }, []);

  const clearCache = useCallback((): void => {
    analyticsCache.clear();
    setCacheStats({ hits: 0, misses: 0 });
  }, []);

  const invalidateCache = useCallback((pattern: string): void => {
    analyticsCache.invalidate(pattern);
  }, []);

  return {
    getCached,
    setCached,
    hasCached,
    clearCache,
    invalidateCache,
    cacheStats
  };
}

export default analyticsCache;