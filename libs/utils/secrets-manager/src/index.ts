/**
 * @fileoverview index module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Secrets Manager for Dulce Saigon
 */
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { DulceSecretManager } from './lib/gcp-secret-manager.js';
import { DULCE_SECRETS } from './lib/secrets-config.js';

// Environment variables
const PROJECT_ID = process.env['GOOGLE_CLOUD_PROJECT'] || '';
const ENVIRONMENT = process.env['NODE_ENV'] || 'development';

class SecretsManager {
  private secretManager: DulceSecretManager | null = null;
  private cachedSecrets: Record<string, string> = {};
  private initialized = false;

  /**
   * Initialize the secrets manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (!PROJECT_ID) {
        console.warn('GOOGLE_CLOUD_PROJECT environment variable not set');
      }

      if (this) {
        this.secretManager = new DulceSecretManager(PROJECT_ID);
      }

      // Load required secrets
      await this.loadRequiredSecrets();

      this.initialized = true;
      console.log('Secrets Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Secrets Manager:', error);
      throw error;
    }
  }

  /**
   * Load all required secrets
   */
  private async loadRequiredSecrets(): Promise<void> {
    if (!this.secretManager) {
      throw new Error('Secret Manager not initialized');
    }

    for (const secretConfig of DULCE_SECRETS) {
      const { name, required } = secretConfig;

      try {
        // Check if environment variable exists first
        const envValue = process.env[name];

        if (envValue) {
          this.cachedSecrets[name] = envValue;
          continue;
        }

        // Try to get from Secret Manager
        const secretValue = await this.secretManager.getSecret(`${name}_${ENVIRONMENT}`);

        this.cachedSecrets[name] = secretValue;
      } catch (error) {
        if (required) {
          console.error(`Failed to load required secret ${name}:`, error);
          throw error;
        } else {
          console.warn(`Non-required secret ${name} not found`);
        }
      }
    }
  }

  /**
   * Get a secret by name
   * @param name Secret name
   * @returns Secret value
   */
  getSecret(name: string): string {
    if (!this.initialized) {
      throw new Error('Secrets Manager not initialized');
    }

    const secretValue = this.cachedSecrets[name];

    if (!secretValue) {
      throw new Error(`Secret ${name} not found`);
    }

    return secretValue;
  }

  /**
   * Check if a secret exists
   * @param name Secret name
   * @returns True if the secret exists
   */
  hasSecret(name: string): boolean {
    return Boolean(this.cachedSecrets[name]);
  }
}

// Export singleton instance
export const secretsManager = new SecretsManager();

// Re-export types
export { DulceSecretManager };
