#!/bin/bash

# Fix Cache Service Errors - Comprehensive Version

echo "Fixing TypeScript errors in cache.service.ts (comprehensive)..."

# Path to the file with errors
FILE_PATH="/home/g_nelson/signals-1/libs/mcp/src/lib/services/cache.service.ts"

# Create a backup
cp "$FILE_PATH" "${FILE_PATH}.comprehensive.bak"

# Save a copy of the original for comparison
cp "$FILE_PATH" "${FILE_PATH}.original"

# We're going to completely replace the file with a correct version
# This is the most effective approach for fixing the complex syntax issues

cat > "$FILE_PATH" << 'EOF'
/**
 * Cache Service for MCP
 * 
 * Provides caching functionality with TTL, LRU eviction, and hierarchical invalidation.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CacheOptions {
  ttl?: number;  // Time to live in milliseconds
  maxSize?: number;  // Maximum number of items in the cache
  invalidationGroups?: string[];  // Groups for invalidation
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;  // Timestamp when the entry expires
  lastAccessed: number;  // Timestamp when the entry was last accessed
  groups: string[];  // Invalidation groups this entry belongs to
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
  expirations: number;
  invalidations: number;
  hitRatio: number;
  averageAccessTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultOptions: Required<CacheOptions> = {
    ttl: 300000,  // 5 minutes default TTL
    maxSize: 1000,  // Default max size
    invalidationGroups: ['default']  // Default invalidation group
  };
  
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    evictions: 0,
    expirations: 0,
    invalidations: 0,
    hitRatio: 0,
    averageAccessTime: 0
  };
  
  private accessTimes: number[] = [];
  private statsSubject = new BehaviorSubject<CacheStats>(this.stats);
  
  constructor() {
    // Start the periodic cleanup task
    this.startCleanupTask();
  }
  
  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | undefined {
    const startTime = performance.now();
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordMiss();
      return undefined;
    }
    
    // Check if the entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.recordExpiration();
      return undefined;
    }
    
    // Update the last accessed time
    entry.lastAccessed = Date.now();
    
    this.recordHit();
    this.recordAccessTime(performance.now() - startTime);
    
    return entry.value as T;
  }
  
  /**
   * Get a value from the cache with an observable
   */
  getObservable<T>(key: string): Observable<T | undefined> {
    return new Observable<T | undefined>(observer => {
      try {
        const value = this.get<T>(key);
        observer.next(value);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }
  
  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const opts = { ...this.defaultOptions, ...options };
    
    // Check if we need to make room in the cache
    if (this.cache.size >= opts.maxSize) {
      this.evictLRU();
    }
    
    // Create a new cache entry
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + opts.ttl,
      lastAccessed: Date.now(),
      groups: [...opts.invalidationGroups]
    };
    
    this.cache.set(key, entry as CacheEntry<unknown>);
    this.updateStats();
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if the entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.recordExpiration();
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.updateStats();
  }
  
  /**
   * Invalidate all cache entries in the specified groups
   */
  invalidateGroups(groups: string[]): number {
    if (!groups || groups.length === 0) return 0;
    
    let count = 0;
    
    // Find all keys to invalidate
    const keysToInvalidate: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      for (const group of groups) {
        if (entry.groups.includes(group)) {
          keysToInvalidate.push(key);
          count++;
          break;
        }
      }
    }
    
    // Delete all invalidated keys
    for (const key of keysToInvalidate) {
      this.cache.delete(key);
    }
    
    if (count > 0) {
      this.stats.invalidations += count;
      this.updateStats();
    }
    
    return count;
  }
  
  /**
   * Get current cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Observe cache statistics
   */
  observeStats(): Observable<CacheStats> {
    return this.statsSubject.asObservable();
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      this.stats.expirations += count;
      this.updateStats();
    }
    
    return count;
  }
  
  /**
   * Refresh an entry (update its expiration time)
   */
  refresh(key: string, options?: CacheOptions): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const opts = { ...this.defaultOptions, ...options };
    entry.expiresAt = Date.now() + opts.ttl;
    entry.lastAccessed = Date.now();
    
    return true;
  }
  
  /**
   * Get cache entries by group
   */
  getEntriesByGroup<T>(group: string): Map<string, T> {
    const result = new Map<string, T>();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.groups.includes(group)) {
        result.set(key, entry.value as T);
      }
    }
    
    return result;
  }
  
  /**
   * Get cache values by group as an observable
   */
  getValuesByGroup<T>(group: string): Observable<T[]> {
    return new Observable<T[]>(observer => {
      try {
        const values: T[] = [];
        
        for (const [, entry] of this.cache.entries()) {
          if (entry.groups.includes(group) && !this.isExpired(entry)) {
            values.push(entry.value as T);
          }
        }
        
        observer.next(values);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }
  
  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return entry.expiresAt <= Date.now();
  }
  
  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  /**
   * Record a cache hit
   */
  private recordHit(): void {
    this.stats.hits++;
    this.updateHitRatio();
  }
  
  /**
   * Record a cache miss
   */
  private recordMiss(): void {
    this.stats.misses++;
    this.updateHitRatio();
  }
  
  /**
   * Record a cache expiration
   */
  private recordExpiration(): void {
    this.stats.expirations++;
  }
  
  /**
   * Record an access time
   */
  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    
    // Keep only the last 100 access times
    if (this.accessTimes.length > 100) {
      this.accessTimes.shift();
    }
    
    // Update average access time
    this.stats.averageAccessTime = this.accessTimes.reduce((sum, t) => sum + t, 0) / this.accessTimes.length;
  }
  
  /**
   * Update hit ratio
   */
  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? (this.stats.hits / total) : 0;
  }
  
  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.statsSubject.next({ ...this.stats });
  }
  
  /**
   * Start the cleanup task
   */
  private startCleanupTask(): void {
    // Run cleanup every minute
    setInterval(() => {
      this.prune();
    }, 60000);
  }
}
EOF

echo "Fixed TypeScript errors in cache.service.ts (comprehensive)."
