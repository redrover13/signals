/**
 * @fileoverview cache.service module for the services component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Cache Service for MCP Operations
 * Provides in-memory caching with TTL for frequently accessed data
 */

export interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
  hits: number;
  created: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * In-memory cache service with TTL support
 */
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  private readonly defaultTTL = 300000; // 5 minutes default TTL
  private readonly maxEntries = 10000; // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options?: {
    defaultTTL?: number;
    maxEntries?: number;
    cleanupInterval?: number;
  }) {
    if (options?.defaultTTL) this.defaultTTL = options.defaultTTL;
    if (options?.maxEntries) this.maxEntries = options.maxEntries;

    // Start cleanup interval
    const cleanupInterval = options?.cleanupInterval || 60000; // 1 minute default
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupInterval);
  }

  /**
   * Get cached value
   */
  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;
    
    return entry.data as T;
  }

  /**
   * Set cached value with TTL
   */
  set<T = unknown>(key: string, data: T, ttl?: number): void {
    const effectiveTTL = ttl || this.defaultTTL;
    const expires = Date.now() + effectiveTTL;

    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expires,
      hits: 0,
      created: Date.now()
    });

    this.stats.sets++;
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.sets = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.deletes = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = this.cache.size * 1024; // Rough estimate of 1KB per entry

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage
    };
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T = unknown>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Create cache key for MCP requests
   */
  static createKey(method: string, params?: Record<string, unknown>, serverId?: string): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    const serverStr = serverId ? `@${serverId}` : '';
    return `${method}:${Buffer.from(paramsStr).toString('base64')}${serverStr}`;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    // Find entry with lowest hit count and oldest creation time
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits === 0 && entry.created < oldestTime) {
        oldestTime = entry.created;
        oldestKey = key;
      }
    }

    // If no unhit entries, find oldest entry
    if (!oldestKey) {
      for (const [key, entry] of this.cache.entries()) {
        if (entry.created < oldestTime) {
          oldestTime = entry.created;
          oldestKey = key;
        }
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Destroy cache service and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const cacheService = new CacheService({
  defaultTTL: 300000, // 5 minutes
  maxEntries: 10000,
  cleanupInterval: 60000 // 1 minute
});