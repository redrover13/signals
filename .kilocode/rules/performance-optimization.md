# Performance Optimization Guidelines

## Overview

This document defines performance optimization guidelines for the Signals monorepo, focusing on efficient resource usage, cost optimization, and scalable patterns that work well within the Vietnamese market context and GCP infrastructure.

## Database and Query Optimization

### Rule: Efficient BigQuery Patterns

**Severity**: Warning  
**Category**: Performance

BigQuery queries should be optimized for cost and performance, especially considering the Vietnamese data residency requirements.

#### ✅ Compliant Examples

```typescript
// Good: Optimized BigQuery patterns
export class AnalyticsService {
  constructor(
    private readonly bigQuery: BigQuery,
    private readonly logger: Logger,
  ) {}

  async getUserAnalytics(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<UserAnalytics[]> {
    // Good: Use partitioned tables and clustering
    const sql = `
      SELECT 
        user_id,
        DATE(created_at) as date,
        COUNT(*) as event_count,
        SUM(revenue_vnd) as total_revenue_vnd
      FROM \`${this.getDatasetId()}.user_events\`
      WHERE 
        -- Use partition pruning
        DATE(created_at) BETWEEN @start_date AND @end_date
        -- Use clustering column for filtering
        ${userId ? 'AND user_id = @user_id' : ''}
        -- Filter for Vietnamese users only
        AND country_code = 'VN'
      GROUP BY user_id, DATE(created_at)
      ORDER BY date DESC
      -- Limit results to prevent excessive data transfer
      LIMIT 10000
    `;

    const options = {
      query: sql,
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        ...(userId && { user_id: userId }),
      },
      location: 'asia-southeast1', // Vietnamese data residency
      // Use query cache when possible
      useQueryCache: true,
      // Set job timeout
      jobTimeoutMs: 30000,
    };

    const startTime = Date.now();
    try {
      const [rows] = await this.bigQuery.query(options);
      const duration = Date.now() - startTime;

      this.logger.info('BigQuery analytics query completed', {
        duration,
        rowCount: rows.length,
        dateRange: { startDate, endDate },
        userId: userId || 'all_users',
      });

      return rows.map(this.mapToUserAnalytics);
    } catch (error) {
      this.logger.error('BigQuery analytics query failed', {
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        sql: sql.substring(0, 200),
      });
      throw error;
    }
  }

  // Good: Use materialized views for frequently accessed data
  async getPopularMenuItems(limit = 20): Promise<PopularMenuItem[]> {
    // This query uses a pre-computed materialized view
    const sql = `
      SELECT 
        menu_item_id,
        item_name_vi,
        item_name_en,
        total_orders,
        total_revenue_vnd,
        avg_rating
      FROM \`${this.getDatasetId()}.popular_menu_items_mv\`
      WHERE 
        -- Only active items
        is_active = true
        -- Vietnamese market focus
        AND country_code = 'VN'
      ORDER BY total_orders DESC
      LIMIT @limit
    `;

    const [rows] = await this.bigQuery.query({
      query: sql,
      params: { limit },
      location: 'asia-southeast1',
      useQueryCache: true,
    });

    return rows.map(this.mapToPopularMenuItem);
  }

  private getDatasetId(): string {
    return process.env.NODE_ENV === 'production' ? 'dulce_de_saigon_prod' : 'dulce_de_saigon_dev';
  }
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Inefficient BigQuery patterns
export class BadAnalyticsService {
  async getUserAnalytics(): Promise<any[]> {
    // Bad: No date filtering, scans entire table
    const sql = `
      SELECT * FROM user_events
      ORDER BY created_at DESC
    `;

    // Bad: No location specified, no caching
    const [rows] = await this.bigQuery.query(sql);
    return rows;
  }

  async getRevenueData(): Promise<any[]> {
    // Bad: No partitioning, expensive JOIN
    const sql = `
      SELECT 
        u.*,
        o.*,
        p.*
      FROM users u
      JOIN orders o ON u.id = o.user_id
      JOIN payments p ON o.id = p.order_id
      WHERE u.created_at > '2020-01-01'
    `;

    return this.bigQuery.query(sql);
  }
}
```

### Rule: Efficient Data Streaming

**Severity**: Warning  
**Category**: Performance

Use streaming patterns for large data processing to avoid memory issues.

#### ✅ Compliant Examples

```typescript
// Good: Streaming data processing
import { Transform, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export class DataProcessor {
  constructor(
    private readonly bigQuery: BigQuery,
    private readonly storage: Storage,
    private readonly logger: Logger,
  ) {}

  async processLargeDataset(
    query: string,
    outputBucket: string,
    outputFile: string,
  ): Promise<void> {
    const queryStream = this.bigQuery.createQueryStream({
      query,
      location: 'asia-southeast1',
    });

    const transformStream = new Transform({
      objectMode: true,
      transform(chunk: any, encoding, callback) {
        try {
          // Process each row
          const processed = this.processRow(chunk);
          callback(null, JSON.stringify(processed) + '\n');
        } catch (error) {
          callback(error);
        }
      },
    });

    const uploadStream = this.storage
      .bucket(outputBucket)
      .file(outputFile)
      .createWriteStream({
        metadata: {
          contentType: 'application/json',
        },
      });

    try {
      await pipelineAsync(queryStream, transformStream, uploadStream);

      this.logger.info('Large dataset processing completed', {
        outputBucket,
        outputFile,
        query: query.substring(0, 100),
      });
    } catch (error) {
      this.logger.error('Large dataset processing failed', {
        error: error instanceof Error ? error.message : String(error),
        outputBucket,
        outputFile,
      });
      throw error;
    }
  }

  private processRow(row: any): any {
    // Transform data for Vietnamese market
    return {
      ...row,
      // Convert timestamps to Vietnamese timezone
      created_at_vn: new Date(row.created_at).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      }),
      // Format currency for Vietnamese display
      revenue_formatted: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(row.revenue_vnd),
    };
  }
}
```

## Caching Strategies

### Rule: Multi-Level Caching

**Severity**: Warning  
**Category**: Performance

Implement appropriate caching strategies for different data access patterns.

#### ✅ Compliant Examples

```typescript
// Good: Multi-level caching strategy
export class MenuService {
  private readonly memoryCache = new Map<string, { data: any; expiry: number }>();
  private readonly MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly redisClient: Redis,
    private readonly database: Database,
    private readonly logger: Logger,
  ) {}

  async getMenuItem(itemId: string): Promise<MenuItem | null> {
    // Level 1: Memory cache (fastest)
    const memoryCached = this.getFromMemoryCache(itemId);
    if (memoryCached) {
      this.logger.debug('Menu item served from memory cache', { itemId });
      return memoryCached;
    }

    // Level 2: Redis cache (fast)
    try {
      const redisCached = await this.redisClient.get(`menu:${itemId}`);
      if (redisCached) {
        const item = JSON.parse(redisCached);
        this.setMemoryCache(itemId, item);
        this.logger.debug('Menu item served from Redis cache', { itemId });
        return item;
      }
    } catch (error) {
      this.logger.warn('Redis cache miss', { itemId, error });
    }

    // Level 3: Database (slowest)
    const item = await this.database.collection('menu_items').findOne({ id: itemId });
    if (item) {
      // Cache in both levels
      this.setMemoryCache(itemId, item);
      try {
        await this.redisClient.setex(
          `menu:${itemId}`,
          15 * 60, // 15 minutes
          JSON.stringify(item),
        );
      } catch (error) {
        this.logger.warn('Failed to cache in Redis', { itemId, error });
      }

      this.logger.debug('Menu item served from database', { itemId });
    }

    return item;
  }

  async getPopularMenuItems(limit = 20): Promise<MenuItem[]> {
    const cacheKey = `popular_menu:${limit}`;

    // Check Redis cache first (popular items change less frequently)
    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        this.logger.debug('Popular menu items served from cache');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Redis cache error for popular items', { error });
    }

    // Query database with optimized query
    const items = await this.database
      .collection('menu_items')
      .find({
        is_active: true,
        country_code: 'VN', // Vietnamese market only
      })
      .sort({ order_count: -1 })
      .limit(limit)
      .toArray();

    // Cache for longer since popular items change slowly
    try {
      await this.redisClient.setex(
        cacheKey,
        60 * 60, // 1 hour
        JSON.stringify(items),
      );
    } catch (error) {
      this.logger.warn('Failed to cache popular items', { error });
    }

    return items;
  }

  async invalidateMenuItemCache(itemId: string): Promise<void> {
    // Clear from all cache levels
    this.memoryCache.delete(itemId);

    try {
      await this.redisClient.del(`menu:${itemId}`);
      // Also clear popular items cache as it might be affected
      await this.redisClient.del('popular_menu:*');
    } catch (error) {
      this.logger.error('Failed to invalidate cache', { itemId, error });
    }
  }

  private getFromMemoryCache(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    if (cached) {
      this.memoryCache.delete(key); // Clean up expired entry
    }

    return null;
  }

  private setMemoryCache(key: string, data: any): void {
    // Prevent memory cache from growing too large
    if (this.memoryCache.size > 1000) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + this.MEMORY_CACHE_TTL,
    });
  }
}
```

### Rule: Cache Warming Strategies

**Severity**: Warning  
**Category**: Performance

Implement cache warming for critical data to improve user experience.

#### ✅ Compliant Examples

```typescript
// Good: Cache warming strategy
export class CacheWarmingService {
  constructor(
    private readonly menuService: MenuService,
    private readonly analyticsService: AnalyticsService,
    private readonly scheduler: Scheduler,
    private readonly logger: Logger,
  ) {}

  async startCacheWarming(): Promise<void> {
    // Warm cache every 30 minutes during business hours (Vietnam time)
    this.scheduler.schedule('*/30 6-22 * * *', async () => {
      await this.warmCriticalCaches();
    });

    // Warm cache at startup
    await this.warmCriticalCaches();
  }

  private async warmCriticalCaches(): Promise<void> {
    const startTime = Date.now();

    try {
      await Promise.all([
        this.warmPopularMenuItems(),
        this.warmDailyAnalytics(),
        this.warmUserPreferences(),
      ]);

      const duration = Date.now() - startTime;
      this.logger.info('Cache warming completed', { duration });
    } catch (error) {
      this.logger.error('Cache warming failed', { error });
    }
  }

  private async warmPopularMenuItems(): Promise<void> {
    // Pre-load popular menu items for different categories
    const categories = ['Phở', 'Bún', 'Cơm', 'Đồ Uống', 'Tráng Miệng'];

    await Promise.all(
      categories.map(async (category) => {
        try {
          await this.menuService.getPopularItemsByCategory(category, 10);
          this.logger.debug('Warmed popular items cache', { category });
        } catch (error) {
          this.logger.warn('Failed to warm popular items cache', { category, error });
        }
      }),
    );
  }

  private async warmDailyAnalytics(): Promise<void> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Pre-compute daily analytics that are frequently accessed
      await this.analyticsService.getDailyRevenue(yesterday);
      await this.analyticsService.getTopSellingItems(yesterday);
      this.logger.debug('Warmed daily analytics cache');
    } catch (error) {
      this.logger.warn('Failed to warm daily analytics cache', { error });
    }
  }

  private async warmUserPreferences(): Promise<void> {
    try {
      // Pre-load common user preferences for Vietnamese market
      await this.menuService.getMenuByPreferences({
        language: 'vi',
        dietaryRestrictions: [],
        spiceLevel: 'medium',
      });
      this.logger.debug('Warmed user preferences cache');
    } catch (error) {
      this.logger.warn('Failed to warm user preferences cache', { error });
    }
  }
}
```

## Resource Management

### Rule: Connection Pooling

**Severity**: Error  
**Category**: Performance

Use connection pooling for database and external service connections.

#### ✅ Compliant Examples

```typescript
// Good: Proper connection pooling
export class DatabaseManager {
  private static instance: DatabaseManager;
  private connectionPool: Pool;

  private constructor() {
    this.connectionPool = new Pool({
      // Connection pool configuration
      min: 2, // Minimum connections
      max: 20, // Maximum connections
      acquireTimeoutMillis: 30000, // 30 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      reapIntervalMillis: 1000, // 1 second
      createRetryIntervalMillis: 200,

      // Vietnamese data residency
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'dulce_de_saigon',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,

      // SSL configuration for production
      ssl:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false,
            }
          : false,
    });

    // Handle pool events
    this.connectionPool.on('connect', (client) => {
      console.log('Database connection established');
    });

    this.connectionPool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.connectionPool.connect();

    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release(); // Always release connection back to pool
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.connectionPool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.connectionPool.end();
  }

  getPoolStatus(): PoolStatus {
    return {
      totalConnections: this.connectionPool.totalCount,
      idleConnections: this.connectionPool.idleCount,
      waitingClients: this.connectionPool.waitingCount,
    };
  }
}
```

### Rule: Memory Management

**Severity**: Warning  
**Category**: Performance

Implement proper memory management to prevent memory leaks.

#### ✅ Compliant Examples

```typescript
// Good: Memory-efficient data processing
export class OrderProcessor {
  private readonly processingQueue = new Map<string, ProcessingJob>();
  private readonly maxQueueSize = 1000;
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly logger: Logger) {
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, 60000); // Every minute
  }

  async processOrderBatch(orders: Order[]): Promise<ProcessResult[]> {
    // Process in smaller chunks to manage memory
    const chunkSize = 50;
    const results: ProcessResult[] = [];

    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);

      // Process chunk and immediately release memory
      const chunkResults = await this.processChunk(chunk);
      results.push(...chunkResults);

      // Force garbage collection hint for large batches
      if (orders.length > 1000 && i % 500 === 0) {
        if (global.gc) {
          global.gc();
        }
      }
    }

    return results;
  }

  private async processChunk(orders: Order[]): Promise<ProcessResult[]> {
    const promises = orders.map(async (order) => {
      const jobId = `job_${order.id}_${Date.now()}`;

      // Check queue size to prevent memory overflow
      if (this.processingQueue.size >= this.maxQueueSize) {
        throw new Error('Processing queue is full');
      }

      const job: ProcessingJob = {
        id: jobId,
        orderId: order.id,
        startTime: Date.now(),
        status: 'processing',
      };

      this.processingQueue.set(jobId, job);

      try {
        const result = await this.processOrder(order);
        job.status = 'completed';
        job.endTime = Date.now();
        return result;
      } catch (error) {
        job.status = 'failed';
        job.endTime = Date.now();
        job.error = error instanceof Error ? error.message : String(error);
        throw error;
      }
    });

    return Promise.allSettled(promises).then((results) =>
      results.map((result) =>
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason },
      ),
    );
  }

  private cleanupCompletedJobs(): void {
    const cutoffTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    let cleanedCount = 0;

    for (const [jobId, job] of this.processingQueue.entries()) {
      if (job.endTime && job.endTime < cutoffTime) {
        this.processingQueue.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug('Cleaned up completed jobs', { cleanedCount });
    }
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Wait for ongoing jobs to complete
    const ongoingJobs = Array.from(this.processingQueue.values()).filter(
      (job) => job.status === 'processing',
    );

    if (ongoingJobs.length > 0) {
      this.logger.info('Waiting for ongoing jobs to complete', {
        count: ongoingJobs.length,
      });

      // Wait up to 30 seconds for jobs to complete
      const timeout = setTimeout(() => {
        this.logger.warn('Shutdown timeout reached, some jobs may be incomplete');
      }, 30000);

      while (this.processingQueue.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      clearTimeout(timeout);
    }
  }
}

interface ProcessingJob {
  id: string;
  orderId: string;
  startTime: number;
  endTime?: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}
```

These performance optimization guidelines ensure efficient resource usage, cost-effective operations, and scalable performance across the Signals monorepo, particularly optimized for the Vietnamese market and GCP infrastructure.
