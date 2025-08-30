#!/usr/bin/env ts-node

/**
 * @fileoverview performance-benchmark module for the mcp component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Performance Benchmark Script
 * Tests and validates performance optimizations for the Vietnamese F&B market
 */

import { MCPService } from '../src/lib/mcp.service';
import { CacheService } from '../src/lib/services/cache.service';
import { PerformanceMetricsService } from '../src/lib/services/performance-metrics.service';

interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  success: boolean;
  error?: string;
}

class PerformanceBenchmark {
  private mcpService: MCPService;
  private cacheService: CacheService;
  private performanceService: PerformanceMetricsService;

  constructor() {
    this.mcpService = MCPService.getInstance();
    this.cacheService = new CacheService({
      defaultTTL: 300000, // 5 minutes
      maxEntries: 10000
    });
    this.performanceService = new PerformanceMetricsService();
  }

  /**
   * Run all performance benchmarks
   */
  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting Performance Benchmarks for Vietnamese F&B Market...\n');

    const benchmarks = [
      this.benchmarkCacheOperations(),
      this.benchmarkMemoryCache(),
      this.benchmarkRequestRouting(),
      this.benchmarkVietnameseMarketOptimizations(),
      this.benchmarkResourceCleanup()
    ];

    const results = await Promise.all(benchmarks);
    
    this.printResults(results);
    await this.cleanup();
    
    return results;
  }

  /**
   * Benchmark cache operations
   */
  private async benchmarkCacheOperations(): Promise<BenchmarkResult> {
    const name = 'Cache Operations';
    const operations = 10000;
    let success = true;
    let error: string | undefined;

    try {
      const startTime = Date.now();

      // Test cache set operations
      for (let i = 0; i < operations / 2; i++) {
        this.cacheService.set(`key-${i}`, {
          id: i,
          data: `Vietnamese restaurant data ${i}`,
          region: 'Ho Chi Minh City',
          cuisine: 'Vietnamese'
        });
      }

      // Test cache get operations
      for (let i = 0; i < operations / 2; i++) {
        this.cacheService.get(`key-${i}`);
      }

      const duration = Date.now() - startTime;
      const opsPerSecond = Math.round((operations / duration) * 1000);

      return { name, duration, operations, opsPerSecond, success };
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      return { name, duration: 0, operations: 0, opsPerSecond: 0, success, error };
    }
  }

  /**
   * Benchmark memory cache efficiency
   */
  private async benchmarkMemoryCache(): Promise<BenchmarkResult> {
    const name = 'Memory Cache Efficiency';
    const operations = 5000;
    let success = true;
    let error: string | undefined;

    try {
      const startTime = Date.now();

      // Simulate BigQuery cache patterns
      const vietnameseQueries = [
        'SELECT * FROM restaurants WHERE region = "Ho Chi Minh City"',
        'SELECT * FROM menu_items WHERE cuisine = "Vietnamese" AND price < 100000',
        'SELECT COUNT(*) FROM orders WHERE date >= "2024-01-01"',
        'SELECT * FROM customers WHERE country = "Vietnam"',
        'SELECT * FROM reviews WHERE rating >= 4 AND language = "vi"'
      ];

      // Cache queries multiple times to test hit rates
      for (let i = 0; i < operations; i++) {
        const query = vietnameseQueries[i % vietnameseQueries.length];
        const cacheKey = CacheService.createKey('bigquery.query', { query }, 'databases');
        
        let result = this.cacheService.get(cacheKey);
        if (!result) {
          // Simulate query execution and caching
          result = { rows: Math.floor(Math.random() * 1000) };
          this.cacheService.set(cacheKey, result, 600000); // 10 minute TTL
        }
      }

      const duration = Date.now() - startTime;
      const opsPerSecond = Math.round((operations / duration) * 1000);
      
      const stats = this.cacheService.getStats();
      console.log(`  📊 Cache Stats: ${stats.totalEntries} entries, ${(stats.hitRate * 100).toFixed(1)}% hit rate`);

      return { name, duration, operations, opsPerSecond, success };
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      return { name, duration: 0, operations: 0, opsPerSecond: 0, success, error };
    }
  }

  /**
   * Benchmark request routing performance
   */
  private async benchmarkRequestRouting(): Promise<BenchmarkResult> {
    const name = 'Request Routing';
    const operations = 1000;
    let success = true;
    let error: string | undefined;

    try {
      const startTime = Date.now();

      // Simulate various request types
      const requestTypes = [
        'bigquery.query',
        'memory.store',
        'search.restaurants',
        'git.status',
        'fs.read'
      ];

      for (let i = 0; i < operations; i++) {
        const method = requestTypes[i % requestTypes.length];
        const requestId = `bench-${i}`;
        
        // Track request performance
        this.performanceService.startRequest(requestId, method, 'test-server');
        
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1));
        
        this.performanceService.completeRequest(requestId);
      }

      const duration = Date.now() - startTime;
      const opsPerSecond = Math.round((operations / duration) * 1000);

      return { name, duration, operations, opsPerSecond, success };
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      return { name, duration: 0, operations: 0, opsPerSecond: 0, success, error };
    }
  }

  /**
   * Benchmark Vietnamese market specific optimizations
   */
  private async benchmarkVietnameseMarketOptimizations(): Promise<BenchmarkResult> {
    const name = 'Vietnamese Market Optimizations';
    const operations = 500;
    let success = true;
    let error: string | undefined;

    try {
      const startTime = Date.now();

      // Test Vietnamese timezone optimizations
      const vietnamTimeZone = 'Asia/Ho_Chi_Minh';
      
      for (let i = 0; i < operations; i++) {
        // Simulate Vietnamese market queries
        const queries = [
          `SELECT * FROM events WHERE date >= DATE_SUB(CURRENT_DATE('${vietnamTimeZone}'), INTERVAL 7 DAY)`,
          `SELECT region, COUNT(*) FROM customers WHERE country = 'Vietnam' GROUP BY region`,
          `SELECT * FROM restaurants WHERE city IN ('Ho Chi Minh City', 'Hanoi', 'Da Nang')`
        ];
        
        const query = queries[i % queries.length];
        const cacheKey = CacheService.createKey('bigquery.optimized', { query }, 'databases');
        
        // Cache with Vietnamese market TTL (10 minutes for BigQuery)
        this.cacheService.set(cacheKey, { optimized: true, region: 'Vietnam' }, 600000);
      }

      // Test performance summary
      const summary = this.performanceService.getVietnameseMarketSummary();
      console.log(`  🇻🇳 Vietnamese Market: Network optimized: ${summary.networkOptimized}`);

      const duration = Date.now() - startTime;
      const opsPerSecond = Math.round((operations / duration) * 1000);

      return { name, duration, operations, opsPerSecond, success };
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      return { name, duration: 0, operations: 0, opsPerSecond: 0, success, error };
    }
  }

  /**
   * Benchmark resource cleanup
   */
  private async benchmarkResourceCleanup(): Promise<BenchmarkResult> {
    const name = 'Resource Cleanup';
    const operations = 100;
    let success = true;
    let error: string | undefined;

    try {
      const startTime = Date.now();

      // Create temporary cache service for cleanup testing
      const tempCache = new CacheService({ defaultTTL: 1000, maxEntries: 1000 });
      const tempMetrics = new PerformanceMetricsService();

      // Fill with data
      for (let i = 0; i < operations; i++) {
        tempCache.set(`temp-${i}`, { data: `temporary data ${i}` });
        tempMetrics.startRequest(`temp-req-${i}`, 'test.cleanup', 'test-server');
        tempMetrics.completeRequest(`temp-req-${i}`);
      }

      // Test cleanup
      tempCache.destroy();
      tempMetrics.destroy();

      const duration = Date.now() - startTime;
      const opsPerSecond = Math.round((operations / duration) * 1000);

      console.log(`  🧹 Cleanup: Successfully cleaned up ${operations} resources`);

      return { name, duration, operations, opsPerSecond, success };
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      return { name, duration: 0, operations: 0, opsPerSecond: 0, success, error };
    }
  }

  /**
   * Print benchmark results
   */
  private printResults(results: BenchmarkResult[]): void {
    console.log('\n📈 Performance Benchmark Results:');
    console.log('='.repeat(80));
    console.log('| Benchmark Name                    | Duration (ms) | Ops/sec | Status |');
    console.log('|'.repeat(80));

    for (const result of results) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const name = result.name.padEnd(33);
      const duration = result.duration.toString().padStart(10);
      const opsPerSecond = result.opsPerSecond.toString().padStart(6);
      
      console.log(`| ${name} | ${duration} | ${opsPerSecond} | ${status} |`);
      
      if (result.error) {
        console.log(`|   Error: ${result.error.substring(0, 60).padEnd(60)} |`);
      }
    }

    console.log('='.repeat(80));

    // Calculate overall performance score
    const totalOps = results.reduce((sum, r) => sum + r.operations, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const overallOpsPerSecond = Math.round((totalOps / totalDuration) * 1000);
    const successRate = (results.filter(r => r.success).length / results.length) * 100;

    console.log(`\n🎯 Overall Performance Score:`);
    console.log(`   Total Operations: ${totalOps}`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Overall Ops/sec: ${overallOpsPerSecond}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);

    // Vietnamese market specific recommendations
    console.log(`\n🇻🇳 Vietnamese Market Recommendations:`);
    if (overallOpsPerSecond > 1000) {
      console.log(`   ✅ Performance is excellent for Vietnamese market conditions`);
    } else if (overallOpsPerSecond > 500) {
      console.log(`   ⚠️  Performance is acceptable but could be improved`);
    } else {
      console.log(`   ❌ Performance needs optimization for Vietnamese market`);
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      this.cacheService.destroy();
      this.performanceService.destroy();
      console.log('\n🧹 Benchmark cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAllBenchmarks()
    .then(() => {
      console.log('\n✅ Performance benchmarks completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Benchmark failed:', error);
      process.exit(1);
    });
}

export { PerformanceBenchmark, BenchmarkResult };