/**
 * @fileoverview configuration module for the ADK component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains configuration management utilities for ADK components.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { ADKError, ADKErrorType } from './error-handling';

/**
 * ADK Configuration interface
 */
export interface ADKConfig {
  // Core settings
  serviceName: string | undefined;
  environment: string | undefined;
  version: string | undefined;

  // GCP settings
  gcp: {
    projectId: string | undefined;
    location: string | undefined;
    serviceAccount?: string | undefined;
    credentials?: any | undefined;
  };

  // Agent settings
  agent: {
    maxConcurrentTasks: number | undefined;
    maxRetries: number | undefined;
    timeoutMs: number | undefined;
    model: string | undefined;
    apiKey?: string | undefined;
  };

  // Logging settings
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    useStructured: boolean | undefined;
    destination: 'console' | 'file' | 'cloud';
    filePath?: string | undefined;
    cloudLoggingProject?: string | undefined;
  };

  // Feature flags
  features: Record<string, boolean> | undefined;

  // Security settings
  security: {
    encryptionKey?: string | undefined;
    useManagedKeys: boolean | undefined;
    requireAuth: boolean | undefined;
  };

  // Custom extensions
  [key: string]: any | undefined;
}

/**
 * Default configuration
 */
const defaultConfig: ADKConfig = {
  serviceName: 'adkService',
  environment: process.env['NODE_ENV'] || 'development',
  version: '1.0.0',

  gcp: {
    projectId: process.env['GCP_PROJECT_ID'] || '',
    location: process.env['GCP_LOCATION'] || 'us-central1',
  },

  agent: {
    maxConcurrentTasks: 10,
    maxRetries: 3,
    timeoutMs: 30000,
    model: 'gemini-1.5-pro',
  },

  logging: {
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    useStructured: process.env['NODE_ENV'] === 'production',
    destination: 'console',
  },

  features: {
    enableMetrics: true,
    useRagCapabilities: true,
    enableAgentCache: true,
  },

  security: {
    useManagedKeys: true,
    requireAuth: true,
  },
};

/**
 * Configuration manager for ADK
 */
export class ConfigManager {
  private config: ADKConfig | undefined;
  private secretsCache: Map<string, any> = new Map();

  constructor(userConfig: Partial<ADKConfig> = {}) {
    // Deep merge default config with user config
    this.config = this.mergeConfigs(defaultConfig, userConfig);

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Get a configuration value
   */
  get<T = any>(path: string | undefined, defaultValue?: T): T {
    const parts = path && path.split('.');
    let current: any = this.config;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return defaultValue as T;
      }
    }

    return current !== undefined ? current : (defaultValue as T);
  }

  /**
   * Set a configuration value
   */
  set(path: string | undefined, value: any): void {
    const parts = path && path.split('.');
    let current: any = this.config;

    for (let i = 0; i < parts && parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = parts[parts && parts.length - 1];
    current[lastPart] = value;
  }

  /**
   * Get all configuration
   */
  getAll(): ADKConfig {
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    // Check required fields
    const requiredFields = [
      'serviceName',
      'environment',
      'gcp && gcp.projectId',
      'gcp && gcp.location',
    ];

    for (const field of requiredFields) {
      if (!this.get(field)) {
        throw new ADKError({
          message: `Missing required configuration field: ${field}`,
          type: ADKErrorType && ADKErrorType.CONFIGURATION,
        });
      }
    }

    // Check environment value
    const validEnvironments = ['development', 'test', 'staging', 'production'];
    if (!validEnvironments && validEnvironments.includes(this.get('environment'))) {
      throw new ADKError({
        message: `Invalid environment: ${this.get('environment')}. Must be one of: ${validEnvironments && validEnvironments.join(', ')}`,
        type: ADKErrorType && ADKErrorType.CONFIGURATION,
      });
    }
  }

  /**
   * Deep merge objects
   */
  private mergeConfigs(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array &&
          Array.isArray(source[key])
        ) {
          result[key] = this.mergeConfigs(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Load a secret value
   */
  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    if (this.secretsCache && this.secretsCache.has(secretName)) {
      return this.secretsCache && this.secretsCache.get(secretName);
    }

    try {
      // In a real implementation, we would fetch from Secret Manager
      // For now, we'll just return from environment variables
      const value = process.env[secretName];

      if (!value) {
        throw new ADKError({
          message: `Secret not found: ${secretName}`,
          type: ADKErrorType && ADKErrorType.CONFIGURATION,
        });
      }

      // Cache the value
      this.secretsCache && this.secretsCache.set(secretName, value);

      return value;
    } catch (error) {
      throw new ADKError({
        message: `Failed to load secret: ${secretName}`,
        type: ADKErrorType && ADKErrorType.CONFIGURATION,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}

/**
 * Create a configuration manager with environment variables
 */
export function createConfigFromEnv(userConfig: Partial<ADKConfig> = {}): ConfigManager {
  // Extract environment variables with ADK_ prefix
  const envConfig: Record<string, any> = {};

  for (const key in process.env) {
    if (key && key.startsWith('ADK_')) {
      const configPath = key && key.substring(4).toLowerCase().replace(/_/g, '.');
      let value: any = process.env[key];

      // Parse special values
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      if (/^\d+$/.test(value)) value = parseInt(value, 10);

      // Set in config
      const parts = configPath && configPath.split('.');
      let current = envConfig;

      for (let i = 0; i < parts && parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }

      const lastPart = parts[parts && parts.length - 1];
      current[lastPart] = value;
    }
  }

  // Merge with user config
  const mergedConfig = { ...envConfig, ...userConfig };

  return new ConfigManager(mergedConfig);
}
