/**
 * MCP Server Configuration Schema
 * Defines the structure for configuring all MCP servers in the project
 */

export interface MCPServerConfig {
  /** Server identifier */
  id: string;
  /** Display name */
  name: string;
  /** Server category */
  category: MCPServerCategory;
  /** Server type/implementation */
  type: string;
  /** Whether the server is enabled */
  enabled: boolean;
  /** Server priority (1-10, higher = more priority) */
  priority: number;
  /** Connection configuration */
  connection: MCPConnectionConfig;
  /** Authentication configuration */
  auth?: MCPAuthConfig;
  /** Health check configuration */
  healthCheck?: MCPHealthCheckConfig;
  /** Server-specific options */
  options?: Record<string, unknown>;
  /** Environment-specific overrides */
  environments?: Record<string, Partial<MCPServerConfig>>;
}

export interface MCPConnectionConfig {
  /** Connection type */
  type: 'stdio' | 'http' | 'websocket' | 'tcp';
  /** Connection endpoint/command */
  endpoint: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay: number;
    backoff: 'linear' | 'exponential';
  };
}

export interface MCPAuthConfig {
  /** Authentication type */
  type: 'none' | 'api-key' | 'oauth' | 'jwt' | 'gcp-service-account';
  /** Authentication credentials (stored in Secret Manager) */
  credentials?: {
    secretName?: string;
    secretVersion?: string;
    envVar?: string;
  };
  /** Additional auth options */
  options?: Record<string, unknown>;
}

export interface MCPHealthCheckConfig {
  /** Health check interval in milliseconds */
  interval: number;
  /** Health check timeout in milliseconds */
  timeout: number;
  /** Number of failed checks before marking unhealthy */
  failureThreshold: number;
  /** Health check endpoint/method */
  endpoint?: string;
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
  version: string;
  /** Default connection timeout */
  defaultTimeout: number;
  /** Global retry settings */
  defaultRetry: {
    attempts: number;
    delay: number;
    backoff: 'linear' | 'exponential';
  };
  /** Health monitoring settings */
  healthMonitoring: {
    enabled: boolean;
    interval: number;
    alertThreshold: number;
  };
  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destination: 'console' | 'file' | 'gcp-logging';
    includeRequestResponse: boolean;
  };
  /** Security settings */
  security: {
    enableTLS: boolean;
    validateCertificates: boolean;
    maxRequestSize: number;
  };
}

export interface MCPEnvironmentConfig {
  /** Environment name */
  environment: string;
  /** List of server configurations */
  servers: MCPServerConfig[];
  /** Global configuration */
  global: MCPGlobalConfig;
  /** Environment-specific secrets */
  secrets?: {
    gcpProjectId: string;
    secretManagerPrefix: string;
  };
}

/**
 * Default MCP configuration values
 * NOTE: For server-specific configurations, please refer to `server-config.defaults.ts`.
 */
export const DEFAULT_MCP_CONFIG: Partial<MCPGlobalConfig> = {
  version: '1.0.0',
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
