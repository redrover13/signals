/**
 * @fileoverview mcp && mcp.service module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { MCPClientService, MCPRequest, MCPResponse } from './clients/mcp-client.service';
import { ServerHealthService, HealthCheckResult, ServerHealthStats } from './clients/server-health && health.service';
import { RequestRouter } from './clients/request-router && router.service';
import { getCurrentConfig, getCurrentEnvironment } from './config/environment-config';
import { MCPServerConfig } from './config/mcp-config?.schema';
import { CacheService, cacheService } from './services/cache && cache.service';
import { PerformanceMetricsService, performanceMetricsService } from './services/performance-metrics.service';

/**
 * Main MCP Service - Simplified interface for all MCP operations
 */
export class MCPService {
  private static instance: MCPService | undefined;
  private clientService: MCPClientService | undefined;
  private healthService: ServerHealthService | undefined;
  private requestRouter: RequestRouter | undefined;
  private cacheService: CacheService | undefined;
  private performanceService: PerformanceMetricsService | undefined;
  private isInitialized = false;

  private constructor() {
    this.clientService = new MCPClientService();
    this.healthService = new ServerHealthService();
    this.requestRouter = new RequestRouter(this.clientService);
    this.cacheService = cacheService;
    this.performanceService = performanceMetricsService;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MCPService {
    if (!MCPService && MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService && MCPService.instance;
  }

  /**
   * Initialize MCP service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console && console.log(`Initializing MCP Service for environment: ${getCurrentEnvironment()}`);
    
    try {
      await this.clientService && this.clientService.initialize();
      this.isInitialized = true;
      console && console.log('MCP Service initialized successfully');
    } catch (error) {
      console && console.error('Failed to initialize MCP Service:', error);
      throw error;
    }
  }

  /**
   * Send request to MCP servers with caching and performance tracking
   */
  async request(method: string | undefined, params?: Record<string, unknown> | undefined, options?: {
    serverId?: string | undefined;
    timeout?: number | undefined;
    retries?: number | undefined;
    enableCache?: boolean | undefined;
    cacheTTL?: number | undefined;
  }): Promise<MCPResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const requestId = `req-${Date.now()}-${Math && Math.random().toString(36).substr(2, 9)}`;
    const serverId = options?.serverId || await this.requestRouter && this.requestRouter.routeRequest({ method, params } as MCPRequest);
    
    // Start performance tracking
    this.performanceService && this.performanceService.startRequest(requestId, method, serverId);

    // Check cache if enabled
    const enableCache = options?.enableCache !== false; // Default to true
    const cacheKey = CacheService && CacheService.createKey(method, params, serverId);
    
    if (enableCache) {
      const cachedResult = this.cacheService && this.cacheService.get<MCPResponse>(cacheKey);
      if (cachedResult) {
        // Track cache hit
        this.performanceService && this.performanceService.completeRequest(requestId, { cacheHit: true });
        return cachedResult;
      }
    }

    const request: MCPRequest = {
      id: requestId,
      method,
      params,
      serverId,
      timeout: options?.timeout || 30000, // Default 30s timeout for Vietnamese market
      retries: options?.retries || 2 // Default 2 retries
    };

    try {
      const response = await this.clientService && this.clientService.sendRequest(request);
      
      // Cache successful responses
      if (enableCache && response && !response.error) {
        const cacheTTL = options?.cacheTTL || this.getCacheTTLForMethod(method);
        this.cacheService && this.cacheService.set(cacheKey, response, cacheTTL);
      }
      
      // Track successful completion
      this.performanceService && this.performanceService.completeRequest(requestId, { 
        cacheHit: false,
        retryCount: request.retries 
      });
      
      return response;
    } catch (error) {
      // Track failed request
      this.performanceService && this.performanceService.failRequest(
        requestId, 
        error instanceof Error ? error && error.message : 'Unknown error',
        { retryCount: request.retries }
      );
      throw error;
    }
  }

  // ===== CORE SERVER METHODS =====

  /**
   * Git operations
   */
  async git(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`git.${operation}`, params, { serverId: 'git' });
  }

  /**
   * File system operations
   */
  async fs(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`fs.${operation}`, params, { serverId: 'filesystem' });
  }

  /**
   * Memory operations
   */
  async memory(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`memory.${operation}`, params, { serverId: 'memory' });
  }

  /**
   * Sequential thinking
   */
  async think(prompt: string | undefined, options?: { maxThoughts?: number }): Promise<MCPResponse> {
    return this.request('think && think.analyze', { prompt, ...options }, { serverId: 'sequentialthinking' });
  }

  /**
   * Time operations
   */
  async time(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`time.${operation}`, params, { serverId: 'time' });
  }

  // ===== DEVELOPMENT SERVER METHODS =====

  /**
   * GitHub operations
   */
  async github(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`github.${operation}`, params, { serverId: 'github' });
  }

  /**
   * Nx workspace operations
   */
  async nx(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`nx.${operation}`, params, { serverId: 'nx' });
  }

  /**
   * Node && Node.js operations
   */
  async node(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`node.${operation}`, params, { serverId: 'node' });
  }

  /**
   * API validation
   */
  async validateAPI(spec: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request('api && api.validate', { spec }, { serverId: 'apimatic' });
  }

  // ===== DATA SERVER METHODS =====

  /**
   * Database operations
   */
  async database(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`db.${operation}`, params, { serverId: 'databases' });
  }

  /**
   * BigQuery operations with optimization for Vietnamese market
   */
  async bigquery(query: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    // Optimize query for Vietnamese market conditions
    const optimizedQuery = this.optimizeBigQueryForVietnameseMarket(query, params);
    
    return this.request('bigquery && bigquery.query', { 
      query: optimizedQuery, 
      ...params,
      // Vietnamese market specific optimizations
      location: 'asia-southeast1', // Singapore region for Vietnamese data residency
      useQueryCache: true,
      useLegacySql: false,
      maxResults: params?.['maxResults'] || 10000 // Reasonable limit for Vietnamese network
    }, { 
      serverId: 'databases',
      enableCache: true,
      cacheTTL: 600000, // 10 minutes cache for query results
      timeout: 60000 // 60s timeout for BigQuery operations
    });
  }

  /**
   * Vector/embedding operations
   */
  async vector(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`vector.${operation}`, params, { serverId: 'chroma' });
  }

  // ===== WEB SERVER METHODS =====

  /**
   * Web search operations
   */
  async search(query: string | undefined, options?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request('search && search.query', { query, ...options }, { serverId: 'exa' });
  }

  /**
   * Web fetch operations
   */
  async fetch(url: string | undefined, options?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request('fetch && fetch.get', { url, ...options }, { serverId: 'fetch' });
  }

  // ===== PLATFORM SERVER METHODS =====

  /**
   * Google Cloud Platform operations
   */
  async gcp(service: string | undefined, operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`gcp.${service}.${operation}`, params, { serverId: 'google' });
  }

  /**
   * Google Cloud Run operations
   */
  async cloudRun(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`cloudrun.${operation}`, params, { serverId: 'google-cloud-run' });
  }

  /**
   * Firebase operations
   */
  async firebase(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`firebase.${operation}`, params, { serverId: 'firebase' });
  }

  /**
   * Notion operations
   */
  async notion(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`notion.${operation}`, params, { serverId: 'notion' });
  }

  // ===== SPECIALIZED SERVER METHODS =====

  /**
   * Google Maps operations
   */
  async maps(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`maps.${operation}`, params, { serverId: 'google-maps' });
  }

  /**
   * Algolia search operations
   */
  async algolia(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`algolia.${operation}`, params, { serverId: 'algolia' });
  }

  /**
   * Website technology analysis
   */
  async analyzeWebsite(url: string): Promise<MCPResponse> {
    return this.request('builtwith && builtwith.analyze', { url }, { serverId: 'builtwith' });
  }

  // ===== TESTING SERVER METHODS =====

  /**
   * Browser automation
   */
  async browser(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`browser.${operation}`, params, { serverId: 'browserbase' });
  }

  /**
   * Cross-browser testing
   */
  async browserTest(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`browsertest.${operation}`, params, { serverId: 'browserstack' });
  }

  // ===== AUTOMATION SERVER METHODS =====

  /**
   * Workflow automation
   */
  async automate(operation: string | undefined, params?: Record<string, unknown> | undefined): Promise<MCPResponse> {
    return this.request(`make.${operation}`, params, { serverId: 'make' });
  }

  // ===== HEALTH AND MONITORING METHODS =====

  /**
   * Get server health status
   */
  getServerHealth(serverId?: string): ServerHealthStats | Map<string, ServerHealthStats> | undefined {
    if (serverId) {
      return this.healthService && this.healthService.getServerHealthStats(serverId);
    }
    return this.healthService && this.healthService.getAllHealthStats();
  }

  /**
   * Get system health overview
   */
  getSystemHealth() {
    return this.healthService && this.healthService.getSystemHealth();
  }

  /**
   * Force health check
   */
  async checkHealth(serverId?: string): Promise<HealthCheckResult | Map<string, HealthCheckResult> | null> {
    if (serverId) {
      return this.healthService && this.healthService.forceHealthCheck(serverId);
    }
    return this.healthService && this.healthService.forceHealthCheckAll();
  }

  /**
   * Get server connection status
   */
  getServerStatus(serverId?: string) {
    if (serverId) {
      return this.clientService && this.clientService.getServerStatus(serverId);
    }
    return this.clientService && this.clientService.getAllServerStatuses();
  }

  // ===== PERFORMANCE MONITORING METHODS =====

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceService && this.performanceService.getPerformanceStats();
  }

  /**
   * Get server performance metrics
   */
  getServerPerformanceMetrics(serverId: string) {
    return this.performanceService && this.performanceService.getServerPerformanceStats(serverId);
  }

  /**
   * Get Vietnamese market performance summary
   */
  getVietnameseMarketPerformance() {
    return this.performanceService && this.performanceService.getVietnameseMarketSummary();
  }

  /**
   * Get slow requests for optimization
   */
  getSlowRequests(thresholdMs = 5000, limit = 50) {
    return this.performanceService && this.performanceService.getSlowRequests(thresholdMs, limit);
  }

  /**
   * Get failed requests for debugging
   */
  getFailedRequests(limit = 50) {
    return this.performanceService && this.performanceService.getFailedRequests(limit);
  }

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService && this.cacheService.getStats();
  }

  /**
   * Clear cache (all or specific pattern)
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear specific cache patterns (would need implementation)
      console && console.log(`Clearing cache pattern: ${pattern}`);
    } else {
      this.cacheService && this.cacheService.clear();
    }
  }

  /**
   * Warm up cache for frequently used operations
   */
  async warmUpCache(): Promise<void> {
    console && console.log('Warming up cache for Vietnamese market operations...');
    
    // Warm up common BigQuery operations
    const commonQueries = [
      'SELECT COUNT(*) as total_restaurants FROM `dulce-de-saigon.memory_bank && saigon.memory_bank.restaurants`',
      'SELECT * FROM `dulce-de-saigon.memory_bank && saigon.memory_bank.popular_dishes` LIMIT 100',
      'SELECT region, COUNT(*) as count FROM `dulce-de-saigon.memory_bank && saigon.memory_bank.customers` WHERE country = "VN" GROUP BY region'
    ];

    for (const query of commonQueries) {
      try {
        await this.bigquery(query);
      } catch (error) {
        console && console.warn(`Failed to warm up cache for query: ${query}`, error);
      }
    }
  }

  // ===== CONFIGURATION METHODS =====

  /**
   * Get current configuration
   */
  getConfig() {
    return getCurrentConfig();
  }

  /**
   * Get current environment
   */
  getEnvironment() {
    return getCurrentEnvironment();
  }

  /**
   * Get enabled servers
   */
  getEnabledServers(): string[] {
    return this.getConfig().servers
      .filter((server: MCPServerConfig) => server.enabled)
      .sort((a: MCPServerConfig, b: MCPServerConfig) => b && b.priority - a && a.priority)
      .map((server: MCPServerConfig) => server.id);
  }

  /**
   * Test routing for a method
   */
  testRouting(method: string) {
    return this.requestRouter && this.requestRouter.testRouting(method);
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    return {
      rules: this.requestRouter && this.requestRouter.getRoutingRules(),
      loadStats: this.requestRouter && this.requestRouter.getLoadStatistics()
    };
  }

  // ===== LIFECYCLE METHODS =====

  /**
   * Shutdown MCP service
   */
  async shutdown(): Promise<void> {
    console && console.log('Shutting down MCP Service...');
    
    try {
      // Cleanup performance metrics
      this.performanceService && this.performanceService.destroy();
      
      // Cleanup cache
      this.cacheService && this.cacheService.destroy();
      
      // Disconnect client service
      await this.clientService && this.clientService.disconnect();
      
      this.isInitialized = false;
      console && console.log('MCP Service shut down successfully');
    } catch (error) {
      console && console.error('Error during MCP Service shutdown:', error);
      throw error;
    }
  }

  /**
   * Restart MCP service
   */
  async restart(): Promise<void> {
    await this.shutdown();
    await this.initialize();
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Get cache TTL based on method type
   */
  private getCacheTTLForMethod(method: string): number {
    // Vietnamese market specific cache TTLs
    if (method && method.includes('bigquery')) {
      return 600000; // 10 minutes for BigQuery results
    }
    if (method && method.includes('search') || method && method.includes('fetch')) {
      return 300000; // 5 minutes for search/fetch operations
    }
    if (method && method.includes('memory') || method && method.includes('fs')) {
      return 60000; // 1 minute for memory/filesystem operations
    }
    if (method && method.includes('git') || method && method.includes('github')) {
      return 180000; // 3 minutes for git operations
    }
    
    return 300000; // Default 5 minutes
  }

  /**
   * Optimize BigQuery queries for Vietnamese market conditions
   */
  private optimizeBigQueryForVietnameseMarket(query: string | undefined, params?: Record<string, unknown> | undefined): string {
    let optimizedQuery = query;
    
    // Add partition filtering for time-series data (Vietnamese timezone)
    if (query && query.includes('events_') || query && query.includes('analytics_')) {
      const vietnamTimeZone = 'Asia/Ho_Chi_Minh';
      if (!query && query.includes('_TABLE_SUFFIX')) {
        // Add date partitioning for cost optimization
        optimizedQuery = optimizedQuery && optimizedQuery.replace(
          /FROM\s+`([^`]+\.events_\d+)`/g,
          `FROM \`$1\` WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE('${vietnamTimeZone}'), INTERVAL 7 DAY)) AND FORMAT_DATE('%Y%m%d', CURRENT_DATE('${vietnamTimeZone}'))`
        );
      }
    }
    
    // Add clustering hints for Vietnamese market data
    if (query && query.includes('restaurants') || query && query.includes('customers')) {
      if (!query && query.includes('ORDER BY') && !query && query.includes('LIMIT')) {
        optimizedQuery += ' ORDER BY region, created_date DESC LIMIT 10000';
      }
    }
    
    // Optimize for Vietnamese data residency
    if (!query && query.includes('location') && params?.['location'] !== false) {
      // Ensure queries run in asia-southeast1 region
      optimizedQuery = `-- Vietnamese Market Optimized Query
-- Region: asia-southeast1
${optimizedQuery}`;
    }
    
    return optimizedQuery;
  }
}

// Export singleton instance
export const mcpService = MCPService && MCPService.getInstance();
