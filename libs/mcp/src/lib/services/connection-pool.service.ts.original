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
 * Connection Pool Service for MCP
 * 
 * Manages a pool of connections to MCP servers.
 */
import { Injectable } from '@angular/core';
import { MCPServerConfig } from '../config/mcp-config.schema';

export interface PoolOptions {
  maxConnections?: number;
  minConnections?: number;
  connectionTimeout?: number;
  maxIdle?: number;
  maxLifetime?: number;
  acquireTimeout?: number;
  maxWaitingRequests?: number;
  cleanupInterval?: number;
}

export interface PooledConnection {
  id: string;
  serverId?: string;
  connection: unknown;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  busy: boolean;
}

interface ConnectionRequest {
  resolve: (connection: PooledConnection) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export interface ConnectionPoolStats {
  serverId: string;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalCreated: number;
  totalAcquired: number;
  totalReleased: number;
  totalDestroyed: number;
  acquireSuccessRate: number;
  averageAcquireTime: number;
  averageIdleTime: number;
  maxAcquireTime: number;
  averageLifetime: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionPoolService {
  private pools = new Map<string, PooledConnection[]>();
  private waitingQueues = new Map<string, ConnectionRequest[]>();
  private stats = new Map<string, ConnectionPoolStats>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private defaultOptions: Required<PoolOptions> = {
    maxConnections: 10,
    minConnections: 2,
    connectionTimeout: 10000,
    maxIdle: 30000,
    maxLifetime: 60000,
    acquireTimeout: 5000,
    maxWaitingRequests: 20,
    cleanupInterval: 30000
  };
  
  private options: Partial<PoolOptions> = {};
  private acquisitionTimes: number[] = [];
  private idleTimes: number[] = [];
  private lifetimes: number[] = [];
  
  constructor() {
    this.startCleanupInterval();
  }
  
  /**
   * Configure connection pool options
   */
  configure(options: PoolOptions): void {
    this.options = { ...options };
    
    // Update cleanup interval if specified
    if (options.cleanupInterval !== undefined && this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.startCleanupInterval();
    }
  }
  
  /**
   * Get a connection from the pool
   */
  async getConnection(serverId: string, serverConfig: MCPServerConfig): Promise<PooledConnection> {
    const options = { ...this.defaultOptions, ...this.options };
    const pool = this.pools.get(serverId) || [];
    
    // Initialize stats for this server if needed
    if (!this.stats.has(serverId)) {
      this.initializeStats(serverId);
    }
    
    // Try to get an idle connection
    for (let i = 0; i < pool.length; i++) {
      const connection = pool[i];
      
      if (!connection.busy) {
        // Check if the connection is expired
        if (this.isConnectionExpired(connection, options)) {
          // Remove and destroy this connection
          pool.splice(i, 1);
          this.updateStats(serverId, 'totalDestroyed', 1);
          continue;
        }
        
        // Connection is valid, mark as busy and return
        connection.busy = true;
        connection.lastUsed = Date.now();
        connection.usageCount++;
        
        const idleTime = connection.lastUsed - connection.createdAt;
        this.idleTimes.push(idleTime);
        this.updateStats(serverId, 'totalAcquired', 1);
        
        return connection;
      }
    }
    
    // No idle connection available, check if we can create a new one
    if (pool.length < options.maxConnections) {
      try {
        const newConnection = await this.createConnection(serverId, serverConfig, options);
        
        // Add to the pool
        pool.push(newConnection);
        this.pools.set(serverId, pool);
        
        this.updateStats(serverId, 'totalCreated', 1);
        this.updateStats(serverId, 'totalAcquired', 1);
        
        return newConnection;
      } catch (error) {
        // Creation failed, try waiting for a connection
        return this.waitForConnection(serverId, options);
      }
    }
    
    // Pool is at capacity, wait for a connection
    return this.waitForConnection(serverId, options);
  }
  
  /**
   * Release a connection back to the pool
   */
  releaseConnection(connection: PooledConnection): void {
    const serverId = connection.serverId;
    if (!serverId) return;
    
    const pool = this.pools.get(serverId);
    if (!pool) return;
    
    // Find the connection in the pool
    const pooledConnection = pool.find(conn => conn.id === connection.id);
    if (!pooledConnection) return;
    
    // Mark as no longer busy
    pooledConnection.busy = false;
    pooledConnection.lastUsed = Date.now();
    
    this.updateStats(serverId, 'totalReleased', 1);
    
    // Check if there are waiting requests
    const waitingQueue = this.waitingQueues.get(serverId);
    if (waitingQueue && waitingQueue.length > 0) {
      // Get the next waiting request
      const request = waitingQueue.shift();
      if (request) {
        pooledConnection.busy = true;
        pooledConnection.lastUsed = Date.now();
        pooledConnection.usageCount++;
        
        const acquireTime = Date.now() - request.timestamp;
        this.acquisitionTimes.push(acquireTime);
        
        this.updateStats(serverId, 'totalAcquired', 1);
        
        request.resolve(pooledConnection);
      }
    }
  }
  
  /**
   * Get statistics for a specific server pool
   */
  getPoolStats(serverId: string): ConnectionPoolStats {
    return this.stats.get(serverId) || {
      serverId,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalCreated: 0,
      totalAcquired: 0,
      totalReleased: 0,
      totalDestroyed: 0,
      acquireSuccessRate: 0,
      averageAcquireTime: 0,
      averageIdleTime: 0,
      maxAcquireTime: 0,
      averageLifetime: 0
    };
  }
  
  /**
   * Get statistics for all connection pools
   */
  getAllPoolStats(): Map<string, ConnectionPoolStats> {
    const allStats = new Map<string, ConnectionPoolStats>();
    
    for (const serverId of this.pools.keys()) {
      allStats.set(serverId, this.getPoolStats(serverId));
    }
    
    return allStats;
  }
  
  /**
   * Drain a connection pool
   */
  async drainPool(serverId: string): Promise<void> {
    const pool = this.pools.get(serverId);
    if (!pool) return;
    
    // Mark the pool as draining
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      // Count busy connections
      const busyConnections = pool.filter(conn => conn.busy).length;
      
      if (busyConnections === 0) {
        // All connections are idle, destroy them
        pool.forEach(conn => {
          this.updateStats(serverId, 'totalDestroyed', 1);
        });
        
        // Clear the pool
        this.pools.delete(serverId);
        
        // Reject any waiting requests
        const waitingQueue = this.waitingQueues.get(serverId);
        if (waitingQueue) {
          waitingQueue.forEach(request => {
            request.reject(new Error('Connection pool has been drained'));
          });
          this.waitingQueues.delete(serverId);
        }
        
        return;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Timeout reached, force destroy all connections
    this.pools.delete(serverId);
    this.waitingQueues.delete(serverId);
  }
  
  /**
   * Shutdown all connection pools
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Drain all pools
    const serverIds = [...this.pools.keys()];
    
    await Promise.all(
      serverIds.map(serverId => this.drainPool(serverId))
    );
    
    this.pools.clear();
    this.waitingQueues.clear();
    this.stats.clear();
  }
  
  /**
   * Create a new connection to a server
   */
  private async createConnection(
    serverId: string | undefined,
    serverConfig: MCPServerConfig,
    options: Required<PoolOptions>
  ): Promise<PooledConnection> {
    const connectionId = `${serverId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Create the connection
    let connection: unknown | undefined;
    
    try {
      // Attempt to create the actual connection
      connection = await this.createActualConnection(serverConfig, options.connectionTimeout);
      
      const pooledConnection: PooledConnection = {
        id: connectionId,
        serverId,
        connection,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        usageCount: 0,
        busy: true
      };
      
      return pooledConnection;
    } catch (error) {
      throw new Error(`Failed to create connection to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create the actual connection object
   */
  private async createActualConnection(serverConfig: MCPServerConfig, timeout: number): Promise<unknown> {
    // Mock implementation - in a real service, this would create the actual connection
    return new Promise((resolve, reject) => {
      // Simulate connection creation delay
      setTimeout(() => {
        // 90% success rate for simulation
        if (Math.random() < 0.9) {
          resolve({
            // Mock connection object
            url: serverConfig.url,
            connect: () => Promise.resolve(),
            disconnect: () => Promise.resolve()
          });
        } else {
          reject(new Error('Failed to connect to server'));
        }
      }, Math.random() * 100); // Random delay between 0-100ms
    });
  }
  
  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(serverId: string | undefined, options: Required<PoolOptions>): Promise<PooledConnection> {
    let waitingQueue = this.waitingQueues.get(serverId);
    if (!waitingQueue) {
      waitingQueue = [];
      this.waitingQueues.set(serverId, waitingQueue);
    }
    
    // Check if we're exceeding max waiting requests
    if (waitingQueue.length >= options.maxWaitingRequests) {
      throw new Error(`Connection pool for server ${serverId} has too many waiting requests`);
    }
    
    // Add to waiting queue
    return new Promise<PooledConnection>((resolve, reject) => {
      const request: ConnectionRequest = {
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      waitingQueue!.push(request);
      this.waitingQueues.set(serverId, waitingQueue!);
      
      // Set a timeout to reject the request if it takes too long
      setTimeout(() => {
        const index = waitingQueue!.indexOf(request);
        if (index !== -1) {
          waitingQueue!.splice(index, 1);
          reject(new Error(`Timed out waiting for connection to server ${serverId}`));
        }
      }, options.acquireTimeout);
    });
  }
  
  /**
   * Check if a connection is expired (idle too long or lived too long)
   */
  private isConnectionExpired(connection: PooledConnection, options: Required<PoolOptions>): boolean {
    const now = Date.now();
    const idleTime = now - connection.lastUsed;
    const lifetime = now - connection.createdAt;
    
    // Check if connection has been idle too long
    if (idleTime > options.maxIdle) {
      return true;
    }
    
    // Check if connection has lived too long
    if (lifetime > options.maxLifetime) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get or initialize stats for a server
   */
  private getStats(serverId: string) {
    let serverStats = this.stats.get(serverId);
    
    if (!serverStats) {
      serverStats = {
        serverId,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
        totalCreated: 0,
        totalAcquired: 0,
        totalReleased: 0,
        totalDestroyed: 0,
        acquireSuccessRate: 0,
        averageAcquireTime: 0,
        averageIdleTime: 0,
        maxAcquireTime: 0,
        averageLifetime: 0
      };
      
      this.stats.set(serverId, serverStats);
    }
    
    return serverStats;
  }
  
  /**
   * Initialize stats for a server
   */
  private initializeStats(serverId: string): void {
    this.getStats(serverId);
  }
  
  /**
   * Clean up idle and expired connections
   */
  private cleanup(): void {
    const options = { ...this.defaultOptions, ...this.options };
    
    for (const [serverId, pool] of this.pools.entries()) {
      // Update stats
      const activeConnections = pool.filter(conn => conn.busy).length;
      const idleConnections = pool.length - activeConnections;
      
      const stats = this.getStats(serverId);
      stats.activeConnections = activeConnections;
      stats.idleConnections = idleConnections;
      stats.waitingRequests = this.waitingQueues.get(serverId)?.length || 0;
      
      // Calculate performance metrics
      if (this.acquisitionTimes.length > 0) {
        stats.averageAcquireTime = this.acquisitionTimes.reduce((sum, time) => sum + time, 0) / this.acquisitionTimes.length;
        stats.maxAcquireTime = Math.max(...this.acquisitionTimes);
      }
      
      if (this.idleTimes.length > 0) {
        stats.averageIdleTime = this.idleTimes.reduce((sum, time) => sum + time, 0) / this.idleTimes.length;
      }
      
      if (this.lifetimes.length > 0) {
        stats.averageLifetime = this.lifetimes.reduce((sum, time) => sum + time, 0) / this.lifetimes.length;
      }
      
      if (stats.totalAcquired > 0) {
        stats.acquireSuccessRate = (stats.totalAcquired / (stats.totalAcquired + stats.waitingRequests)) * 100;
      }
      
      // Remove expired connections
      for (let i = pool.length - 1; i >= 0; i--) {
        const connection = pool[i];
        
        if (!connection.busy && this.isConnectionExpired(connection, options)) {
          pool.splice(i, 1);
          this.updateStats(serverId, 'totalDestroyed', 1);
        }
      }
    }
  }
  
  /**
   * Update statistics for a server
   */
  private updateStats(serverId: string | undefined, statName: keyof ConnectionPoolStats, value: number): void {
    if (!serverId) return;
    
    const stats = this.getStats(serverId);
    if (typeof stats[statName] === 'number') {
      (stats[statName] as number) += value;
    }
  }
  
  /**
   * Start the cleanup interval
   */
  private startCleanupInterval(): void {
    const interval = this.options.cleanupInterval || this.defaultOptions.cleanupInterval;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, interval);
  }
}
