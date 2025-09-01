/**
 * @fileoverview gcp-auth-firestore module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { Firestore } from '@google-cloud/firestore';
import { GcpInitializationError, getProjectId } from '@nx-monorepo/gcp-core';

// Cache clients to avoid creating multiple instances
const clientCache = new Map<string, any>();

/**
 * Get Firestore client
 * @param projectId Optional project ID
 */
export function getFirestoreClient(projectId?: string): Firestore {
  const cacheKey = `firestore:${projectId || 'default'}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as Firestore;
  }

  const client = new Firestore({ projectId });
  clientCache.set(cacheKey, client);
  return client;
}

export { Firestore };
