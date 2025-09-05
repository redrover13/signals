/**
 * @fileoverview gcp-auth-vertex-ai module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { v1, PredictionServiceClient } from '@google-cloud/aiplatform';
import { GcpInitializationError, getProjectId } from '@dulce/gcp-core';

// Cache clients to avoid creating multiple instances
const clientCache = new Map<string, any>();

/**
 * Get Vertex AI Prediction Service client
 * @param options Client options
 */
export function getPredictionServiceClient(options: {
  location: string;
}): v1.PredictionServiceClient {
  const cacheKey = `vertex:prediction:${options.location}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as v1.PredictionServiceClient;
  }

  const client = new v1.PredictionServiceClient(options);
  clientCache.set(cacheKey, client);
  return client;
}

export { v1 as VertexAI };
