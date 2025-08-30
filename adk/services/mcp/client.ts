/**
 * @fileoverview MCP Client for Agent Developer Kit
 * 
 * This module provides a universal client for interacting with Model Context Protocol (MCP) servers
 * such as Codacy, NX, and others. It handles authentication, request formatting, and response parsing.
 */

import { MCPProtocolAdapter } from './adapters';
import { validateMCPRequest, validateMCPResponse } from './schema';
import { Logger } from '../../utils/logger';

/**
 * Supported MCP server types
 */
export enum MCPServerType {
  CODACY = 'codacy',
  NX = 'nx',
  GITHUB = 'github',
  PLAYWRIGHT = 'playwright',
  CUSTOM = 'custom'
}

/**
 * MCP Client configuration options
 */
export interface MCPClientConfig {
  /** The type of MCP server to connect to */
  serverType: MCPServerType;
  
  /** Authentication credentials for the MCP server */
  credentials?: string;
  
  /** Custom server URL for non-standard MCP servers */
  serverUrl?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Generic MCP request parameters
 */
export interface MCPRequest<T = unknown> {
  /** The command to execute on the MCP server */
  command: string;
  
  /** Parameters for the command */
  parameters: T;
  
  /** Optional metadata for the request */
  metadata?: Record<string, unknown>;
}

/**
 * Generic MCP response
 */
export interface MCPResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;
  
  /** The result of the command, if successful */
  result?: T;
  
  /** Error information, if the request failed */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  
  /** Optional metadata for the response */
  metadata?: Record<string, unknown>;
}

/**
 * A universal client for interacting with Model Context Protocol (MCP) servers
 */
export class MCPClient {
  private adapter: MCPProtocolAdapter;
  private logger: Logger;
  private config: Required<MCPClientConfig>;

  /**
   * Creates a new MCP client
   * 
   * @param config - Configuration options for the client
   */
  constructor(config: MCPClientConfig) {
    this.config = {
      serverType: config.serverType,
      credentials: config.credentials || '',
      serverUrl: config.serverUrl || '',
      timeout: config.timeout || 30000,
      debug: config.debug || false
    };
    
    this.adapter = MCPProtocolAdapter.create(this.config.serverType, {
      credentials: this.config.credentials,
      serverUrl: this.config.serverUrl
    });
    
    this.logger = new Logger({
      service: 'mcp-client',
      level: this.config.debug ? 'debug' : 'info'
    });
  }

  /**
   * Executes a command on the MCP server
   * 
   * @param command - The command to execute
   * @param parameters - Parameters for the command
   * @returns The response from the MCP server
   * @throws If the request is invalid or the server returns an error
   */
  async execute<TParams = unknown, TResult = unknown>(
    command: string,
    parameters: TParams
  ): Promise<MCPResponse<TResult>> {
    const request: MCPRequest<TParams> = {
      command,
      parameters,
      metadata: {
        timestamp: new Date().toISOString(),
        clientVersion: '1.0.0'
      }
    };
    
    // Validate the request
    validateMCPRequest(request);
    
    this.logger.debug('Executing MCP command', { command, serverType: this.config.serverType });
    
    try {
      // Use the adapter to send the request to the MCP server
      const response = await this.adapter.sendRequest<TParams, TResult>(request);
      
      // Validate the response
      validateMCPResponse(response);
      
      if (!response.success) {
        this.logger.error('MCP command failed', { 
          command, 
          error: response.error 
        });
        throw new Error(`MCP command failed: ${response.error?.message}`);
      }
      
      this.logger.debug('MCP command succeeded', { command });
      return response;
    } catch (error) {
      this.logger.error('Error executing MCP command', { 
        command, 
        error 
      });
      throw error;
    }
  }
  
  /**
   * Executes a Codacy analysis command
   * 
   * @param filePath - The path to the file to analyze
   * @param options - Analysis options
   * @returns The analysis results
   */
  async analyzeCodacy(filePath: string, options?: {
    tool?: string;
    rules?: string[];
  }): Promise<MCPResponse<unknown>> {
    if (this.config.serverType !== MCPServerType.CODACY) {
      throw new Error('This method can only be used with a Codacy MCP server');
    }
    
    return this.execute('analyze', {
      filePath,
      tool: options?.tool,
      rules: options?.rules
    });
  }
  
  /**
   * Executes an NX command
   * 
   * @param project - The NX project to target
   * @param target - The target to execute
   * @param options - Command options
   * @returns The command results
   */
  async runNxCommand(project: string, target: string, options?: Record<string, unknown>): Promise<MCPResponse<unknown>> {
    if (this.config.serverType !== MCPServerType.NX) {
      throw new Error('This method can only be used with an NX MCP server');
    }
    
    return this.execute('run', {
      project,
      target,
      options
    });
  }
  
  /**
   * Closes the connection to the MCP server
   */
  async close(): Promise<void> {
    await this.adapter.close();
    this.logger.debug('MCP client closed');
  }
}

export * from './adapters';
export * from './schema';
