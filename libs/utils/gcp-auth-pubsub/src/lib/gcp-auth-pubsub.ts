/**
 * @fileoverview gcp-auth-pubsub module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { PubSub } from '@google-cloud/pubsub';
import { GcpInitializationError, getProjectId } from '@dulce/gcp-core';

// Cache clients to avoid creating multiple instances
const clientCache = new Map<string, any>();

/**
 * Get PubSub client
 * @param projectId Optional project ID
 */
export function getPubSubClient(projectId?: string): PubSub {
  const cacheKey = `pubsub:${projectId || 'default'}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as PubSub;
  }

  const client = new PubSub({ projectId });
  clientCache.set(cacheKey, client);
  return client;
}

export { PubSub };
