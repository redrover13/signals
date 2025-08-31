/**
 * @fileoverview Configuration service for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Manages environment variables and secrets for Gemini integration.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { createGeminiErrorHandler } from '../utils/error-handler';
import { ErrorCategory, ErrorSeverity, createError } from '@nx-monorepo/utils/monitoring';
import { MCPEnvironmentConfig, MCPServerConfig, DEFAULT_MCP_CONFIG } from './mcp-config.schema';

// Cache secrets for reuse
const secretCache = new Map<string, string>();

// Cache MCP server configs
let mcpConfigCache: MCPEnvironmentConfig | null = null;

/**
 * Configuration keys for the Gemini orchestrator
 */
export enum ConfigKeys {
  GEMINI_API_KEY = 'GEMINI_API_KEY',
  GEMINI_MODEL = 'GEMINI_MODEL',
  GEMINI_MAX_TOKENS = 'GEMINI_MAX_TOKENS',
  GEMINI_TEMPERATURE = 'GEMINI_TEMPERATURE',
  GEMINI_TOP_P = 'GEMINI_TOP_P',
  GEMINI_TOP_K = 'GEMINI_TOP_K',
  BIGQUERY_PROJECT_ID = 'BIGQUERY_PROJECT_ID',
  FIREBASE_PROJECT_ID = 'FIREBASE_PROJECT_ID',
  FIREBASE_COLLECTION = 'FIREBASE_COLLECTION',
  GCP_PROJECT_ID = 'GCP_PROJECT_ID',
  MCP_CONFIG_PATH = 'MCP_CONFIG_PATH',
  MCP_ENVIRONMENT = 'MCP_ENVIRONMENT'
}

/**
 * Configuration type for Gemini orchestrator
 */
export type GeminiConfig = {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  bigQueryProjectId: string;
  firebaseProjectId: string;
  firebaseCollection: string;
  gcpProjectId: string;
  mcpServers?: MCPServerConfig[];
  mcpEnvironment?: string;
};

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<GeminiConfig> = {
  model: 'gemini-1.5-pro-latest',
  maxTokens: 8192,
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  firebaseCollection: 'gemini-orchestrator'
};

/**
 * Secret manager client instance
 */
let secretManagerClient: SecretManagerServiceClient | null = null;

/**
 * Error handler for configuration service
 */
const errorHandler = createGeminiErrorHandler(
  'ConfigurationService',
  'config.service.ts'
);

/**
 * Initialize the secret manager client
 */
function initSecretManagerClient(): SecretManagerServiceClient {
  if (!secretManagerClient) {
    try {
      secretManagerClient = new SecretManagerServiceClient();
    } catch (error) {
      throw errorHandler(error as Error, { action: 'initSecretManagerClient' });
    }
  }
  return secretManagerClient;
}

/**
 * Get a secret from Secret Manager
 * @param secretName - Name of the secret
 * @param projectId - Google Cloud project ID
 * @returns - Secret value
 */
export async function getSecret(
  secretName: string,
  projectId: string
): Promise<string> {
  const cacheKey = `${projectId}-${secretName}`;
  
  // Check cache first
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey) as string;
  }
  
  try {
    const client = initSecretManagerClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    
    if (!version.payload?.data) {
      throw new Error(`Secret ${secretName} has no data`);
    }
    
    const secretValue = version.payload.data.toString();
    
    // Cache the secret
    secretCache.set(cacheKey, secretValue);
    
    return secretValue;
  } catch (error) {
    throw errorHandler(error as Error, { 
      secretName, 
      projectId,
      action: 'getSecret' 
    });
  }
}

/**
 * Get environment variable with fallback
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns - Environment variable value
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && defaultValue === undefined) {
    throw createError(
      `Missing required environment variable: ${key}`,
      ErrorCategory.CONFIGURATION,
      ErrorSeverity.HIGH,
      { key }
    );
  }
  
  return value || defaultValue || '';
}

/**
 * Load MCP server configurations
 */
/**
 * Load MCP configuration from environment or configuration file
 * @returns MCP environment configuration or null if not available
 */
export async function loadMCPConfig(): Promise<MCPEnvironmentConfig> {
  try {
    const mcpConfigPath = getEnvVar(ConfigKeys.MCP_CONFIG_PATH, './mcp.json');
    const mcpEnvironment = getEnvVar(ConfigKeys.MCP_ENVIRONMENT, 'development');
    
    // Return cached MCP configuration if available
    if (mcpConfigCache) {
      return mcpConfigCache;
    }
    
    // Try to load from file system
    let config: MCPEnvironmentConfig | null = null;
    
    try {
      const fs = await import('fs/promises');
      
      // Check if file exists
      try {
        await fs.access(mcpConfigPath);
        
        // Read and parse JSON file
        const fileContent = await fs.readFile(mcpConfigPath, 'utf-8');
        const rawConfig = JSON.parse(fileContent);
        
        // Validate the environment configuration
        if (rawConfig[mcpEnvironment]) {
          config = rawConfig[mcpEnvironment];
        } else if (rawConfig.servers) {
          // If the file doesn't have environments but has servers directly
          config = rawConfig;
        }
      } catch (fsError) {
        console.warn(`MCP config file ${mcpConfigPath} not found or invalid:`, fsError);
      }
    } catch (importError) {
      console.warn('File system module not available, using default configuration');
    }
    
    // If no config was loaded, use mock servers
    if (!config) {
      const mockServers: MCPServerConfig[] = [
        {
          id: 'core-default',
          name: 'Default Core Server',
          category: 'core',
          type: 'stdio',
          enabled: true,
          priority: 10,
          connection: {
            type: 'stdio',
            endpoint: 'mcp-core-server',
            timeout: 30000
          }
        },
        {
          id: 'data-bigquery',
          name: 'BigQuery Data Server',
          category: 'data',
          type: 'stdio',
          enabled: true,
          priority: 8,
          connection: {
            type: 'stdio',
            endpoint: 'mcp-bigquery-server',
            timeout: 30000
          }
        },
        {
          id: 'platforms-firebase',
          name: 'Firebase Platform Server',
          category: 'platforms',
          type: 'stdio',
          enabled: true,
          priority: 6,
          connection: {
            type: 'stdio',
            endpoint: 'mcp-firebase-server',
            timeout: 30000
          }
        }
      ];
      
      config = {
        environment: mcpEnvironment,
        servers: mockServers,
        global: {
          ...DEFAULT_MCP_CONFIG
        }
      };
    }
    
    // Cache the configuration
    mcpConfigCache = config;
    
    return config;
  } catch (error) {
    console.warn('Failed to load MCP configuration:', error);
    return {
      environment: 'development',
      servers: [],
      global: DEFAULT_MCP_CONFIG
    };
  }
}

/**
 * Load Gemini configuration from environment variables and secrets
 */
export async function loadGeminiConfig(): Promise<GeminiConfig> {
  try {
    // Get GCP project ID from environment
    const gcpProjectId = getEnvVar(ConfigKeys.GCP_PROJECT_ID);
    
    // Get API key from Secret Manager or environment
    let apiKey: string;
    try {
      apiKey = await getSecret('gemini-api-key', gcpProjectId);
    } catch (error) {
      // Fall back to environment variable
      apiKey = getEnvVar(ConfigKeys.GEMINI_API_KEY);
    }
    
    // Load MCP server configurations
    const mcpConfig = await loadMCPConfig();
    const mcpEnvironment = mcpConfig.environment || getEnvVar(ConfigKeys.MCP_ENVIRONMENT, 'development');
    
    // Get other configuration values
    return {
      apiKey,
      model: getEnvVar(ConfigKeys.GEMINI_MODEL, DEFAULT_CONFIG.model),
      maxTokens: parseInt(getEnvVar(ConfigKeys.GEMINI_MAX_TOKENS, String(DEFAULT_CONFIG.maxTokens))),
      temperature: parseFloat(getEnvVar(ConfigKeys.GEMINI_TEMPERATURE, String(DEFAULT_CONFIG.temperature))),
      topP: parseFloat(getEnvVar(ConfigKeys.GEMINI_TOP_P, String(DEFAULT_CONFIG.topP))),
      topK: parseInt(getEnvVar(ConfigKeys.GEMINI_TOP_K, String(DEFAULT_CONFIG.topK))),
      bigQueryProjectId: getEnvVar(ConfigKeys.BIGQUERY_PROJECT_ID, gcpProjectId),
      firebaseProjectId: getEnvVar(ConfigKeys.FIREBASE_PROJECT_ID, gcpProjectId),
      firebaseCollection: getEnvVar(ConfigKeys.FIREBASE_COLLECTION, DEFAULT_CONFIG.firebaseCollection),
      gcpProjectId,
      mcpServers,
      mcpEnvironment
    };
  } catch (error) {
    throw errorHandler(error as Error, { action: 'loadGeminiConfig' });
  }
}
