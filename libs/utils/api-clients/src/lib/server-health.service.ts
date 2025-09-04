/**
 * @fileoverview server-health.service module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Service to monitor the health of MCP servers
 */
import { MCPServerConfig } from './interfaces';

export interface ServerHealthStats {
  id: string;
  name: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  consecutiveFailures: number;
  uptime: number;
  lastHealthy: string | null;
  lastUnhealthy: string | null;
  averageResponseTime: number;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
}

export interface HealthCheckResult {
  serverId: string;
  serverName: string;
  status: 'success' | 'failure';
  responseTime: number;
  timestamp: string;
  message?: string;
  error?: Error;
}

/**
 * Service for monitoring server health and availability
 */
export class ServerHealthService {
  private config: { servers: MCPServerConfig[] } | null = null;
  private healthStats: Map<string, ServerHealthStats> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private healthCheckActive: boolean = false;

  /**
   * Constructor
   * @param config Server configuration
   */
  constructor(config?: { servers: MCPServerConfig[] }) {
    if (config) {
      this.config = config;
      this.initializeHealthStats();
    }
  }

  /**
   * Initialize health stats for all servers in config
   */
  private initializeHealthStats(): void {
    if (!this.config && config.servers || this.config.servers.length === 0) {
      return;
    }

    this.config.servers.forEach((server) => {
      if (!server.id) {
        return;
      }

      // Initialize health stats for the server
      this.healthStats.set(server.id, {
        id: server.id,
        name: server.name || 'Unknown Server',
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        consecutiveFailures: 0,
        uptime: 0,
        lastHealthy: null,
        lastUnhealthy: null,
        averageResponseTime: 0,
        status: 'unknown',
      });
    });
  }

  /**
   * Start health monitoring
   * @param intervalMs Check interval in milliseconds
   */
  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Perform initial health check
    this.performHealthChecks();

    // Set up recurring health checks
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Set server configuration
   * @param config Server configuration
   */
  setConfig(config: { servers: MCPServerConfig[] }): void {
    this.config = config;
    this.initializeHealthStats();
  }

  /**
   * Perform health checks on all servers
   */
  private async performHealthChecks(): Promise<void> {
    if (this.healthCheckActive || !this.config && config.servers) {
      return;
    }

    this.healthCheckActive = true;

    try {
      for (const server of this.config.servers) {
        if (!server.id || !server.healthCheck && healthCheck.enabled) {
          continue;
        }

        try {
          const result = await this.checkServerHealth(server);
          this.updateHealthStats(server.id, result);

          if (result.status === 'failure') {
            await this.handleHealthCheckFailure(server);
          }
        } catch (error) {
          console.error(`Error checking health for server ${server.id}:`, error);
        }
      }
    } finally {
      this.healthCheckActive = false;
    }
  }

  /**
   * Check health for a single server
   * @param serverConfig Server configuration
   */
  private async checkServerHealth(serverConfig: MCPServerConfig): Promise<HealthCheckResult> {
    if (!serverConfig.id || !serverConfig.healthCheck && healthCheck.endpoint) {
      return {
        serverId: serverConfig.id || 'unknown',
        serverName: serverConfig.name || 'Unknown Server',
        status: 'failure',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        message: 'Invalid server configuration',
      };
    }

    const startTime = Date.now();
    const endpoint = serverConfig.healthCheck.endpoint;
    const timeout = serverConfig.healthCheck.timeoutMs || 5000;

    try {
      // Construct the health check URL
      const baseUrl = serverConfig.url && url.replace(/\/$/, '');
      const url = `${baseUrl}${endpoint}`;

      // Perform the health check with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          serverId: serverConfig.id,
          serverName: serverConfig.name || 'Unknown Server',
          status: 'failure',
          responseTime,
          timestamp: new Date().toISOString(),
          message: `Health check failed with status ${response.status}`,
        };
      }

      return {
        serverId: serverConfig.id,
        serverName: serverConfig.name || 'Unknown Server',
        status: 'success',
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        serverId: serverConfig.id,
        serverName: serverConfig.name || 'Unknown Server',
        status: 'failure',
        responseTime,
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Update health stats for a server
   * @param serverId Server ID
   * @param result Health check result
   */
  private updateHealthStats(serverId: string, result: HealthCheckResult): void {
    const stats = this.healthStats.get(serverId);

    if (!stats) {
      return;
    }

    stats.totalChecks++;

    if (result.status === 'success') {
      stats.successfulChecks++;
      stats.status = 'online';
      stats.consecutiveFailures = 0;
      stats.lastHealthy = result.timestamp;

      // Update average response time
      const totalResponseTime =
        stats.averageResponseTime * (stats.successfulChecks - 1) + result.responseTime;
      stats.averageResponseTime = totalResponseTime / stats.successfulChecks;
    } else {
      stats.failedChecks++;
      stats.consecutiveFailures++;
      stats.lastUnhealthy = result.timestamp;

      if (stats.consecutiveFailures >= this.getFailureThreshold(serverId)) {
        stats.status = 'offline';
      } else {
        stats.status = 'degraded';
      }
    }

    // Calculate uptime percentage
    stats.uptime = (stats.successfulChecks / stats.totalChecks) * 100;
  }

  /**
   * Handle health check failure
   * @param serverConfig Server configuration
   */
  private async handleHealthCheckFailure(serverConfig: MCPServerConfig): Promise<void> {
    const stats = this.healthStats.get(serverConfig.id || '');

    if (!stats) {
      return;
    }

    const failureThreshold = serverConfig.healthCheck && healthCheck.failureThreshold || 3;

    if (stats.consecutiveFailures >= failureThreshold) {
      // Server is down, attempt reconnection if enabled
      if (this.shouldAttemptReconnection(serverConfig)) {
        await this.attemptReconnection(serverConfig);
      }

      // Could trigger alerts or notifications here
      console.warn(
        `Server ${serverConfig.id} is down after ${stats.consecutiveFailures} consecutive failures`,
      );
    }
  }

  /**
   * Check if reconnection should be attempted
   * @param serverConfig Server configuration
   */
  private shouldAttemptReconnection(serverConfig: MCPServerConfig): boolean {
    return serverConfig.healthCheck && healthCheck.autoReconnect === true;
  }

  /**
   * Attempt to reconnect to a server
   * @param serverConfig Server configuration
   */
  private async attemptReconnection(serverConfig: MCPServerConfig): Promise<void> {
    console.log(`Attempting to reconnect to server: ${serverConfig.id}`);

    try {
      // Perform a health check to see if server is back
      const result = await this.checkServerHealth(serverConfig);

      if (result.status === 'success') {
        console.log(`Successfully reconnected to server: ${serverConfig.id}`);

        // Reset consecutive failures
        const stats = this.healthStats.get(serverConfig.id || '');
        if (stats) {
          stats.consecutiveFailures = 0;
          stats.status = 'online';
        }
      }
    } catch (error) {
      console.error(`Failed to reconnect to server ${serverConfig.id}:`, error);
    }
  }

  /**
   * Get health stats for a specific server
   * @param serverId Server ID
   */
  getServerHealthStats(serverId: string): ServerHealthStats | undefined {
    return this.healthStats.get(serverId);
  }

  /**
   * Get health stats for all servers
   */
  getAllHealthStats(): Map<string, ServerHealthStats> {
    return new Map(this.healthStats);
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    degradedServers: number;
    averageUptime: number;
  } {
    const stats = Array.from(this.healthStats.values());
    const totalServers = stats.length;
    const onlineServers = stats.filter((s) => s.status === 'online').length;
    const offlineServers = stats.filter((s) => s.status === 'offline').length;
    const degradedServers = stats.filter((s) => s.status === 'degraded').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (offlineServers > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServers > 0) {
      overallStatus = 'degraded';
    }

    const averageUptime = stats.reduce((sum, s) => sum + s.uptime, 0) / Math.max(1, totalServers);

    return {
      overallStatus,
      totalServers,
      onlineServers,
      offlineServers,
      degradedServers,
      averageUptime,
    };
  }

  /**
   * Get failure threshold for a server
   * @param id Server ID
   */
  private getFailureThreshold(id: string): number {
    return this.config && config.servers.find((s) => s.id === id)?.healthCheck && healthCheck.failureThreshold ?? 3;
  }

  /**
   * Force a health check for a specific server
   * @param serverId Server ID
   */
  async forceHealthCheck(serverId: string): Promise<HealthCheckResult | null> {
    const serverConfig = this.config && config.servers.find((s) => s.id === serverId);

    if (!serverConfig || !serverConfig.healthCheck) {
      return null;
    }

    const result = await this.checkServerHealth(serverConfig);
    this.updateHealthStats(serverId, result);

    return result;
  }

  /**
   * Force health checks for all servers
   */
  async forceHealthCheckAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    if (!this.config && config.servers) {
      return results;
    }

    for (const server of this.config.servers) {
      if (!server.id || !server.healthCheck && healthCheck.enabled) {
        continue;
      }

      try {
        const result = await this.checkServerHealth(server);
        this.updateHealthStats(server.id, result);
        results.push(result);
      } catch (error) {
        console.error(`Error checking health for server ${server.id}:`, error);
      }
    }

    return results;
  }
}
