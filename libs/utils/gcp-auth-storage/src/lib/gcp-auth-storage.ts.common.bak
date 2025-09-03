/**
 * @fileoverview gcp-auth-storage module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { Storage } from '@google-cloud/storage';
import { GcpInitializationError, getProjectId } from '@nx-monorepo/gcp-core';

// Cache clients to avoid creating multiple instances
const clientCache = new Map<string, any>();

/**
 * Get Storage client
 * @param projectId Optional project ID
 */
export function getStorageClient(projectId?: string): Storage {
  const cacheKey = `storage:${projectId || 'default'}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as Storage;
  }

  const client = new Storage({ projectId });
  clientCache.set(cacheKey, client);
  return client;
}

export { Storage };
