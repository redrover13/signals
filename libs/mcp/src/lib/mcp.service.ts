/**
 * MCP Service - Main Facade
 * Provides a simplified interface for all MCP operations
 */

import { MCPClientService, MCPRequest, MCPResponse } from './clients/mcp-client.service';
import { ServerHealthService, HealthCheckResult, ServerHealthStats } from './clients/server-health.service';
import { RequestRouter } from './clients/request-router.service';
import { getCurrentConfig, getCurrentEnvironment } from './config/environment-config';

/**
 * Main MCP Service - Simplified interface for all MCP operations
 */
export class MCPService {
  private static instance: MCPService;
  private clientService: MCPClientService;
  private healthService: ServerHealthService;
  private requestRouter: RequestRouter;
  private isInitialized = false;

  private constructor() {
    this.clientService = new MCPClientService();
    this.healthService = new ServerHealthService(this.clientService);
    this.requestRouter = new RequestRouter(this.clientService);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  /**
   * Initialize MCP service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log(`Initializing MCP Service for environment: ${getCurrentEnvironment()}`);
    
    try {
      await this.clientService.initialize();
      this.isInitialized = true;
      console.log('MCP Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Service:', error);
      throw error;
    }
  }

  /**
   * Send request to MCP servers
   */
  async request(method: string, params?: Record<string, unknown>, options?: {
    serverId?: string;
    timeout?: number;
    retries?: number;
  }): Promise<MCPResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const request: MCPRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      method,
      params,
      serverId: options?.serverId,
      timeout: options?.timeout,
      retries: options?.retries
    };

    return await this.clientService.sendRequest(request);
  }

  // ===== CORE SERVER METHODS =====

  /**
   * Git operations
   */
  async git(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`git.${operation}`, params, { serverId: 'git' });
  }

  /**
   * File system operations
   */
  async fs(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`fs.${operation}`, params, { serverId: 'filesystem' });
  }

  /**
   * Memory operations
   */
  async memory(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`memory.${operation}`, params, { serverId: 'memory' });
  }

  /**
   * Sequential thinking
   */
  async think(prompt: string, options?: { maxThoughts?: number }): Promise<MCPResponse> {
    return this.request('think.analyze', { prompt, ...options }, { serverId: 'sequentialthinking' });
  }

  /**
   * Time operations
   */
  async time(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`time.${operation}`, params, { serverId: 'time' });
  }

  // ===== DEVELOPMENT SERVER METHODS =====

  /**
   * GitHub operations
   */
  async github(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`github.${operation}`, params, { serverId: 'github' });
  }

  /**
   * Nx workspace operations
   */
  async nx(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`nx.${operation}`, params, { serverId: 'nx' });
  }

  /**
   * Node.js operations
   */
  async node(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`node.${operation}`, params, { serverId: 'node' });
  }

  /**
   * API validation
   */
  async validateAPI(spec: Record<string, unknown>): Promise<MCPResponse> {
    return this.request('api.validate', { spec }, { serverId: 'apimatic' });
  }

  // ===== DATA SERVER METHODS =====

  /**
   * Database operations
   */
  async database(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`db.${operation}`, params, { serverId: 'databases' });
  }

  /**
   * BigQuery operations
   */
  async bigquery(query: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request('bigquery.query', { query, ...params }, { serverId: 'databases' });
  }

  /**
   * Vector/embedding operations
   */
  async vector(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`vector.${operation}`, params, { serverId: 'chroma' });
  }

  // ===== WEB SERVER METHODS =====

  /**
   * Web search operations
   */
  async search(query: string, options?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request('search.query', { query, ...options }, { serverId: 'exa' });
  }

  /**
   * Web fetch operations
   */
  async fetch(url: string, options?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request('fetch.get', { url, ...options }, { serverId: 'fetch' });
  }

  // ===== PLATFORM SERVER METHODS =====

  /**
   * Google Cloud Platform operations
   */
  async gcp(service: string, operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`gcp.${service}.${operation}`, params, { serverId: 'google' });
  }

  /**
   * Google Cloud Run operations
   */
  async cloudRun(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`cloudrun.${operation}`, params, { serverId: 'google-cloud-run' });
  }

  /**
   * Firebase operations
   */
  async firebase(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`firebase.${operation}`, params, { serverId: 'firebase' });
  }

  /**
   * Notion operations
   */
  async notion(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`notion.${operation}`, params, { serverId: 'notion' });
  }

  // ===== SPECIALIZED SERVER METHODS =====

  /**
   * Google Maps operations
   */
  async maps(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`maps.${operation}`, params, { serverId: 'google-maps' });
  }

  /**
   * Algolia search operations
   */
  async algolia(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`algolia.${operation}`, params, { serverId: 'algolia' });
  }

  /**
   * Website technology analysis
   */
  async analyzeWebsite(url: string): Promise<MCPResponse> {
    return this.request('builtwith.analyze', { url }, { serverId: 'builtwith' });
  }

  // ===== TESTING SERVER METHODS =====

  /**
   * Browser automation
   */
  async browser(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`browser.${operation}`, params, { serverId: 'browserbase' });
  }

  /**
   * Cross-browser testing
   */
  async browserTest(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`browsertest.${operation}`, params, { serverId: 'browserstack' });
  }

  // ===== AUTOMATION SERVER METHODS =====

  /**
   * Workflow automation
   */
  async automate(operation: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    return this.request(`make.${operation}`, params, { serverId: 'make' });
  }

  // ===== HEALTH AND MONITORING METHODS =====

  /**
   * Get server health status
   */
  getServerHealth(serverId?: string): ServerHealthStats | Map<string, ServerHealthStats> | undefined {
    if (serverId) {
      return this.healthService.getServerHealthStats(serverId);
    }
    return this.healthService.getAllHealthStats();
  }

  /**
   * Get system health overview
   */
  getSystemHealth() {
    return this.healthService.getSystemHealth();
  }

  /**
   * Force health check
   */
  async checkHealth(serverId?: string): Promise<HealthCheckResult | HealthCheckResult[] | null> {
    if (serverId) {
      return this.healthService.forceHealthCheck(serverId);
    }
    return this.healthService.forceHealthCheckAll();
  }

  /**
   * Get server connection status
   */
  getServerStatus(serverId?: string) {
    if (serverId) {
      return this.clientService.getServerStatus(serverId);
    }
    return this.clientService.getAllServerStatuses();
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
      .filter(server => server.enabled)
      .sort((a, b) => b.priority - a.priority)
      .map(server => server.id);
  }

  /**
   * Test routing for a method
   */
  testRouting(method: string) {
    return this.requestRouter.testRouting(method);
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    return {
      rules: this.requestRouter.getRoutingRules(),
      loadStats: this.requestRouter.getLoadStatistics()
    };
  }

  // ===== LIFECYCLE METHODS =====

  /**
   * Shutdown MCP service
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down MCP Service...');
    
    try {
      await this.clientService.disconnect();
      this.isInitialized = false;
      console.log('MCP Service shut down successfully');
    } catch (error) {
      console.error('Error during MCP Service shutdown:', error);
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
}

// Export singleton instance
export const mcpService = MCPService.getInstance();