/**
 * @fileoverview secrets-manager utility
 *
 * TypeScript utility for managing Google Cloud Secret Manager secrets
 * Provides programmatic access to secrets with proper error handling
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { DulceSecretManager, getSecretManager } from '@dulce-de-saigon/security';

/**
 * Secret configuration interface
 */
export interface SecretConfig {
  name: string;
  description: string;
  envVar: string;
  required: boolean;
  defaultValue?: string;
}

/**
 * Predefined secrets configuration for Dulce de Saigon platform
 */
export const DULCE_SECRETS: SecretConfig[] = [
  {
    name: 'github-token',
    description: 'GitHub Personal Access Token',
    envVar: 'GITHUB_TOKEN',
    required: true,
  },
  {
    name: 'codacy-token',
    description: 'Codacy API Token',
    envVar: 'CODACY_API_TOKEN',
    required: true,
  },
  {
    name: 'codacy-account-token',
    description: 'Codacy Account Token',
    envVar: 'CODACY_ACCOUNT_TOKEN',
    required: true,
  },
  {
    name: 'nx-cloud-token',
    description: 'NX Cloud Access Token',
    envVar: 'NX_CLOUD_ACCESS_TOKEN',
    required: false,
  },
  {
    name: 'sentry-token',
    description: 'Sentry Auth Token',
    envVar: 'SENTRY_AUTH_TOKEN',
    required: true,
  },
  {
    name: 'tavily-api-key',
    description: 'Tavily AI Search API Key',
    envVar: 'TAVILY_API_KEY',
    required: true,
  },
  {
    name: 'qdrant-api-key',
    description: 'Qdrant Vector Database API Key',
    envVar: 'QDRANT_API_KEY',
    required: true,
  },
  {
    name: 'qdrant-url',
    description: 'Qdrant Vector Database URL',
    envVar: 'QDRANT_URL',
    required: true,
  },
  {
    name: 'dictl-dop-token',
    description: 'DigitalOcean Personal Access Token',
    envVar: 'DIGITALOCEAN_ACCESS_TOKEN',
    required: false,
  },
  {
    name: 'gitguardian-token',
    description: 'GitGuardian API Token',
    envVar: 'GITGUARDIAN_API_TOKEN',
    required: false,
  },
  {
    name: 'smither-token',
    description: 'Smither API Token',
    envVar: 'SMITHER_API_TOKEN',
    required: false,
  },
  {
    name: 'google-api-key',
    description: 'Google API Key',
    envVar: 'GOOGLE_API_KEY',
    required: false,
  },
  {
    name: 'google-cse-id',
    description: 'Google Custom Search Engine ID',
    envVar: 'GOOGLE_CSE_ID',
    required: false,
  },
  {
    name: 'brave-api-key',
    description: 'Brave Search API Key',
    envVar: 'BRAVE_API_KEY',
    required: false,
  },
  {
    name: 'gcp-project-id',
    description: 'GCP Project ID',
    envVar: 'GCP_PROJECT_ID',
    required: true,
  },
  {
    name: 'postgres-connection',
    description: 'PostgreSQL Connection String',
    envVar: 'POSTGRES_CONNECTION_STRING',
    required: false,
  },
  {
    name: 'jwt-secret',
    description: 'JWT Secret for token signing',
    envVar: 'JWT_SECRET',
    required: true,
  },
  {
    name: 'dulce-api-key',
    description: 'Dulce de Saigon API Key',
    envVar: 'DULCE_API_KEY',
    required: true,
  },
];

/**
 * Secrets manager utility class
 */
export class SecretsManager {
  private secretManager: DulceSecretManager;

  constructor() {
    this.secretManager = getSecretManager();
  }

  /**
   * Get a secret value by name
   */
  async getSecret(name: string): Promise<string> {
    return this.secretManager.getSecret(name);
  }

  /**
   * Get multiple secrets in parallel
   */
  async getSecrets(names: string[]): Promise<Record<string, string>> {
    return this.secretManager.getSecrets(names);
  }

  /**
   * Get all required secrets
   */
  async getAllRequiredSecrets(): Promise<Record<string, string>> {
    const requiredSecrets = DULCE_SECRETS.filter(s => s.required).map(s => s.name);
    return this.getSecrets(requiredSecrets);
  }

  /**
   * Get secret with fallback to environment variable
   */
  async getSecretWithFallback(secretName: string, envVar: string): Promise<string> {
    // First try environment variable
    const envValue = process.env[envVar];
    if (envValue) {
      return envValue;
    }

    // Fall back to Secret Manager
    return this.getSecret(secretName);
  }

  /**
   * Validate that all required secrets are available
   */
  async validateRequiredSecrets(): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const secret of DULCE_SECRETS.filter(s => s.required)) {
      try {
        // Check if environment variable is set
        if (process.env[secret.envVar]) {
          continue;
        }

        // Check if secret exists in Secret Manager
        await this.getSecret(secret.name);
      } catch (error) {
        missing.push(secret.name);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Load application configuration from secrets
   */
  async loadAppConfig(): Promise<Record<string, string>> {
    const config: Record<string, string> = {};

    for (const secret of DULCE_SECRETS) {
      try {
        config[secret.envVar] = await this.getSecretWithFallback(secret.name, secret.envVar);
      } catch (error) {
        if (secret.required) {
          throw new Error(`Required secret ${secret.name} not found: ${error}`);
        }
        // For optional secrets, use default value or skip
        if (secret.defaultValue) {
          config[secret.envVar] = secret.defaultValue;
        }
      }
    }

    return config;
  }

  /**
   * Clear secret cache (useful for testing)
   */
  clearCache(): void {
    this.secretManager.clearCache();
  }
}

// Export singleton instance
export const secretsManager = new SecretsManager();

// Export convenience functions
export async function getSecret(name: string): Promise<string> {
  return secretsManager.getSecret(name);
}

export async function getSecrets(names: string[]): Promise<Record<string, string>> {
  return secretsManager.getSecrets(names);
}

export async function loadAppConfig(): Promise<Record<string, string>> {
  return secretsManager.loadAppConfig();
}

export async function validateSecrets(): Promise<{ valid: boolean; missing: string[] }> {
  return secretsManager.validateRequiredSecrets();
}
