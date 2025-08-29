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

import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import { PredictionServiceClient, v1 } from '@google-cloud/aiplatform';
import { GoogleAuth } from 'google-auth-library';
import { memoize } from 'lodash';

export class GcpInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GcpInitializationError';
  }
}

const getProjectId = memoize((): string => {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new GcpInitializationError(
      'The GCP_PROJECT_ID environment variable is required but was not set. ' +
        'Please ensure it is provided in the runtime environment.',
    );
  }
  return projectId;
});

export async function getGoogleCloudCredentials(): Promise<{
  auth: GoogleAuth;
  projectId: string;
}> {
  try {
    const projectId = getProjectId();
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    return { auth, projectId };
  } catch (error) {
    let msg = 'An unknown error occurred while fetching GCP credentials.';
    if (error instanceof Error) msg = error.message;
    throw new GcpInitializationError(msg);
  }
}

export const getBigQueryClient = memoize((): BigQuery => {
  try {
    const projectId = getProjectId();
    return new BigQuery({ projectId });
  } catch (error) {
    let msg = 'Could not instantiate BigQuery client.';
    if (error instanceof Error) msg = error.message;
    throw new GcpInitializationError(msg);
  }
});

export const getStorageClient = memoize((): Storage => {
  try {
    const projectId = getProjectId();
    return new Storage({ projectId });
  } catch (error) {
    let msg = 'Could not instantiate Storage client.';
    if (error instanceof Error) msg = error.message;
    throw new GcpInitializationError(msg);
  }
});

export async function query(sql: string, params?: Record<string, unknown>) {
  const bigquery = getBigQueryClient();
  const [rows] = await bigquery.query({ query: sql, params });
  return rows;
}

export async function insertRows(datasetTable: string, rows: Array<Record<string, unknown>>) {
  const bigquery = getBigQueryClient();
  let datasetName = '';
  let tableName = '';
  if (datasetTable.includes('.')) {
    const parts = datasetTable.split('.');
    tableName = parts.pop() as string;
    datasetName = parts.join('.');
  } else if (datasetTable.includes('/')) {
    const parts = datasetTable.split('/');
    datasetName = parts[0];
    tableName = parts[1];
  } else {
    throw new Error('insertRows expects dataset.table or dataset/table');
  }

  const dataset = bigquery.dataset(datasetName);
  const table = dataset.table(tableName);
  const res: unknown = await (
    table as unknown as { insert: (r: unknown) => Promise<unknown> }
  ).insert(rows);
  return res;
}

export async function uploadString(path: string, contents: string | Buffer, contentType?: string) {
  const storage = getStorageClient();
  const firstSlash = path.indexOf('/');
  if (firstSlash === -1)
    throw new Error('uploadString expects path in the form "bucket/objectPath"');
  const bucketName = path.slice(0, firstSlash);
  const objectName = path.slice(firstSlash + 1);
  const file = storage.bucket(bucketName).file(objectName);
  await file.save(typeof contents === 'string' ? Buffer.from(contents) : contents, { contentType });
  return `gs://${bucketName}/${objectName}`;
}

export const getVertexAIClient = memoize(
  (options: { location: string }): v1.PredictionServiceClient => {
    try {
      getProjectId();
      return new PredictionServiceClient({
        apiEndpoint: `${options.location}-aiplatform.googleapis.com`,
      });
    } catch (error) {
      let msg = 'Could not instantiate Vertex AI client.';
      if (error instanceof Error) msg = error.message;
      throw new GcpInitializationError(msg);
    }
  },
);

export { getProjectId };

/**
 * Minimal Pub/Sub helpers for tests and local usage.
 * These are lightweight wrappers that can be replaced by full implementations.
 */
export function getPubSub() {
  // Minimal stub that resembles the @google-cloud/pubsub client enough for tests
  return {
    topic: (name: string) => ({
      publishMessage: async (msg: unknown) => {
        // no-op publish for tests
        return Promise.resolve({ messageId: 'test-message-id', name });
      },
    }),
  };
}

export async function ensureTopic(name: string) {
  // Minimal no-op implementation for tests
  return Promise.resolve(true);
}
