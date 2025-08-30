/**
 * @fileoverview connection-pool.service module for the services component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Connection Pool Service for MCP Servers
 * Manages connection pooling, reuse, and lifecycle for optimal resource utilization
 */

import { EventEmitter } from 'events';
import { MCPServerConfig } from '../config/mcp-config.schema';

export interface PooledConnection {
  id: string;
  serverId: string;
  status: 'idle' | 'active' | 'error' | 'disposed';
  createdAt: number;
  lastUsed: number;
  useCount: number;
  connection: unknown; // The actual connection object
  error?: Error;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  errorConnections: number;
  waitingRequests: number;
  poolUtilization: number;
}

export interface PoolOptions {
  maxConnections?: number;
  minConnections?: number;
  maxIdleTime?: number;
  maxConnectionAge?: number;
  connectionTimeout?: number;
  acquireTimeout?: number;
  maxWaitingRequests?: number;
}

/**
 * Connection Pool for MCP Servers
 */
export class ConnectionPoolService extends EventEmitter {
  private pools = new Map<string, PooledConnection[]>();
  private waitingQueues = new Map<string, Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>>();

  private readonly defaultOptions: Required<PoolOptions> = {
    maxConnections: 10,
    minConnections: 2,
    maxIdleTime: 300000, // 5 minutes
    maxConnectionAge: 1800000, // 30 minutes
    connectionTimeout: 30000, // 30 seconds
    acquireTimeout: 10000, // 10 seconds
    maxWaitingRequests: 50
  };

  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats = new Map<string, {
    created: number;
    acquired: number;
    released: number;
    disposed: number;
    errors: number;
  }>();

  constructor(private options: PoolOptions = {}) {
    super();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // 1 minute
  }

  /**
   * Acquire a connection from the pool
   */
  async acquireConnection(serverId: string, serverConfig: MCPServerConfig): Promise<PooledConnection> {
    const options = { ...this.defaultOptions, ...this.options };
    
    // Get or create pool for server
    let pool = this.pools.get(serverId);
    if (!pool) {
      pool = [];
      this.pools.set(serverId, pool);
      this.stats.set(serverId, {
        created: 0,
        acquired: 0,
        released: 0,
        disposed: 0,
        errors: 0
      });
    }

    // Try to find an idle connection
    const idleConnection = pool.find(conn => 
      conn.status === 'idle' && 
      !this.isConnectionExpired(conn, options)
    );

    if (idleConnection) {
      idleConnection.status = 'active';
      idleConnection.lastUsed = Date.now();
      idleConnection.useCount++;
      
      this.getStats(serverId).acquired++;
      return idleConnection;
    }

    // If pool has space, create new connection
    const activeConnections = pool.filter(conn => conn.status === 'active' || conn.status === 'idle').length;
    if (activeConnections < options.maxConnections) {
      try {
        const newConnection = await this.createConnection(serverId, serverConfig, options);
        pool.push(newConnection);
        
        this.getStats(serverId).created++;
        this.getStats(serverId).acquired++;
        return newConnection;
      } catch (error) {
        this.getStats(serverId).errors++;
        throw error;
      }
    }

    // Pool is full, wait for available connection
    return this.waitForConnection(serverId, options);
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connection: PooledConnection): void {
    if (connection.status !== 'active') {
      return; // Connection not active, ignore
    }

    connection.status = 'idle';
    connection.lastUsed = Date.now();
    
    this.getStats(connection.serverId).released++;

    // Check if there are waiting requests
    const waitingQueue = this.waitingQueues.get(connection.serverId);
    if (waitingQueue && waitingQueue.length > 0) {
      const waiter = waitingQueue.shift();
      if (waiter) {
        clearTimeout(waiter.timeout);
        connection.status = 'active';
        connection.useCount++;
        this.getStats(connection.serverId).acquired++;
        waiter.resolve(connection);
      }
    }

    this.emit('connectionReleased', connection);
  }

  /**
   * Dispose of a connection (mark as unusable)
   */
  disposeConnection(connection: PooledConnection, error?: Error): void {
    connection.status = 'error';
    connection.error = error;
    
    this.getStats(connection.serverId).disposed++;

    // Remove from pool
    const pool = this.pools.get(connection.serverId);
    if (pool) {
      const index = pool.indexOf(connection);
      if (index !== -1) {
        pool.splice(index, 1);
      }
    }

    this.emit('connectionDisposed', connection, error);
  }

  /**
   * Get pool statistics for a server
   */
  getPoolStats(serverId: string): ConnectionPoolStats {
    const pool = this.pools.get(serverId) || [];
    const waitingQueue = this.waitingQueues.get(serverId) || [];
    
    const totalConnections = pool.length;
    const activeConnections = pool.filter(conn => conn.status === 'active').length;
    const idleConnections = pool.filter(conn => conn.status === 'idle').length;
    const errorConnections = pool.filter(conn => conn.status === 'error').length;
    const waitingRequests = waitingQueue.length;
    
    const options = { ...this.defaultOptions, ...this.options };
    const poolUtilization = totalConnections > 0 ? activeConnections / options.maxConnections : 0;

    return {
      totalConnections,
      activeConnections,
      idleConnections,
      errorConnections,
      waitingRequests,
      poolUtilization: Math.round(poolUtilization * 100) / 100
    };
  }

  /**
   * Get all pool statistics
   */
  getAllPoolStats(): Map<string, ConnectionPoolStats> {
    const allStats = new Map<string, ConnectionPoolStats>();
    
    for (const serverId of this.pools.keys()) {
      allStats.set(serverId, this.getPoolStats(serverId));
    }
    
    return allStats;
  }

  /**
   * Drain and close all connections in a pool
   */
  async drainPool(serverId: string): Promise<void> {
    const pool = this.pools.get(serverId);
    if (!pool) return;

    // Wait for active connections to become idle
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const activeConnections = pool.filter(conn => conn.status === 'active');
      if (activeConnections.length === 0) break;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Force close remaining connections
    for (const connection of pool) {
      this.disposeConnection(connection);
    }

    this.pools.delete(serverId);
    this.stats.delete(serverId);
    
    // Reject waiting requests
    const waitingQueue = this.waitingQueues.get(serverId);
    if (waitingQueue) {
      for (const waiter of waitingQueue) {
        clearTimeout(waiter.timeout);
        waiter.reject(new Error(`Pool for server ${serverId} was drained`));
      }
      this.waitingQueues.delete(serverId);
    }
  }

  /**
   * Shutdown all pools
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Drain all pools
    const drainPromises = Array.from(this.pools.keys()).map(serverId => 
      this.drainPool(serverId)
    );
    
    await Promise.all(drainPromises);
  }

  /**
   * Create a new connection
   */
  private async createConnection(
    serverId: string, 
    serverConfig: MCPServerConfig,
    options: Required<PoolOptions>
  ): Promise<PooledConnection> {
    const connectionId = `${serverId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Create connection based on server config
    let connection: unknown;
    
    try {
      // This would be implemented based on the actual connection type
      connection = await this.createActualConnection(serverConfig, options.connectionTimeout);
      
      const pooledConnection: PooledConnection = {
        id: connectionId,
        serverId,
        status: 'active',
        createdAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 1,
        connection
      };
      
      return pooledConnection;
    } catch (error) {
      throw new Error(`Failed to create connection for ${serverId}: ${error}`);
    }
  }

  /**
   * Create actual connection (placeholder - would be implemented with real connection logic)
   */
  private async createActualConnection(serverConfig: MCPServerConfig, timeout: number): Promise<unknown> {
    // This is a placeholder - actual implementation would depend on connection type
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);
      
      // Simulate connection creation
      setTimeout(() => {
        clearTimeout(timer);
        resolve({ 
          type: serverConfig.connection?.type || serverConfig.type, 
          endpoint: serverConfig.connection?.endpoint || `${serverConfig.command} ${(serverConfig.args || []).join(' ')}` 
        });
      }, 100);
    });
  }

  /**
   * Wait for an available connection
   */
  private async waitForConnection(serverId: string, options: Required<PoolOptions>): Promise<PooledConnection> {
    let waitingQueue = this.waitingQueues.get(serverId);
    if (!waitingQueue) {
      waitingQueue = [];
      this.waitingQueues.set(serverId, waitingQueue);
    }

    if (waitingQueue.length >= options.maxWaitingRequests) {
      throw new Error(`Too many waiting requests for server ${serverId}`);
    }

    return new Promise<PooledConnection>((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const index = waitingQueue!.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          waitingQueue!.splice(index, 1);
        }
        reject(new Error(`Acquire timeout for server ${serverId}`));
      }, options.acquireTimeout);

      waitingQueue!.push({ resolve, reject, timeout });
    });
  }

  /**
   * Check if connection is expired
   */
  private isConnectionExpired(connection: PooledConnection, options: Required<PoolOptions>): boolean {
    const now = Date.now();
    const ageExpired = now - connection.createdAt > options.maxConnectionAge;
    const idleExpired = now - connection.lastUsed > options.maxIdleTime;
    
    return ageExpired || idleExpired;
  }

  /**
   * Get or create stats for server
   */
  private getStats(serverId: string) {
    let serverStats = this.stats.get(serverId);
    if (!serverStats) {
      serverStats = {
        created: 0,
        acquired: 0,
        released: 0,
        disposed: 0,
        errors: 0
      };
      this.stats.set(serverId, serverStats);
    }
    return serverStats;
  }

  /**
   * Cleanup expired connections
   */
  private cleanup(): void {
    const options = { ...this.defaultOptions, ...this.options };
    
    for (const [serverId, pool] of this.pools.entries()) {
      const toDispose: PooledConnection[] = [];
      
      // Find expired idle connections
      for (const connection of pool) {
        if (connection.status === 'idle' && this.isConnectionExpired(connection, options)) {
          toDispose.push(connection);
        }
      }
      
      // Dispose expired connections
      for (const connection of toDispose) {
        this.disposeConnection(connection);
      }
      
      // Ensure minimum connections
      const activeConnections = pool.filter(conn => 
        conn.status === 'active' || conn.status === 'idle'
      ).length;
      
      if (activeConnections < options.minConnections) {
        // Would need server config to create connections, this is handled elsewhere
        this.emit('poolBelowMinimum', serverId, activeConnections, options.minConnections);
      }
    }
  }
}

// Export singleton instance
export const connectionPoolService = new ConnectionPoolService();