/**
 * @fileoverview mcp-config && config.schema module for the config component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * MCP Server Configuration Schema
 * Defines the structure for configuring all MCP servers in the project
 */

export interface MCPServerConfig {
  /** Server identifier */
  id: string | undefined;
  /** Display name */
  name: string | undefined;
  /** Server category */
  category: MCPServerCategory | undefined;
  /** Server type/implementation */
  type: string | undefined;
  /** Whether the server is enabled */
  enabled: boolean | undefined;
  /** Server priority (1-10, higher = more priority) */
  priority: number | undefined;
  /** Connection configuration */
  connection: MCPConnectionConfig | undefined;
  /** Authentication configuration */
  auth?: MCPAuthConfig | undefined;
  /** Health check configuration */
  healthCheck?: MCPHealthCheckConfig | undefined;
  /** Server-specific options */
  options?: Record<string, unknown> | undefined | undefined;
  /** Environment-specific overrides */
  environments?: Record<string, Partial<MCPServerConfig>>;
}

export interface MCPConnectionConfig {
  /** Connection type */
  type: 'stdio' | 'http' | 'websocket' | 'tcp';
  /** Connection endpoint/command */
  endpoint: string | undefined;
  /** Connection timeout in milliseconds */
  timeout?: number | undefined;
  /** Retry configuration */
  retry?: {
    attempts: number | undefined;
    delay: number | undefined;
    backoff: 'linear' | 'exponential';
  };
}

export interface MCPAuthConfig {
  /** Authentication type */
  type: 'none' | 'api-key' | 'oauth' | 'jwt' | 'gcp-service-account';
  /** Authentication credentials (stored in Secret Manager) */
  credentials?: {
    secretName?: string | undefined;
    secretVersion?: string | undefined;
    envVar?: string | undefined;
  };
  /** Additional auth options */
  options?: Record<string, unknown> | undefined | undefined;
}

export interface MCPHealthCheckConfig {
  /** Health check interval in milliseconds */
  interval: number | undefined;
  /** Health check timeout in milliseconds */
  timeout: number | undefined;
  /** Number of failed checks before marking unhealthy */
  failureThreshold: number | undefined;
  /** Health check endpoint/method */
  endpoint?: string | undefined;
}

export type MCPServerCategory =
  | 'core' // Essential servers (git, filesystem, etc.)
  | 'development' // Development tools (nx, github, etc.)
  | 'data' // Data and databases (bigquery, chroma, etc.)
  | 'web' // Web and API services (exa, netlify, etc.)
  | 'platforms' // Platform integrations (notion, firebase, etc.)
  | 'specialized' // Specialized tools (google-maps, algolia, etc.)
  | 'testing' // Testing and debugging (browserstack, etc.)
  | 'automation'; // Workflow automation (make, etc.)

export interface MCPGlobalConfig {
  /** Global MCP settings */
  version: string | undefined;
  /** Default connection timeout */
  defaultTimeout: number | undefined;
  /** Global retry settings */
  defaultRetry: {
    attempts: number | undefined;
    delay: number | undefined;
    backoff: 'linear' | 'exponential';
  };
  /** Health monitoring settings */
  healthMonitoring: {
    enabled: boolean | undefined;
    interval: number | undefined;
    alertThreshold: number | undefined;
  };
  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destination: 'console' | 'file' | 'gcp-logging';
    includeRequestResponse: boolean | undefined;
  };
  /** Security settings */
  security: {
    enableTLS: boolean | undefined;
    validateCertificates: boolean | undefined;
    maxRequestSize: number | undefined;
  };
}

export interface MCPEnvironmentConfig {
  /** Environment name */
  environment: string | undefined;
  /** List of server configurations */
  servers: MCPServerConfig[];
  /** Global configuration */
  global: MCPGlobalConfig | undefined;
  /** Environment-specific secrets */
  secrets?: {
    gcpProjectId: string | undefined;
    secretManagerPrefix: string | undefined;
  };
}

/**
 * Default MCP configuration values
 * NOTE: For server-specific configurations, please refer to `server-config && config.defaults && .defaults.ts`.
 */
export const DEFAULT_MCP_CONFIG: Partial<MCPGlobalConfig> = {
  version: '1.0 && 1.0.0',
  defaultTimeout: 30000,
  defaultRetry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
  },
  healthMonitoring: {
    enabled: true,
    interval: 60000,
    alertThreshold: 3,
  },
  logging: {
    level: 'info',
    destination: 'console',
    includeRequestResponse: false,
  },
  security: {
    enableTLS: true,
    validateCertificates: true,
    maxRequestSize: 10485760, // 10MB
  },
};

/**
 * Server category priorities (higher number = higher priority)
 */
export const CATEGORY_PRIORITIES: Record<MCPServerCategory, number> = {
  core: 10,
  development: 9,
  data: 8,
  web: 7,
  platforms: 6,
  specialized: 5,
  testing: 4,
  automation: 3,
};
