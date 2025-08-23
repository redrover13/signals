/**
 * Performance Metrics Service
 * Tracks response times, throughput, and other performance indicators for MCP operations
 */

export interface RequestMetrics {
  requestId: string;
  method: string;
  serverId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  cacheHit?: boolean;
  retryCount?: number;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  percentile95ResponseTime: number;
  percentile99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  cacheHitRate: number;
  timeWindow: number; // Time window for these stats in milliseconds
}

export interface ServerPerformanceStats extends PerformanceStats {
  serverId: string;
  serverStatus: 'healthy' | 'degraded' | 'error';
}

/**
 * Performance Metrics Service
 */
export class PerformanceMetricsService {
  private activeRequests = new Map<string, RequestMetrics>();
  private completedRequests: RequestMetrics[] = [];
  private readonly maxHistorySize = 10000; // Keep last 10k requests
  private readonly statsWindowMs = 300000; // 5 minutes window for stats

  private performanceTimer: NodeJS.Timeout | null = null;
  private currentStats: PerformanceStats | null = null;
  private serverStats = new Map<string, ServerPerformanceStats>();

  constructor() {
    // Update stats every 30 seconds
    this.performanceTimer = setInterval(() => {
      this.updatePerformanceStats();
    }, 30000);
  }

  /**
   * Start tracking a request
   */
  startRequest(requestId: string, method: string, serverId: string): void {
    const metrics: RequestMetrics = {
      requestId,
      method,
      serverId,
      startTime: Date.now(),
      success: false
    };

    this.activeRequests.set(requestId, metrics);
  }

  /**
   * Complete a request with success
   */
  completeRequest(
    requestId: string, 
    options?: {
      cacheHit?: boolean;
      retryCount?: number;
    }
  ): void {
    const metrics = this.activeRequests.get(requestId);
    if (!metrics) return;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = true;
    metrics.cacheHit = options?.cacheHit;
    metrics.retryCount = options?.retryCount || 0;

    this.activeRequests.delete(requestId);
    this.addToHistory(metrics);
  }

  /**
   * Complete a request with error
   */
  failRequest(
    requestId: string, 
    error: string,
    options?: {
      retryCount?: number;
    }
  ): void {
    const metrics = this.activeRequests.get(requestId);
    if (!metrics) return;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = false;
    metrics.error = error;
    metrics.retryCount = options?.retryCount || 0;

    this.activeRequests.delete(requestId);
    this.addToHistory(metrics);
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    if (!this.currentStats) {
      this.updatePerformanceStats();
    }
    return this.currentStats!;
  }

  /**
   * Get performance statistics for a specific server
   */
  getServerPerformanceStats(serverId: string): ServerPerformanceStats | null {
    return this.serverStats.get(serverId) || null;
  }

  /**
   * Get performance statistics for all servers
   */
  getAllServerStats(): Map<string, ServerPerformanceStats> {
    return new Map(this.serverStats);
  }

  /**
   * Get recent request history
   */
  getRecentRequests(limit = 100): RequestMetrics[] {
    return this.completedRequests
      .slice(-limit)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  }

  /**
   * Get slow requests (above threshold)
   */
  getSlowRequests(thresholdMs = 5000, limit = 50): RequestMetrics[] {
    return this.completedRequests
      .filter(req => req.duration && req.duration > thresholdMs)
      .slice(-limit)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  /**
   * Get failed requests
   */
  getFailedRequests(limit = 50): RequestMetrics[] {
    return this.completedRequests
      .filter(req => !req.success)
      .slice(-limit)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  }

  /**
   * Get performance summary for Vietnamese market optimization
   */
  getVietnameseMarketSummary(): {
    networkOptimized: boolean;
    averageLatency: number;
    recommendation: string;
  } {
    const stats = this.getPerformanceStats();
    
    // Vietnamese market considerations
    const isNetworkOptimized = stats.averageResponseTime < 2000; // < 2s for Vietnamese network conditions
    const recommendation = this.getOptimizationRecommendation(stats);

    return {
      networkOptimized: isNetworkOptimized,
      averageLatency: stats.averageResponseTime,
      recommendation
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.activeRequests.clear();
    this.completedRequests = [];
    this.currentStats = null;
    this.serverStats.clear();
  }

  /**
   * Destroy metrics service
   */
  destroy(): void {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }
    this.clearMetrics();
  }

  /**
   * Add request to history
   */
  private addToHistory(metrics: RequestMetrics): void {
    this.completedRequests.push(metrics);
    
    // Maintain history size
    if (this.completedRequests.length > this.maxHistorySize) {
      this.completedRequests = this.completedRequests.slice(-this.maxHistorySize);
    }
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(): void {
    const now = Date.now();
    const windowStart = now - this.statsWindowMs;
    
    // Filter requests within time window
    const recentRequests = this.completedRequests.filter(req => 
      req.endTime && req.endTime >= windowStart
    );

    if (recentRequests.length === 0) {
      this.currentStats = this.createEmptyStats();
      return;
    }

    // Calculate overall stats
    this.currentStats = this.calculateStats(recentRequests, this.statsWindowMs);

    // Calculate per-server stats
    this.updateServerStats(recentRequests);
  }

  /**
   * Calculate statistics for a set of requests
   */
  private calculateStats(requests: RequestMetrics[], timeWindow: number): PerformanceStats {
    const totalRequests = requests.length;
    const successfulRequests = requests.filter(req => req.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const cacheHits = requests.filter(req => req.cacheHit).length;

    const durations = requests
      .filter(req => req.duration !== undefined)
      .map(req => req.duration!)
      .sort((a, b) => a - b);

    const averageResponseTime = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;

    const minResponseTime = durations.length > 0 ? durations[0] : 0;
    const maxResponseTime = durations.length > 0 ? durations[durations.length - 1] : 0;

    // Calculate percentiles
    const percentile95Index = Math.floor(durations.length * 0.95);
    const percentile99Index = Math.floor(durations.length * 0.99);
    const percentile95ResponseTime = durations.length > 0 ? durations[percentile95Index] || 0 : 0;
    const percentile99ResponseTime = durations.length > 0 ? durations[percentile99Index] || 0 : 0;

    const requestsPerSecond = totalRequests / (timeWindow / 1000);
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      minResponseTime,
      maxResponseTime,
      percentile95ResponseTime,
      percentile99ResponseTime,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      timeWindow
    };
  }

  /**
   * Update per-server statistics
   */
  private updateServerStats(requests: RequestMetrics[]): void {
    const serverGroups = new Map<string, RequestMetrics[]>();
    
    // Group requests by server
    for (const request of requests) {
      const serverRequests = serverGroups.get(request.serverId) || [];
      serverRequests.push(request);
      serverGroups.set(request.serverId, serverRequests);
    }

    // Calculate stats for each server
    for (const [serverId, serverRequests] of serverGroups.entries()) {
      const baseStats = this.calculateStats(serverRequests, this.statsWindowMs);
      
      // Determine server status
      const serverStatus = this.determineServerStatus(baseStats);
      
      const serverStats: ServerPerformanceStats = {
        ...baseStats,
        serverId,
        serverStatus
      };
      
      this.serverStats.set(serverId, serverStats);
    }
  }

  /**
   * Determine server health status based on performance metrics
   */
  private determineServerStatus(stats: PerformanceStats): 'healthy' | 'degraded' | 'error' {
    if (stats.errorRate > 0.1) { // > 10% error rate
      return 'error';
    }
    
    if (stats.averageResponseTime > 5000 || stats.errorRate > 0.05) { // > 5s response time or > 5% error rate
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Create empty stats object
   */
  private createEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      percentile95ResponseTime: 0,
      percentile99ResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 0,
      cacheHitRate: 0,
      timeWindow: this.statsWindowMs
    };
  }

  /**
   * Get optimization recommendation based on performance stats
   */
  private getOptimizationRecommendation(stats: PerformanceStats): string {
    if (stats.averageResponseTime > 5000) {
      return 'Consider implementing additional caching or optimizing BigQuery queries for Vietnamese market conditions.';
    }
    
    if (stats.errorRate > 0.05) {
      return 'High error rate detected. Review connection stability and implement retry mechanisms.';
    }
    
    if (stats.cacheHitRate < 0.3) {
      return 'Low cache hit rate. Consider increasing cache TTL or expanding cacheable operations.';
    }
    
    if (stats.requestsPerSecond > 100) {
      return 'High throughput detected. Consider implementing request throttling to maintain Vietnamese market SLA.';
    }
    
    return 'Performance is optimized for Vietnamese market conditions.';
  }
}

// Export singleton instance
export const performanceMetricsService = new PerformanceMetricsService();