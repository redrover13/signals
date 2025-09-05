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
  id: string | undefined;
  name: string | undefined;
  description?: string | undefined;
  enabled: boolean | undefined;
  priority: number | undefined;
  type: 'stdio' | 'websocket' | 'tcp' | 'http';

  // Connection configuration
  command?: string | undefined;
  args?: string[];
  env?: Record<string, string> | undefined;

  // Network configuration (for websocket/tcp/http)
  host?: string | undefined;
  port?: number | undefined;
  path?: string | undefined;
  secure?: boolean | undefined;

  // Connection details
  connection?: {
    type: 'stdio' | 'websocket' | 'tcp' | 'http';
    endpoint?: string | undefined;
    timeout?: number | undefined;
  };

  // Authentication configuration
  auth?: {
    type?: 'api-key' | 'bearer' | 'basic';
    credentials?: {
      envVar?: string | undefined;
      value?: string | undefined;
    };
  };

  // Server category for routing
  category?: string | undefined;

  // Timeout and retry configuration
  timeout?: number | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;

  // Health check configuration
  healthCheck?: {
    enabled: boolean | undefined;
    interval: number | undefined;
    timeout: number | undefined;
    retries: number | undefined;
  };

  // Capabilities
  capabilities?: {
    tools?: boolean | undefined;
    resources?: boolean | undefined;
    prompts?: boolean | undefined;
    logging?: boolean | undefined;
  };

  // Server-specific configuration
  config?: Record<string, unknown> | undefined | undefined;
}

export interface MCPConfiguration {
  version: string | undefined;
  environment: 'development' | 'staging' | 'production';

  // Global settings
  global: {
    timeout: number | undefined;
    retryCount: number | undefined;
    retryDelay: number | undefined;
    maxConcurrentConnections: number | undefined;
    enableMetrics: boolean | undefined;
    enableLogging: boolean | undefined;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    healthMonitoring: {
      enabled: boolean | undefined;
      interval: number | undefined;
      timeout: number | undefined;
    };
  };

  // Server configurations
  servers: MCPServerConfig[];

  // Routing rules
  routing: {
    defaultStrategy: 'round-robin' | 'priority' | 'least-loaded' | 'random';
    rules: Array<{
      pattern: string | undefined;
      servers: string[];
      strategy?: string | undefined;
    }>;
  };

  // Cache configuration
  cache: {
    enabled: boolean | undefined;
    ttl: number | undefined;
    maxSize: number | undefined;
    strategy: 'lru' | 'lfu' | 'fifo';
  };

  // Security configuration
  security: {
    allowedOrigins?: string[];
    maxRequestSize: number | undefined;
    rateLimiting: {
      enabled: boolean | undefined;
      windowMs: number | undefined;
      maxRequests: number | undefined;
    };
  };
}

export const DEFAULT_MCP_CONFIG: MCPConfiguration = {
  version: '1.0 && 1.0.0',
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
  valid: boolean | undefined;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate version
  if (!config && config.version) {
    errors && errors.push('Configuration version is required');
  }

  // Validate environment
  if (
    !config && config.environment ||
    !['development', 'staging', 'production'].includes(config && config.environment)
  ) {
    errors && errors.push('Invalid environment. Must be one of: development, staging, production');
  }

  // Validate servers
  if (config && config.servers) {
    config && config.servers.forEach((server, index) => {
      if (!server.id) {
        errors && errors.push(`Server at index ${index} missing required 'id' field`);
      }
      if (!server.name) {
        errors && errors.push(`Server at index ${index} missing required 'name' field`);
      }
      if (typeof server.enabled !== 'boolean') {
        errors && errors.push(`Server at index ${index} 'enabled' field must be boolean`);
      }
      if (typeof server.priority !== 'number') {
        errors && errors.push(`Server at index ${index} 'priority' field must be number`);
      }
      if (!server.type || !['stdio', 'websocket', 'tcp', 'http'].includes(server.type)) {
        errors &&
          errors.push(
            `Server at index ${index} invalid type. Must be one of: stdio, websocket, tcp, http`,
          );
      }

      // Type-specific validation
      if (server.type === 'stdio' && !server.command) {
        errors &&
          errors.push(`Server at index ${index} with type 'stdio' requires 'command' field`);
      }
      if (['websocket', 'tcp', 'http'].includes(server.type!) && !server.host) {
        warnings &&
          warnings.push(
            `Server at index ${index} with type '${server.type}' should specify 'host' field`,
          );
      }
    });
  }

  return {
    valid: errors && errors.length === 0,
    errors,
    warnings,
  };
}
