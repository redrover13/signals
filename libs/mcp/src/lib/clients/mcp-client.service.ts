/**
 * MCP Client Service
 * Main service for managing MCP server connections and requests
 */

import { EventEmitter } from 'events';
import { MCPServerConfig, MCPConnectionConfig } from '../config/mcp-config.schema';
import { getCurrentConfig, getCurrentEnvironment } from '../config/environment-config';
import { ServerHealthService } from './server-health.service';
import { RequestRouter } from './request-router.service';

export interface MCPRequest {
  id: string;
  method: string;
  params?: any;
  serverId?: string; // Optional: route to specific server
  timeout?: number;
  retries?: number;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  serverId: string;
  duration: number;
}

export interface MCPServerConnection {
  id: string;
  config: MCPServerConfig;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  lastError?: Error;
  process?: any; // Child process for stdio connections
  client?: any; // HTTP/WebSocket client
}

/**
 * Main MCP Client Service
 */
export class MCPClientService extends EventEmitter {
  private connections = new Map<string, MCPServerConnection>();
  private healthService: ServerHealthService;
  private requestRouter: RequestRouter;
  private config = getCurrentConfig();
  private isInitialized = false;

  constructor() {
    super();
    this.healthService = new ServerHealthService(this);
    this.requestRouter = new RequestRouter(this);

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the MCP client service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log(`Initializing MCP Client Service for environment: ${getCurrentEnvironment()}`);

    try {
      // Load configuration
      this.config = getCurrentConfig();

      // Initialize enabled servers
      const enabledServers = this.config.servers.filter((server) => server.enabled);
      console.log(`Found ${enabledServers.length} enabled servers`);

      // Connect to servers in priority order
      const sortedServers = enabledServers.sort((a, b) => b.priority - a.priority);

      for (const serverConfig of sortedServers) {
        try {
          await this.connectToServer(serverConfig);
        } catch (error) {
          console.error(`Failed to connect to server ${serverConfig.id}:`, error);
          this.emit('serverError', serverConfig.id, error);
        }
      }

      // Start health monitoring
      if (this.config.global.healthMonitoring.enabled) {
        await this.healthService.start();
      }

      this.isInitialized = true;
      this.emit('initialized');
      console.log('MCP Client Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Client Service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Connect to a specific MCP server
   */
  private async connectToServer(config: MCPServerConfig): Promise<void> {
    console.log(`Connecting to MCP server: ${config.name} (${config.id})`);

    const connection: MCPServerConnection = {
      id: config.id,
      config,
      status: 'connecting',
    };

    this.connections.set(config.id, connection);

    try {
      switch (config.connection.type) {
        case 'stdio':
          await this.connectStdio(connection);
          break;
        case 'http':
          await this.connectHttp(connection);
          break;
        case 'websocket':
          await this.connectWebSocket(connection);
          break;
        case 'tcp':
          await this.connectTcp(connection);
          break;
        default:
          throw new Error(`Unsupported connection type: ${config.connection.type}`);
      }

      connection.status = 'connected';
      connection.lastConnected = new Date();

      console.log(`Successfully connected to ${config.name}`);
      this.emit('serverConnected', config.id);
    } catch (error) {
      connection.status = 'error';
      connection.lastError = error as Error;

      console.error(`Failed to connect to ${config.name}:`, error);
      this.emit('serverError', config.id, error);
      throw error;
    }
  }

  /**
   * Connect via stdio
   */
  private async connectStdio(connection: MCPServerConnection): Promise<void> {
    const { spawn } = await import('child_process');
    const config = connection.config;

    // Parse command and arguments
    const [command, ...args] = config.connection.endpoint.split(' ');

    // Spawn the process
    const spawnedProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...this.getEnvironmentVariables(config) },
    });

    // Handle process events
    spawnedProcess.on('error', (error: Error) => {
      connection.status = 'error';
      connection.lastError = error;
      this.emit('serverError', connection.id, error);
    });

    spawnedProcess.on('exit', (code: number) => {
      connection.status = 'disconnected';
      this.emit('serverDisconnected', connection.id, code);
    });

    // Set up JSON-RPC communication
    connection.process = spawnedProcess;

    // Wait for initial connection
    await this.waitForConnection(connection);
  }

  /**
   * Connect via HTTP
   */
  private async connectHttp(connection: MCPServerConnection): Promise<void> {
    const config = connection.config;
    const baseURL = config.connection.endpoint;

    // Create HTTP client (using fetch or axios)
    const client = {
      baseURL,
      timeout: config.connection.timeout || 30000,
      headers: this.getAuthHeaders(config),
    };

    connection.client = client;

    // Test connection
    await this.testHttpConnection(connection);
  }

  /**
   * Connect via WebSocket
   */
  private async connectWebSocket(connection: MCPServerConnection): Promise<void> {
    // WebSocket implementation would go here
    throw new Error('WebSocket connections not yet implemented');
  }

  /**
   * Connect via TCP
   */
  private async connectTcp(connection: MCPServerConnection): Promise<void> {
    // TCP implementation would go here
    throw new Error('TCP connections not yet implemented');
  }

  /**
   * Send request to MCP server(s)
   */
  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!this.isInitialized) {
      throw new Error('MCP Client Service not initialized');
    }

    const startTime = Date.now();
    let routedServerId: string | undefined;

    try {
      // Route the request
      const serverId = await this.requestRouter.routeRequest(request);
      routedServerId = serverId;
      const connection = this.connections.get(serverId);

      if (!connection || connection.status !== 'connected') {
        throw new Error(`Server ${serverId} is not available`);
      }

      // Send the request
      const result = await this.sendRequestToServer(connection, request);

      const response: MCPResponse = {
        id: request.id,
        result,
        serverId,
        duration: Date.now() - startTime,
      };

      this.emit('requestCompleted', request, response);
      return response;
    } catch (error) {
      const response: MCPResponse = {
        id: request.id,
        error: {
          code: -1,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: error,
        },
        serverId: routedServerId || request.serverId || 'unknown',
        duration: Date.now() - startTime,
      };

      this.emit('requestFailed', request, response);
      return response;
    }
  }

  /**
   * Send request to specific server
   */
  private async sendRequestToServer(
    connection: MCPServerConnection,
    request: MCPRequest,
  ): Promise<any> {
    const config = connection.config;
    const timeout = request.timeout || config.connection.timeout || 30000;

    switch (config.connection.type) {
      case 'stdio':
        return this.sendStdioRequest(connection, request, timeout);
      case 'http':
        return this.sendHttpRequest(connection, request, timeout);
      default:
        throw new Error(
          `Request sending not implemented for connection type: ${config.connection.type}`,
        );
    }
  }

  /**
   * Send stdio request
   */
  private async sendStdioRequest(
    connection: MCPServerConnection,
    request: MCPRequest,
    timeout: number,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = connection.process;
      if (!process) {
        reject(new Error('No process available for stdio connection'));
        return;
      }

      let buffer = '';
      const cleanup = () => {
        process.stdout.off('data', onData);
        clearTimeout(timeoutId);
      };
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Send JSON-RPC request (newline-delimited)
      const jsonRpcRequest = {
        jsonrpc: '2.0',
        id: request.id,
        method: request.method,
        params: request.params,
      };

      process.stdin.write(JSON.stringify(jsonRpcRequest) + '\n');

      const onData = (data: Buffer) => {
        buffer += data.toString();
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              cleanup();
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
              return;
            }
          } catch {
            // Ignore malformed lines; continue buffering
          }
        }
      };
      process.stdout.on('data', onData);
    });
  }

  /**
   * Send HTTP request
   */
  private async sendHttpRequest(
    connection: MCPServerConnection,
    request: MCPRequest,
    timeout: number,
  ): Promise<any> {
    const client = connection.client;
    if (!client) {
      throw new Error('No HTTP client available');
    }

    // Implementation would use fetch or axios
    throw new Error('HTTP request sending not yet implemented');
  }

  /**
   * Get server connection status
   */
  getServerStatus(serverId: string): MCPServerConnection | undefined {
    return this.connections.get(serverId);
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): Map<string, MCPServerConnection> {
    return new Map(this.connections);
  }

  /**
   * Disconnect from all servers
   */
  async disconnect(): Promise<void> {
    console.log('Disconnecting from all MCP servers...');

    // Stop health monitoring
    await this.healthService.stop();

    // Disconnect from all servers
    for (const [serverId, connection] of this.connections) {
      try {
        await this.disconnectFromServer(connection);
      } catch (error) {
        console.error(`Error disconnecting from ${serverId}:`, error);
      }
    }

    this.connections.clear();
    this.isInitialized = false;
    this.emit('disconnected');
  }

  /**
   * Disconnect from specific server
   */
  private async disconnectFromServer(connection: MCPServerConnection): Promise<void> {
    if (connection.process) {
      connection.process.kill();
    }
    if (connection.client) {
      // Close HTTP/WebSocket client
    }
    connection.status = 'disconnected';
  }

  /**
   * Helper methods
   */
  private setupEventHandlers(): void {
    this.on('serverError', (serverId: string, error: Error) => {
      console.error(`Server ${serverId} error:`, error);
    });

    this.on('serverDisconnected', (serverId: string, code?: number) => {
      console.warn(`Server ${serverId} disconnected with code: ${code}`);
    });
  }

  private getEnvironmentVariables(config: MCPServerConfig): Record<string, string> {
    const env: Record<string, string> = {};

    if (config.auth?.credentials?.envVar) {
      const value = process.env[config.auth.credentials.envVar];
      if (value) {
        env[config.auth.credentials.envVar] = value;
      }
    }

    return env;
  }

  private getAuthHeaders(config: MCPServerConfig): Record<string, string> {
    const headers: Record<string, string> = {};

    if (config.auth?.type === 'api-key' && config.auth.credentials?.envVar) {
      const apiKey = process.env[config.auth.credentials.envVar];
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    return headers;
  }

  private async waitForConnection(connection: MCPServerConnection): Promise<void> {
    // Wait for initial handshake or connection confirmation
    return new Promise((resolve) => {
      setTimeout(resolve, 1000); // Simple timeout for now
    });
  }

  private async testHttpConnection(connection: MCPServerConnection): Promise<void> {
    // Test HTTP connection with a simple request
    // Implementation would depend on the specific HTTP client used
  }
}
