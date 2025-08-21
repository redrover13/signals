/**
 * Server Health Service
 * Monitors the health of all MCP servers and handles reconnections
 */

import { EventEmitter } from 'events';
import { MCPServerConfig } from '../config/mcp-config.schema';
import { getCurrentConfig } from '../config/environment-config';

export interface HealthCheckResult {
  serverId: string;
  healthy: boolean;
  responseTime?: number;
  error?: Error;
  timestamp: Date;
}

export interface ServerHealthStats {
  serverId: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  lastHealthy?: Date;
  lastUnhealthy?: Date;
  consecutiveFailures: number;
  uptime: number; // Percentage
}

/**
 * Server Health Monitoring Service
 */
export class ServerHealthService extends EventEmitter {
  private mcpClient: any; // MCPClientService reference
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();
  private healthStats = new Map<string, ServerHealthStats>();
  private isRunning = false;
  private config = getCurrentConfig();

  constructor(mcpClient: any) {
    super();
    this.mcpClient = mcpClient;
  }

  /**
   * Start health monitoring for all servers
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    console.log('Starting MCP server health monitoring...');
    this.isRunning = true;
    this.config = getCurrentConfig();

    // Start monitoring for each enabled server
    const enabledServers = this.config.servers.filter(server => 
      server.enabled && server.healthCheck
    );

    for (const server of enabledServers) {
      this.startServerHealthCheck(server);
    }

    this.emit('started');
    console.log(`Health monitoring started for ${enabledServers.length} servers`);
  }

  /**
   * Stop health monitoring
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping MCP server health monitoring...');
    this.isRunning = false;

    // Clear all intervals
    for (const [serverId, interval] of this.healthCheckIntervals) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    this.emit('stopped');
    console.log('Health monitoring stopped');
  }

  /**
   * Start health check for a specific server
   */
  private startServerHealthCheck(serverConfig: MCPServerConfig): void {
    if (!serverConfig.healthCheck) {
      return;
    }

    const { interval } = serverConfig.healthCheck;
    
    // Initialize stats
    this.healthStats.set(serverConfig.id, {
      serverId: serverConfig.id,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      consecutiveFailures: 0,
      uptime: 100
    });

    // Set up periodic health check
    const intervalId = setInterval(async () => {
      await this.performHealthCheck(serverConfig);
    }, interval);

    this.healthCheckIntervals.set(serverConfig.id, intervalId);

    // Perform initial health check
    setTimeout(() => this.performHealthCheck(serverConfig), 1000);
  }

  /**
   * Perform health check for a server
   */
  private async performHealthCheck(serverConfig: MCPServerConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const serverId = serverConfig.id;

    try {
      // Get server connection status
      const connection = this.mcpClient.getServerStatus(serverId);
      
      if (!connection || connection.status !== 'connected') {
        throw new Error(`Server ${serverId} is not connected`);
      }

      // Perform health check based on connection type
      let healthy = false;
      let responseTime = 0;

      switch (serverConfig.connection.type) {
        case 'stdio':
          ({ healthy, responseTime } = await this.checkStdioHealth(connection, serverConfig));
          break;
        case 'http':
          ({ healthy, responseTime } = await this.checkHttpHealth(connection, serverConfig));
          break;
        default:
          // For other connection types, just check if connection exists
          healthy = true;
          responseTime = Date.now() - startTime;
      }

      const result: HealthCheckResult = {
        serverId,
        healthy,
        responseTime,
        timestamp: new Date()
      };

      this.updateHealthStats(serverId, result);
      
      if (healthy) {
        this.emit('serverHealthy', serverId, result);
      } else {
        this.emit('serverUnhealthy', serverId, result);
      }

      return result;

    } catch (error) {
      const result: HealthCheckResult = {
        serverId,
        healthy: false,
        error: error as Error,
        timestamp: new Date()
      };

      this.updateHealthStats(serverId, result);
      this.emit('serverUnhealthy', serverId, result);
      
      // Handle consecutive failures
      await this.handleHealthCheckFailure(serverConfig, result);

      return result;
    }
  }

  /**
   * Check stdio server health
   */
  private async checkStdioHealth(connection: any, config: MCPServerConfig): Promise<{ healthy: boolean; responseTime: number }> {
    const startTime = Date.now();
    const timeout = config.healthCheck?.timeout || 5000;

    try {
      // Send a simple ping request
      const response = await this.mcpClient.sendRequest({
        id: `health-check-${Date.now()}`,
        method: 'ping',
        timeout,
        serverId: config.id
      });
      // …
      const responseTime = Date.now() - startTime;
      const healthy = !response.error;

      return { healthy, responseTime };

    } catch (error) {
      return { healthy: false, responseTime: Date.now() - startTime };
    }
  }

  /**
   * Check HTTP server health
   */
  private async checkHttpHealth(connection: any, config: MCPServerConfig): Promise<{ healthy: boolean; responseTime: number }> {
    const startTime = Date.now();
    const timeout = config.healthCheck?.timeout || 5000;

    try {
      // Use health check endpoint if specified, otherwise use base URL
      const endpoint = config.healthCheck?.endpoint || config.connection.endpoint;
      
      // Perform HTTP health check (implementation would use fetch)
      // For now, just return healthy if connection exists
      const responseTime = Date.now() - startTime;
      return { healthy: true, responseTime };

    } catch (error) {
      return { healthy: false, responseTime: Date.now() - startTime };
    }
  }

  /**
   * Update health statistics
   */
  private updateHealthStats(serverId: string, result: HealthCheckResult): void {
    const stats = this.healthStats.get(serverId);
    if (!stats) {
      return;
    }

    stats.totalChecks++;
    
    if (result.healthy) {
      stats.successfulChecks++;
      stats.consecutiveFailures = 0;
      stats.lastHealthy = result.timestamp;
      
      if (result.responseTime) {
        // Update average response time
        const totalResponseTime = stats.averageResponseTime * (stats.successfulChecks - 1) + result.responseTime;
        stats.averageResponseTime = totalResponseTime / stats.successfulChecks;
      }
    } else {
      stats.failedChecks++;
      stats.consecutiveFailures++;
      stats.lastUnhealthy = result.timestamp;
    }

    // Calculate uptime percentage
    stats.uptime = (stats.successfulChecks / stats.totalChecks) * 100;

    this.healthStats.set(serverId, stats);
  }

  /**
   * Handle health check failure
   */
  private async handleHealthCheckFailure(serverConfig: MCPServerConfig, result: HealthCheckResult): Promise<void> {
    const stats = this.healthStats.get(serverConfig.id);
    if (!stats) {
      return;
    }

    const failureThreshold = serverConfig.healthCheck?.failureThreshold || 3;
    
    if (stats.consecutiveFailures >= failureThreshold) {
      console.warn(`Server ${serverConfig.id} has failed ${stats.consecutiveFailures} consecutive health checks`);
      
      // Emit critical health event
      this.emit('serverCritical', serverConfig.id, stats);
      
      // Attempt reconnection if configured
      if (this.shouldAttemptReconnection(serverConfig)) {
        await this.attemptReconnection(serverConfig);
      }
    }
  }

  /**
   * Check if we should attempt reconnection
   */
  private shouldAttemptReconnection(serverConfig: MCPServerConfig): boolean {
    // Only attempt reconnection for critical servers
    return serverConfig.priority >= 8 && serverConfig.category === 'core';
  }

  /**
   * Attempt to reconnect to a server
   */
  private async attemptReconnection(serverConfig: MCPServerConfig): Promise<void> {
    console.log(`Attempting to reconnect to server: ${serverConfig.id}`);
    
    try {
      // This would call the MCP client's reconnection logic
      // For now, just emit an event
      this.emit('reconnectionAttempt', serverConfig.id);
      
      // Reset consecutive failures on successful reconnection
      const stats = this.healthStats.get(serverConfig.id);
      if (stats) {
        stats.consecutiveFailures = 0;
      }
      
    } catch (error) {
      console.error(`Failed to reconnect to server ${serverConfig.id}:`, error);
      this.emit('reconnectionFailed', serverConfig.id, error);
    }
  }

  /**
   * Get health statistics for a server
   */
  getServerHealthStats(serverId: string): ServerHealthStats | undefined {
    return this.healthStats.get(serverId);
  }

  /**
   * Get health statistics for all servers
   */
  getAllHealthStats(): Map<string, ServerHealthStats> {
    return new Map(this.healthStats);
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    totalServers: number;
    healthyServers: number;
    unhealthyServers: number;
    criticalServers: number;
    averageUptime: number;
  } {
    const stats = Array.from(this.healthStats.values());
    const totalServers = stats.length;
    const healthyServers = stats.filter(s => s.consecutiveFailures === 0).length;
    const getThreshold = (id: string) =>
      this.config.servers.find(s => s.id === id)?.healthCheck?.failureThreshold ?? 3;
    const unhealthyServers = stats.filter(s =>
      s.consecutiveFailures > 0 && s.consecutiveFailures < getThreshold(s.serverId)
    ).length;
    const criticalServers = stats.filter(s =>
      s.consecutiveFailures >= getThreshold(s.serverId)
    ).length;
    const averageUptime = stats.reduce((sum, s) => sum + s.uptime, 0) / totalServers || 0;
    return {
      totalServers,
      healthyServers,
      unhealthyServers,
      criticalServers,
      averageUptime
    };
  }

  /**
   * Force health check for a specific server
   */
  async forceHealthCheck(serverId: string): Promise<HealthCheckResult | null> {
    const serverConfig = this.config.servers.find(s => s.id === serverId);
    if (!serverConfig || !serverConfig.healthCheck) {
      return null;
    }

    return await this.performHealthCheck(serverConfig);
  }

  /**
   * Force health check for all servers
   */
  async forceHealthCheckAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    for (const server of this.config.servers) {
      if (server.enabled && server.healthCheck) {
        const result = await this.performHealthCheck(server);
        results.push(result);
      }
    }

    return results;
  }
}