/**
 * @fileoverview gcp-auth-secret-manager module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Cache clients to avoid creating multiple instances
const clientCache = new Map<string, SecretManagerServiceClient>();

/**
 * Get Secret Manager client
 */
export function getSecretManagerClient(): SecretManagerServiceClient {
  const cacheKey = 'secretmanager';

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as SecretManagerServiceClient;
  }

  const client = new SecretManagerServiceClient();
  clientCache.set(cacheKey, client);
  return client;
}

export { SecretManagerServiceClient };
