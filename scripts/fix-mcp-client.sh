#!/bin/bash

# Script to fix mcp-client.service.ts
echo "🔧 Fixing MCP Client Service..."

# Create a directory if it doesn't exist
mkdir -p ./libs/utils/api-clients/src/lib

# Create the fixed file
cat > ./libs/utils/api-clients/src/lib/mcp-client.service.ts.new << 'EOF2'
/**
 * MCP Client Service for Dulce Saigon
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ChildProcess, spawn } from 'child_process';
import { ServerHealthService } from './server-health.service';
import { RequestRouter } from './request-router.service';

/**
 * Connection status
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

/**
 * Connection type
 */
export type ConnectionType = 'http' | 'websocket' | 'stdio';

/**
 * MCP server connection configuration
 */
export interface MCPConnectionConfig {
  type: ConnectionType;
  endpoint: string;
  timeout?: number;
  options?: Record<string, unknown>;
}

/**
 * MCP server authentication configuration
 */
export interface MCPAuthConfig {
  type: 'none' | 'api-key' | 'oauth';
  credentials?: {
    envVar?: string;
    keyFile?: string;
  };
}

/**
 * MCP server health check configuration
 */
export interface MCPHealthCheckConfig {
  enabled: boolean;
  endpoint: string;
  intervalMs?: number;
  timeoutMs?: number;
  failureThreshold?: number;
  autoReconnect?: boolean;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  id?: string;
  name?: string;
  url?: string;
  connection?: MCPConnectionConfig;
  auth?: MCPAuthConfig;
  healthCheck?: MCPHealthCheckConfig;
  capabilities?: string[];
}

/**
 * MCP client global configuration
 */
export interface MCPGlobalConfig {
  healthMonitoring: {
    enabled: boolean;
    intervalMs?: number;
  };
}

/**
 * MCP client configuration
 */
export interface MCPClientConfig {
  servers: MCPServerConfig[];
  global: MCPGlobalConfig;
}

/**
 * MCP connection
 */
export interface MCPConnection {
  id: string;
  status: ConnectionStatus;
  type: ConnectionType;
  process?: NodeJS.Process; // Child process for stdio connections
  client?: Record<string, unknown>; // HTTP/WebSocket client
  lastConnected?: Date;
  lastError?: Error;
}

/**
 * MCP client service
 */
export class MCPClientService {
  private config: MCPClientConfig;
  private connections: Map<string, MCPConnection> = new Map();
  private healthService: ServerHealthService;
  private requestRouter: RequestRouter;
  private isInitialized = false;

  /**
   * Constructor
   * @param config Client configuration
   */
  constructor(config: MCPClientConfig) {
    this.config = config;
    this.healthService = new ServerHealthService(this);
    this.requestRouter = new RequestRouter(this);
  }

  /**
   * Initialize the client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Connect to all servers
    for (const server of this.config.servers) {
      try {
        await this.connectToServer(server);
      } catch (error) {
        console.error(`Failed to connect to server ${server.id}:`, error);
      }
    }

    // Start health monitoring if enabled
    if (this.config?.global.healthMonitoring?.enabled) {
      this.healthService.startHealthMonitoring(this.config.global.healthMonitoring.intervalMs);
    }

    this.isInitialized = true;
  }

  /**
   * Connect to a server
   * @param config Server configuration
   */
  async connectToServer(config: MCPServerConfig): Promise<void> {
    if (!config.id) {
      throw new Error('Server ID is required');
    }

    // Check if connection already exists
    if (this.connections.has(config.id)) {
      return;
    }

    // Create a new connection
    const connection: MCPConnection = {
      id: config.id,
      status: 'connecting',
      type: config.connection?.type || 'http',
    };

    this.connections.set(config.id, connection);

    try {
      // Connect based on connection type
      switch (config.connection?.type) {
        case 'stdio':
          await this.connectViaStdio(config, connection);
          break;
        case 'http':
          await this.connectViaHttp(config, connection);
          break;
        case 'websocket':
          // Not implemented yet
          throw new Error(`Unsupported connection type: ${config.connection?.type}`);
      }

      connection.status = 'connected';
      connection.lastConnected = new Date();
    } catch (error) {
      console.error(`Failed to connect to server ${config.id}:`, error);
      connection.status = 'error';
      connection.lastError = error as Error;
      throw error;
    }
  }

  /**
   * Connect to a server via stdio
   * @param config Server configuration
   * @param connection Connection object
   */
  private async connectViaStdio(
    config: MCPServerConfig,
    connection: MCPConnection
  ): Promise<void> {
    if (!config.connection?.endpoint) {
      throw new Error('Connection endpoint is required for stdio connections');
    }

    // Parse command and arguments
    const parts = config.connection.endpoint.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    try {
      // Spawn the process
      const spawnedProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...this.getEnvironmentVariables(config) },
        shell: true,
      });

      // Handle process events
      spawnedProcess.on('error', (error) => {
        console.error(`Process error for server ${config.id}:`, error);
        connection.status = 'error';
        connection.lastError = error;
      });

      spawnedProcess.on('close', () => {
        console.log(`Process closed for server ${config.id}`);
        connection.status = 'disconnected';
      });

      // Store the process in the connection
      connection.process = spawnedProcess as any;
    } catch (error) {
      throw new Error(`Failed to spawn process: ${error}`);
    }
  }

  /**
   * Connect to a server via HTTP
   * @param config Server configuration
   * @param connection Connection object
   */
  private async connectViaHttp(
    config: MCPServerConfig,
    connection: MCPConnection
  ): Promise<void> {
    const baseURL = config.connection?.endpoint;
    if (!baseURL) {
      throw new Error('Connection endpoint is required for HTTP connections');
    }

    // Create HTTP client
    const client = axios.create({
      baseURL,
      timeout: config.connection?.timeout || 30000,
      headers: this.getAuthHeaders(config),
    });

    connection.client = client;
  }

  /**
   * Get authentication headers for a server
   * @param config Server configuration
   */
  private getAuthHeaders(config: MCPServerConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.auth?.type === 'api-key' && config.auth?.credentials?.envVar) {
      const apiKey = process.env[config.auth.credentials.envVar];
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
    }

    return headers;
  }

  /**
   * Send a request to a server
   * @param request Request configuration
   */
  async sendRequest(request: {
    serverId?: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    timeout?: number;
  }): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Determine which server to send the request to
    const serverId = request.serverId || this.requestRouter.routeRequest(request);
    if (!serverId) {
      throw new Error('No server available to handle the request');
    }

    // Get the server configuration
    const config = this.config.servers.find((s) => s.id === serverId);
    if (!config) {
      throw new Error(`Server configuration not found for server ID: ${serverId}`);
    }

    // Get the connection
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Connection not found for server ID: ${serverId}`);
    }

    if (connection.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`);
    }

    // Set timeout
    const timeout = request.timeout || config.connection?.timeout || 30000;

    // Send the request based on connection type
    switch (config.connection?.type) {
      case 'http':
        return this.sendHttpRequest(connection, request, timeout);
      case 'stdio':
        return this.sendStdioRequest(connection, request, timeout);
      default:
        throw new Error(
          `Request sending not implemented for connection type: ${config.connection?.type}`,
        );
    }
  }

  /**
   * Send an HTTP request
   * @param connection Connection object
   * @param request Request configuration
   * @param timeout Request timeout
   */
  private async sendHttpRequest(
    connection: MCPConnection,
    request: {
      path: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    },
    timeout: number
  ): Promise<any> {
    const client = connection.client as AxiosInstance;
    if (!client) {
      throw new Error('HTTP client not initialized');
    }

    const config: AxiosRequestConfig = {
      url: request.path,
      method: request.method,
      data: request.data,
      params: request.params,
      headers: request.headers,
      timeout,
    };

    try {
      const response: AxiosResponse = await client.request(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`HTTP error ${error.response.status}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Send a request via stdio
   * @param connection Connection object
   * @param request Request configuration
   * @param timeout Request timeout
   */
  private async sendStdioRequest(
    connection: MCPConnection,
    request: {
      path: string;
      method: string;
      data?: any;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    },
    timeout: number
  ): Promise<any> {
    const process = connection.process as ChildProcess;
    if (!process || !process.stdin || !process.stdout) {
      throw new Error('Process not initialized or stdio not available');
    }

    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2, 15);
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);

      // Create request message
      const message = JSON.stringify({
        id: requestId,
        method: request.method,
        path: request.path,
        body: request.data,
        params: request.params,
        headers: request.headers,
      });

      // Setup response handler
      const responseHandler = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === requestId) {
            clearTimeout(timeoutId);
            process.stdout?.removeListener('data', responseHandler);

            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          // Not JSON or not our response, ignore
        }
      };

      process.stdout.on('data', responseHandler);

      // Send the request
      process.stdin.write(message + '\n');
    });
  }

  /**
   * Get current client configuration
   */
  getConfig(): MCPClientConfig {
    return this.config;
  }

  /**
   * Get all connections
   */
  getConnections(): Map<string, MCPConnection> {
    return this.connections;
  }

  /**
   * Shutdown the client
   */
  async shutdown(): Promise<void> {
    // Stop health monitoring
    this.healthService.stopHealthMonitoring();

    // Disconnect from all servers
    for (const connection of this.connections.values()) {
      await this.disconnectFromServer(connection.id);
    }

    this.isInitialized = false;
  }

  /**
   * Disconnect from a server
   * @param serverId Server ID
   */
  async disconnectFromServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      return;
    }

    // Close the connection based on type
    switch (connection.type) {
      case 'stdio':
        const process = connection.process as ChildProcess;
        if (process && !process.killed) {
          process.kill();
        }
        break;
      // Other connection types will be handled here
    }

    connection.status = 'disconnected';
    this.connections.delete(serverId);
  }

  /**
   * Get environment variables for a server
   * @param config Server configuration
   */
  private getEnvironmentVariables(config: MCPServerConfig): Record<string, string> {
    const env: Record<string, string> = {};

    // Add authentication environment variables
    if (config.auth?.type === 'api-key' && config.auth?.credentials?.envVar) {
      const value = process.env[config.auth.credentials.envVar];
      if (value) {
        env[config.auth.credentials.envVar] = value;
      }
    }

    return env;
  }

  /**
   * Get server health service
   */
  getHealthService(): ServerHealthService {
    return this.healthService;
  }

  /**
   * Get request router
   */
  getRequestRouter(): RequestRouter {
    return this.requestRouter;
  }
}
EOF2

# Replace the file
mv ./libs/utils/api-clients/src/lib/mcp-client.service.ts.new ./libs/utils/api-clients/src/lib/mcp-client.service.ts

echo "✅ MCP Client Service fixed!"
