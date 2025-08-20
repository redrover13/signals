/**
 * Environment Configuration Manager
 * Handles environment-specific MCP configurations
 */

import { MCPEnvironmentConfig, MCPGlobalConfig, DEFAULT_MCP_CONFIG } from './mcp-config.schema';
import { MCP_SERVER_REGISTRY } from './server-registry';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Get current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env['NODE_ENV'] || process.env['ENVIRONMENT'] || 'development';
  return env as Environment;
}

/**
 * Development environment configuration
 */
const DEVELOPMENT_CONFIG: MCPEnvironmentConfig = {
  environment: 'development',
  servers: Object.values(MCP_SERVER_REGISTRY).map((server) => ({
    ...server,
    // Enable more servers in development for testing
    enabled:
      server.category === 'core' ||
      server.category === 'development' ||
      server.category === 'data' ||
      server.enabled,
    // Shorter timeouts for faster feedback
    connection: {
      ...server.connection,
      timeout: Math.min(server.connection.timeout || 30000, 15000),
    },
    // More frequent health checks in development
    healthCheck: server.healthCheck
      ? {
          ...server.healthCheck,
          interval: Math.min(server.healthCheck.interval ?? 60000, 60000),
        }
      : undefined,
  })),
  global: {
    ...DEFAULT_MCP_CONFIG,
    logging: {
      level: 'debug',
      destination: 'console',
      includeRequestResponse: true,
    },
    healthMonitoring: {
      enabled: true,
      interval: 30000, // 30 seconds
      alertThreshold: 2,
    },
  } as MCPGlobalConfig,
  secrets: {
    gcpProjectId: process.env['GCP_PROJECT_ID'] || 'signals-dev',
    secretManagerPrefix: 'mcp-dev',
  },
};

/**
 * Staging environment configuration
 */
const STAGING_CONFIG: MCPEnvironmentConfig = {
  environment: 'staging',
  servers: Object.values(MCP_SERVER_REGISTRY).map((server) => ({
    ...server,
    // Enable most servers in staging
    enabled:
      server.category !== 'testing' &&
      (server.enabled || server.category === 'core' || server.category === 'development'),
    // Standard timeouts
    connection: {
      ...server.connection,
      timeout: server.connection.timeout || 30000,
    },
  })),
  global: {
    ...DEFAULT_MCP_CONFIG,
    logging: {
      level: 'info',
      destination: 'gcp-logging',
      includeRequestResponse: false,
    },
    healthMonitoring: {
      enabled: true,
      interval: 60000, // 1 minute
      alertThreshold: 3,
    },
  } as MCPGlobalConfig,
  secrets: {
    gcpProjectId: process.env['GCP_PROJECT_ID'] || 'signals-staging',
    secretManagerPrefix: 'mcp-staging',
  },
};

/**
 * Production environment configuration
 */
const PRODUCTION_CONFIG: MCPEnvironmentConfig = {
  environment: 'production',
  servers: Object.values(MCP_SERVER_REGISTRY).map((server) => ({
    ...server,
    // Only enable essential and explicitly enabled servers in production
    enabled:
      server.enabled &&
      (server.category === 'core' ||
        server.category === 'development' ||
        server.category === 'data' ||
        server.category === 'platforms'),
    // Longer timeouts for stability
    connection: {
      ...server.connection,
      timeout: Math.max(server.connection.timeout || 30000, 30000),
      retry: {
        attempts: 5,
        delay: 2000,
        backoff: 'exponential',
      },
    },
    // Less frequent health checks to reduce load
    healthCheck: server.healthCheck
      ? {
          ...server.healthCheck,
          interval: Math.max(server.healthCheck.interval, 300000), // At least 5 minutes
          failureThreshold: Math.max(server.healthCheck.failureThreshold, 5),
        }
      : undefined,
  })),
  global: {
    ...DEFAULT_MCP_CONFIG,
    logging: {
      level: 'warn',
      destination: 'gcp-logging',
      includeRequestResponse: false,
    },
    healthMonitoring: {
      enabled: true,
      interval: 300000, // 5 minutes
      alertThreshold: 5,
    },
    security: {
      enableTLS: true,
      validateCertificates: true,
      maxRequestSize: 5242880, // 5MB (smaller in production)
    },
  } as MCPGlobalConfig,
  secrets: {
    gcpProjectId: process.env['GCP_PROJECT_ID'] || 'signals-prod',
    secretManagerPrefix: 'mcp-prod',
  },
};

/**
 * Test environment configuration
 */
const TEST_CONFIG: MCPEnvironmentConfig = {
  environment: 'test',
  servers: Object.values(MCP_SERVER_REGISTRY).map((server) => ({
    ...server,
    // Only enable core servers and testing servers
    enabled:
      server.category === 'core' || server.category === 'testing' || server.id === 'everything',
    // Very short timeouts for fast tests
    connection: {
      ...server.connection,
      timeout: 5000,
      retry: {
        attempts: 1,
        delay: 100,
        backoff: 'linear',
      },
    },
    // Disable health checks in tests
    healthCheck: undefined,
  })),
  global: {
    ...DEFAULT_MCP_CONFIG,
    defaultTimeout: 5000,
    logging: {
      level: 'error',
      destination: 'console',
      includeRequestResponse: false,
    },
    healthMonitoring: {
      enabled: false,
      interval: 0,
      alertThreshold: 0,
    },
  } as MCPGlobalConfig,
  secrets: {
    gcpProjectId: 'signals-test',
    secretManagerPrefix: 'mcp-test',
  },
};

/**
 * Environment configurations map
 */
const ENVIRONMENT_CONFIGS: Record<Environment, MCPEnvironmentConfig> = {
  development: DEVELOPMENT_CONFIG,
  staging: STAGING_CONFIG,
  production: PRODUCTION_CONFIG,
  test: TEST_CONFIG,
};

/**
 * Get configuration for current environment
 */
export function getCurrentConfig(): MCPEnvironmentConfig {
  const env = getCurrentEnvironment();
  return getConfigForEnvironment(env);
}

/**
 * Get configuration for specific environment
 */
export function getConfigForEnvironment(environment: Environment): MCPEnvironmentConfig {
  const config = ENVIRONMENT_CONFIGS[environment];
  if (!config) {
    throw new Error(`No configuration found for environment: ${environment}`);
  }
  return config;
}

/**
 * Validate environment configuration
 */
export function validateConfig(config: MCPEnvironmentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate basic structure
  if (!config.environment) {
    errors.push('Environment name is required');
  }

  if (!config.servers || !Array.isArray(config.servers)) {
    errors.push('Servers configuration is required and must be an array');
  }

  if (!config.global) {
    errors.push('Global configuration is required');
  }

  // Validate servers
  if (config.servers) {
    config.servers.forEach((server, index) => {
      if (!server.id) {
        errors.push(`Server at index ${index} is missing required 'id' field`);
      }
      if (!server.name) {
        errors.push(`Server '${server.id}' is missing required 'name' field`);
      }
      if (!server.connection || !server.connection.endpoint) {
        errors.push(`Server '${server.id}' is missing connection endpoint`);
      }
      if (server.priority < 1 || server.priority > 10) {
        errors.push(`Server '${server.id}' priority must be between 1 and 10`);
      }
    });
  }

  // Validate global config
  if (config.global) {
    if (!config.global.version) {
      errors.push('Global configuration is missing version');
    }
    if (config.global.defaultTimeout && config.global.defaultTimeout < 1000) {
      errors.push('Default timeout must be at least 1000ms');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get servers enabled for current environment
 */
export function getEnabledServersForEnvironment(environment?: Environment): string[] {
  const env = environment || getCurrentEnvironment();
  const config = getConfigForEnvironment(env);
  return config.servers
    .filter((server) => server.enabled)
    .sort((a, b) => b.priority - a.priority)
    .map((server) => server.id);
}

/**
 * Check if server is enabled in current environment
 */
export function isServerEnabled(serverId: string, environment?: Environment): boolean {
  const enabledServers = getEnabledServersForEnvironment(environment);
  return enabledServers.includes(serverId);
}

/**
 * Get environment-specific server configuration
 */
export function getServerConfigForEnvironment(serverId: string, environment?: Environment) {
  const env = environment || getCurrentEnvironment();
  const config = getConfigForEnvironment(env);
  return config.servers.find((server) => server.id === serverId);
}
