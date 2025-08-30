/**
 * @fileoverview MCP Configuration Schema
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Defines the configuration schema for MCP servers and connections.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  type: 'stdio' | 'websocket' | 'tcp' | 'http';
  
  // Connection configuration
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  
  // Network configuration (for websocket/tcp/http)
  host?: string;
  port?: number;
  path?: string;
  secure?: boolean;
  
  // Connection details
  connection?: {
    type: 'stdio' | 'websocket' | 'tcp' | 'http';
    endpoint?: string;
    timeout?: number;
  };
  
  // Authentication configuration
  auth?: {
    type?: 'api-key' | 'bearer' | 'basic';
    credentials?: {
      envVar?: string;
      value?: string;
    };
  };
  
  // Server category for routing
  category?: string;
  
  // Timeout and retry configuration
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  
  // Health check configuration
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
  
  // Capabilities
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
  };
  
  // Server-specific configuration
  config?: Record<string, unknown>;
}

export interface MCPConfiguration {
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // Global settings
  global: {
    timeout: number;
    retryCount: number;
    retryDelay: number;
    maxConcurrentConnections: number;
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    healthMonitoring: {
      enabled: boolean;
      interval: number;
      timeout: number;
    };
  };
  
  // Server configurations
  servers: MCPServerConfig[];
  
  // Routing rules
  routing: {
    defaultStrategy: 'round-robin' | 'priority' | 'least-loaded' | 'random';
    rules: Array<{
      pattern: string;
      servers: string[];
      strategy?: string;
    }>;
  };
  
  // Cache configuration
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'lfu' | 'fifo';
  };
  
  // Security configuration
  security: {
    allowedOrigins?: string[];
    maxRequestSize: number;
    rateLimiting: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
    };
  };
}

export const DEFAULT_MCP_CONFIG: MCPConfiguration = {
  version: '1.0.0',
  environment: 'development',
  
  global: {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    maxConcurrentConnections: 10,
    enableMetrics: true,
    enableLogging: true,
    logLevel: 'info',
    healthMonitoring: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
    },
  },
  
  servers: [],
  
  routing: {
    defaultStrategy: 'priority',
    rules: [],
  },
  
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru',
  },
  
  security: {
    maxRequestSize: 1024 * 1024, // 1MB
    rateLimiting: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 100,
    },
  },
};

// Validation functions
export function validateMCPConfig(config: Partial<MCPConfiguration>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate version
  if (!config.version) {
    errors.push('Configuration version is required');
  }
  
  // Validate environment
  if (!config.environment || !['development', 'staging', 'production'].includes(config.environment)) {
    errors.push('Invalid environment. Must be one of: development, staging, production');
  }
  
  // Validate servers
  if (config.servers) {
    config.servers.forEach((server, index) => {
      if (!server.id) {
        errors.push(`Server at index ${index} missing required 'id' field`);
      }
      if (!server.name) {
        errors.push(`Server at index ${index} missing required 'name' field`);
      }
      if (typeof server.enabled !== 'boolean') {
        errors.push(`Server at index ${index} 'enabled' field must be boolean`);
      }
      if (typeof server.priority !== 'number') {
        errors.push(`Server at index ${index} 'priority' field must be number`);
      }
      if (!server.type || !['stdio', 'websocket', 'tcp', 'http'].includes(server.type)) {
        errors.push(`Server at index ${index} invalid type. Must be one of: stdio, websocket, tcp, http`);
      }
      
      // Type-specific validation
      if (server.type === 'stdio' && !server.command) {
        errors.push(`Server at index ${index} with type 'stdio' requires 'command' field`);
      }
      if (['websocket', 'tcp', 'http'].includes(server.type!) && !server.host) {
        warnings.push(`Server at index ${index} with type '${server.type}' should specify 'host' field`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}