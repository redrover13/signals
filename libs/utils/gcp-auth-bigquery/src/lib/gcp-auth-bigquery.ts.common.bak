/**
 * @fileoverview gcp-auth-bigquery module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { BigQuery } from '@google-cloud/bigquery';
import { GcpInitializationError, getProjectId } from '@nx-monorepo/gcp-core';

// Cache clients to avoid creating multiple instances
const clientCache = new Map<string, any>();

/**
 * Get BigQuery client
 * @param projectId Optional project ID
 */
export function getBigQueryClient(projectId?: string): BigQuery {
  const cacheKey = `bigquery:${projectId || 'default'}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as BigQuery;
  }

  const client = new BigQuery({ projectId });
  clientCache.set(cacheKey, client);
  return client;
}

export { BigQuery };
