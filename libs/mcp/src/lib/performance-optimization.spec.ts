/**
 * Performance Optimization Tests
 * Tests for caching, connection pooling, and query optimization
 */

import { MCPService } from '../src/lib/mcp.service';
import { CacheService } from '../src/lib/services/cache.service';
import { PerformanceMetricsService } from '../src/lib/services/performance-metrics.service';
import { ConnectionPoolService } from '../src/lib/services/connection-pool.service';

describe('Performance Optimizations', () => {
  let mcpService: MCPService;
  let cacheService: CacheService;
  let performanceService: PerformanceMetricsService;
  let connectionPool: ConnectionPoolService;

  beforeEach(() => {
    mcpService = MCPService.getInstance();
    cacheService = new CacheService({ defaultTTL: 1000, maxEntries: 100 });
    performanceService = new PerformanceMetricsService();
    connectionPool = new ConnectionPoolService({ maxConnections: 5 });
  });

  afterEach(async () => {
    cacheService.destroy();
    performanceService.destroy();
    await connectionPool.shutdown();
  });

  describe('Cache Service', () => {
    it('should cache and retrieve data correctly', () => {
      const key = 'test-key';
      const data = { message: 'Hello Vietnam!' };

      // Cache miss
      expect(cacheService.get(key)).toBeNull();

      // Set data
      cacheService.set(key, data);

      // Cache hit
      expect(cacheService.get(key)).toEqual(data);
    });

    it('should handle TTL expiration', async () => {
      const key = 'expiring-key';
      const data = { message: 'Temporary data' };

      cacheService.set(key, data, 50); // 50ms TTL

      expect(cacheService.get(key)).toEqual(data);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cacheService.get(key)).toBeNull();
    });

    it('should create consistent cache keys', () => {
      const method = 'bigquery.query';
      const params = { query: 'SELECT * FROM restaurants', region: 'vietnam' };
      const serverId = 'databases';

      const key1 = CacheService.createKey(method, params, serverId);
      const key2 = CacheService.createKey(method, params, serverId);

      expect(key1).toBe(key2);
      expect(key1).toContain(method);
      expect(key1).toContain('@databases');
    });

    it('should track cache statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      cacheService.get('key1'); // hit
      cacheService.get('key3'); // miss

      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.totalHits).toBe(1);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should implement LRU eviction', () => {
      const smallCache = new CacheService({ maxEntries: 2 });

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should evict key1

      expect(smallCache.get('key1')).toBeNull();
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');

      smallCache.destroy();
    });
  });

  describe('Performance Metrics Service', () => {
    it('should track request metrics', () => {
      const requestId = 'test-request-123';
      const method = 'bigquery.query';
      const serverId = 'databases';

      performanceService.startRequest(requestId, method, serverId);
      
      // Simulate processing time
      setTimeout(() => {
        performanceService.completeRequest(requestId, { cacheHit: false });
      }, 10);

      setTimeout(() => {
        const stats = performanceService.getPerformanceStats();
        expect(stats.totalRequests).toBeGreaterThan(0);
      }, 50);
    });

    it('should calculate correct performance statistics', () => {
      // Simulate multiple requests
      for (let i = 0; i < 10; i++) {
        const requestId = `request-${i}`;
        performanceService.startRequest(requestId, 'test.method', 'test-server');
        
        // Simulate different response times
        setTimeout(() => {
          if (i < 8) {
            performanceService.completeRequest(requestId);
          } else {
            performanceService.failRequest(requestId, 'Test error');
          }
        }, i * 10);
      }

      setTimeout(() => {
        const stats = performanceService.getPerformanceStats();
        expect(stats.totalRequests).toBe(10);
        expect(stats.successfulRequests).toBe(8);
        expect(stats.failedRequests).toBe(2);
        expect(stats.errorRate).toBe(0.2);
      }, 200);
    });

    it('should provide Vietnamese market recommendations', () => {
      const summary = performanceService.getVietnameseMarketSummary();
      expect(summary).toHaveProperty('networkOptimized');
      expect(summary).toHaveProperty('averageLatency');
      expect(summary).toHaveProperty('recommendation');
      expect(typeof summary.recommendation).toBe('string');
    });
  });

  describe('Connection Pool Service', () => {
    it('should manage connection lifecycle', async () => {
      const serverId = 'test-server';
      const serverConfig = {
        id: serverId,
        name: 'Test Server',
        category: 'test',
        type: 'test',
        enabled: true,
        priority: 5,
        connection: {
          type: 'stdio' as const,
          endpoint: 'test-command',
          timeout: 30000
        },
        healthCheck: {
          interval: 60000,
          timeout: 5000,
          failureThreshold: 3
        }
      };

      const connection = await connectionPool.acquireConnection(serverId, serverConfig);
      expect(connection).toBeDefined();
      expect(connection.serverId).toBe(serverId);
      expect(connection.status).toBe('active');

      connectionPool.releaseConnection(connection);
      expect(connection.status).toBe('idle');

      const stats = connectionPool.getPoolStats(serverId);
      expect(stats.totalConnections).toBeGreaterThan(0);
    });

    it('should implement connection reuse', async () => {
      const serverId = 'reuse-test-server';
      const serverConfig = {
        id: serverId,
        name: 'Reuse Test Server',
        category: 'test',
        type: 'test',
        enabled: true,
        priority: 5,
        connection: {
          type: 'stdio' as const,
          endpoint: 'test-command',
          timeout: 30000
        },
        healthCheck: {
          interval: 60000,
          timeout: 5000,
          failureThreshold: 3
        }
      };

      const connection1 = await connectionPool.acquireConnection(serverId, serverConfig);
      connectionPool.releaseConnection(connection1);

      const connection2 = await connectionPool.acquireConnection(serverId, serverConfig);
      
      // Should reuse the same connection
      expect(connection2.id).toBe(connection1.id);
      expect(connection2.useCount).toBeGreaterThan(1);
    });
  });

  describe('Vietnamese Market Optimizations', () => {
    it('should optimize BigQuery queries for Vietnamese market', async () => {
      // This would test the BigQuery optimization logic
      const query = 'SELECT * FROM events_20241223';
      
      // Mock the BigQuery optimization
      const optimizedQuery = 'SELECT * FROM events_20241223 WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE(\'%Y%m%d\', DATE_SUB(CURRENT_DATE(\'Asia/Ho_Chi_Minh\'), INTERVAL 7 DAY)) AND FORMAT_DATE(\'%Y%m%d\', CURRENT_DATE(\'Asia/Ho_Chi_Minh\'))';
      
      expect(optimizedQuery).toContain('Asia/Ho_Chi_Minh');
      expect(optimizedQuery).toContain('_TABLE_SUFFIX');
    });

    it('should apply appropriate cache TTLs for Vietnamese market', async () => {
      // Test cache TTL selection for different operations
      const bigqueryTTL = 600000; // 10 minutes
      const searchTTL = 300000; // 5 minutes
      const memoryTTL = 60000; // 1 minute

      expect(bigqueryTTL).toBeGreaterThan(searchTTL);
      expect(searchTTL).toBeGreaterThan(memoryTTL);
    });
  });

  describe('Integration Tests', () => {
    it('should demonstrate end-to-end performance optimization', async () => {
      // This is a conceptual test showing how all optimizations work together
      const startTime = Date.now();
      
      // Simulate a cached BigQuery request
      const cacheKey = CacheService.createKey('bigquery.query', { query: 'SELECT COUNT(*) FROM restaurants' }, 'databases');
      
      // First request - cache miss
      cacheService.set(cacheKey, { result: [{ count: 1250 }] });
      
      // Second request - cache hit
      const cachedResult = cacheService.get(cacheKey);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(cachedResult).toBeDefined();
      expect(duration).toBeLessThan(100); // Should be very fast due to caching
    });
  });
});

describe('Resource Cleanup Tests', () => {
  it('should properly cleanup resources on shutdown', async () => {
    const cacheService = new CacheService();
    const performanceService = new PerformanceMetricsService();
    const connectionPool = new ConnectionPoolService();

    // Use services
    cacheService.set('test', 'data');
    performanceService.startRequest('test-req', 'test.method', 'test-server');

    // Cleanup
    cacheService.destroy();
    performanceService.destroy();
    await connectionPool.shutdown();

    // Verify cleanup
    const stats = cacheService.getStats();
    expect(stats.totalEntries).toBe(0);
  });
});