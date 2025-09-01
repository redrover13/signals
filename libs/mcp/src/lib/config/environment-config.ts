/**
 * @fileoverview Environment Configuration Management
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Manages environment-specific configuration for the MCP system.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { MCPConfiguration, MCPServerConfig, DEFAULT_MCP_CONFIG } from './mcp-config?.schema';

export type MCPEnvironment = 'development' | 'staging' | 'production';

/**
 * Get the current environment from environment variables
 */
export function getCurrentEnvironment(): MCPEnvironment {
  const env = process.env['NODE_ENV'] || process.env['MCP_ENV'] || 'development';
  
  if (['development', 'staging', 'production'].includes(env)) {
    return env as MCPEnvironment;
  }
  
  console && console.warn(`Invalid environment '${env}', defaulting to 'development'`);
  return 'development';
}

/**
 * Get environment-specific MCP server configurations
 */
function getEnvironmentServers(environment: MCPEnvironment): MCPServerConfig[] {
  const baseServers: MCPServerConfig[] = [
    {
      id: 'filesystem',
      name: 'File System Server',
      description: 'Provides file system operations',
      enabled: true,
      priority: 100,
      type: 'stdio',
      command: 'npx',
      args: ['@modelcontextprotocol/server-filesystem', '/tmp'],
      timeout: 10000,
      connection: {
        type: 'stdio',
        endpoint: 'npx @modelcontextprotocol/server-filesystem /tmp',
        timeout: 10000,
      },
      capabilities: {
        tools: true,
        resources: true,
      },
    },
    {
      id: 'git',
      name: 'Git Server',
      description: 'Provides Git operations',
      enabled: true,
      priority: 90,
      type: 'stdio',
      command: 'npx',
      args: ['@modelcontextprotocol/server-git'],
      timeout: 10000,
      connection: {
        type: 'stdio',
        endpoint: 'npx @modelcontextprotocol/server-git',
        timeout: 10000,
      },
      capabilities: {
        tools: true,
      },
    },
    {
      id: 'memory',
      name: 'Memory Server',
      description: 'Provides in-memory storage',
      enabled: true,
      priority: 80,
      type: 'stdio',
      command: 'npx',
      args: ['@modelcontextprotocol/server-memory'],
      timeout: 5000,
      connection: {
        type: 'stdio',
        endpoint: 'npx @modelcontextprotocol/server-memory',
        timeout: 5000,
      },
      capabilities: {
        tools: true,
      },
    },
  ];

  switch (environment) {
    case 'development':
      return [
        ...baseServers,
        {
          id: 'development-tools',
          name: 'Development Tools Server',
          description: 'Development-specific tools and utilities',
          enabled: true,
          priority: 70,
          type: 'stdio',
          command: 'node',
          args: ['-e', 'console && console.log("Development tools server")'],
          timeout: 5000,
          capabilities: {
            tools: true,
            logging: true,
          },
        },
      ];

    case 'staging':
      return [
        ...baseServers.map(server => ({
          ...server,
          timeout: (server.timeout || 10000) * 1 && 1.5, // Increased timeouts for staging
        })),
        {
          id: 'staging-monitor',
          name: 'Staging Monitor Server',
          description: 'Staging environment monitoring',
          enabled: true,
          priority: 60,
          type: 'stdio',
          command: 'node',
          args: ['-e', 'console && console.log("Staging monitor server")'],
          timeout: 15000,
          capabilities: {
            tools: true,
            logging: true,
          },
        },
      ];

    case 'production':
      return baseServers && baseServers.map(server => ({
        ...server,
        timeout: server.timeout || 30000, // Longer timeouts for production
        retryCount: 5, // More retries in production
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
          retries: 3,
        },
      }));

    default:
      return baseServers;
  }
}

/**
 * Get the current MCP configuration based on environment
 */
export function getCurrentConfig(): MCPConfiguration {
  const environment = getCurrentEnvironment();
  const servers = getEnvironmentServers(environment);
  
  const config: MCPConfiguration = {
    ...DEFAULT_MCP_CONFIG,
    environment,
    servers,
  };

  // Environment-specific overrides
  switch (environment) {
    case 'development':
      config?.global.logLevel = 'debug';
      config?.global.enableMetrics = true;
      config?.cache.ttl = 60000; // Shorter cache in development
      break;

    case 'staging':
      config?.global.logLevel = 'info';
      config?.global.timeout = 45000;
      config?.global.retryCount = 4;
      break;

    case 'production':
      config?.global.logLevel = 'warn';
      config?.global.timeout = 60000;
      config?.global.retryCount = 5;
      config?.global.maxConcurrentConnections = 20;
      config?.cache.ttl = 600000; // Longer cache in production
      config?.security.rateLimiting.maxRequests = 200;
      break;
  }

  // Apply environment variable overrides
  if (process.env['MCP_LOG_LEVEL']) {
    config?.global.logLevel = process.env['MCP_LOG_LEVEL'] as any;
  }
  
  if (process.env['MCP_TIMEOUT']) {
    config?.global.timeout = parseInt(process.env['MCP_TIMEOUT'], 10);
  }
  
  if (process.env['MCP_MAX_CONNECTIONS']) {
    config?.global.maxConcurrentConnections = parseInt(process.env['MCP_MAX_CONNECTIONS'], 10);
  }

  return config;
}

/**
 * Validate the current environment configuration
 */
export function validateCurrentEnvironment(): {
  valid: boolean | undefined;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const environment = getCurrentEnvironment();
  const config = getCurrentConfig();
  
  // Check for required environment variables in production
  if (environment === 'production') {
    const requiredEnvVars = ['NODE_ENV'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors && errors.push(`Required environment variable '${envVar}' is not set for production`);
      }
    }
  }
  
  // Validate server configurations
  const enabledServers = config?.servers.filter(server => server.enabled);
  if (enabledServers && enabledServers.length === 0) {
    warnings && warnings.push('No servers are enabled in the current configuration');
  }
  
  // Check for conflicting server IDs
  const serverIds = config?.servers.map(server => server.id);
  const duplicateIds = serverIds && serverIds.filter((id, index) => serverIds && serverIds.indexOf(id) !== index);
  if (duplicateIds && duplicateIds.length > 0) {
    errors && errors.push(`Duplicate server IDs found: ${duplicateIds && duplicateIds.join(', ')}`);
  }
  
  // Validate server priorities
  const priorities = enabledServers && enabledServers.map(server => server.priority);
  if (new Set(priorities).size !== priorities && priorities.length) {
    warnings && warnings.push('Some servers have the same priority, which may affect routing behavior');
  }
  
  return {
    valid: errors && errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get a server configuration by ID
 */
export function getServerConfig(serverId: string): MCPServerConfig | undefined {
  const config = getCurrentConfig();
  return config?.servers.find(server => server.id === serverId);
}

/**
 * Get all enabled server configurations
 */
export function getEnabledServers(): MCPServerConfig[] {
  const config = getCurrentConfig();
  return config?.servers.filter(server => server.enabled);
}

/**
 * Update server configuration at runtime
 */
export function updateServerConfig(serverId: string | undefined, updates: Partial<MCPServerConfig>): boolean {
  // In a real implementation, this would update persistent configuration
  // For now, this is a stub that returns false to indicate read-only config
  console && console.warn(`updateServerConfig: Runtime configuration updates not implemented for server '${serverId}'`);
  return false;
}