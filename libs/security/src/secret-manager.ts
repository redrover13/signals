/**
 * Google Cloud Secret Manager integration for Dulce de Saigon F&B Platform
 * Provides secure credential management following Vietnamese data privacy requirements
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { getProjectId } from '@dulce/gcp';

export class DulceSecretManager {
  private client: SecretManagerServiceClient;
  private projectId: string;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = new SecretManagerServiceClient();
    this.projectId = getProjectId();
  }

  /**
   * Get a secret value from Google Cloud Secret Manager
   * Implements caching for performance while maintaining security
   */
  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await this.client.accessSecretVersion({ name });
      
      if (!version.payload?.data) {
        throw new Error(`Secret ${secretName} has no data`);
      }

      const secretValue = version.payload.data.toString();
      
      // Cache the secret value
      this.cache.set(secretName, {
        value: secretValue,
        expiresAt: Date.now() + this.CACHE_TTL,
      });

      return secretValue;
    } catch (error) {
      console.error(`Failed to access secret ${secretName}:`, error);
      throw new Error(`Unable to retrieve secret: ${secretName}`);
    }
  }

  /**
   * Get multiple secrets in parallel
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string>> {
    const promises = secretNames.map(async (name) => {
      const value = await this.getSecret(name);
      return { name, value };
    });

    const results = await Promise.all(promises);
    return results.reduce((acc, { name, value }) => {
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Clear cached secrets (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if a secret exists in Secret Manager
   */
  async secretExists(secretName: string): Promise<boolean> {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}`;
      await this.client.getSecret({ name });
      return true;
    } catch (error) {
      if ((error as any)?.code === 5) { // NOT_FOUND
        return false;
      }
      throw error;
    }
  }
}

// Singleton instance for the application
let secretManagerInstance: DulceSecretManager | null = null;

/**
 * Get the singleton Secret Manager instance
 */
export function getSecretManager(): DulceSecretManager {
  if (!secretManagerInstance) {
    secretManagerInstance = new DulceSecretManager();
  }
  return secretManagerInstance;
}

/**
 * Helper function to get environment variable or secret from Secret Manager
 * Prioritizes environment variables for development, falls back to Secret Manager for production
 */
export async function getConfig(key: string, secretName?: string): Promise<string> {
  // First try environment variable
  const envValue = process.env[key];
  if (envValue) {
    return envValue;
  }

  // Fall back to Secret Manager if secret name is provided
  if (secretName) {
    const secretManager = getSecretManager();
    return await secretManager.getSecret(secretName);
  }

  throw new Error(`Configuration key ${key} not found in environment or Secret Manager`);
}

/**
 * Load all required configuration for the application
 */
export async function loadAppConfig(): Promise<{
  gcpProjectId: string;
  gcpLocation: string;
  vertexAiEndpointId: string;
  dulceApiKey: string;
  jwtSecret: string;
}> {
  try {
    const [
      gcpProjectId,
      gcpLocation,
      vertexAiEndpointId,
      dulceApiKey,
      jwtSecret,
    ] = await Promise.all([
      getConfig('GCP_PROJECT_ID'),
      getConfig('GCP_LOCATION'),
      getConfig('VERTEX_AI_ENDPOINT_ID'),
      getConfig('DULCE_API_KEY', 'DULCE_API_KEY'),
      getConfig('JWT_SECRET', 'JWT_SECRET'),
    ]);

    return {
      gcpProjectId,
      gcpLocation,
      vertexAiEndpointId,
      dulceApiKey,
      jwtSecret,
    };
  } catch (error) {
    console.error('Failed to load application configuration:', error);
    throw new Error('Application configuration is incomplete. Check environment variables and Secret Manager.');
  }
}