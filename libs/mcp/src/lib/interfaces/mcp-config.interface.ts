/**
 * @fileoverview mcp-config.interface module for the interfaces component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Stub interfaces for MCP library
export interface MCPConfig {
  servers?: MCPServerConfig[];
  global?: {
    logLevel?: string;
    timeout?: number;
    retryCount?: number;
    maxConcurrentConnections?: number;
    enableMetrics?: boolean;
  };
  cache?: {
    ttl?: number;
  };
  security?: {
    rateLimiting?: {
      maxRequests?: number;
    };
  };
}

export interface MCPServerConfig {
  id?: string;
  name?: string;
  url?: string;
  enabled?: boolean;
  priority?: number;
  category?: string;
}

export interface HealthCheckResult {
  serverId?: string;
  status?: 'healthy' | 'unhealthy';
  timestamp?: Date;
  responseTime?: number;
  error?: string;
}

export interface MCPResponse {
  success?: boolean;
  data?: any;
  error?: string;
  serverId?: string;
  timestamp?: Date;
}

export interface MCPRequest {
  method?: string;
  params?: Record<string, any>;
  serverId?: string;
  timeout?: number;
}

export interface ServerHealthStatus {
  serverId?: string;
  status?: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck?: Date;
  uptime?: number;
  responseTime?: number;
}

export const DEFAULT_MCP_CONFIG: MCPConfig = {
  servers: [],
  global: {
    logLevel: 'info',
    timeout: 30000,
    retryCount: 3,
    maxConcurrentConnections: 10,
    enableMetrics: false,
  },
  cache: {
    ttl: 300000,
  },
  security: {
    rateLimiting: {
      maxRequests: 100,
    },
  },
};
