/**
 * @fileoverview tools module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

interface BigQueryInput {
  sql: string;
  params?: Record<string, unknown>;
}

interface BigQueryInsertInput {
  table: string;
  rows: Record<string, unknown>[];
}

interface StorageUploadInput {
  path: string;
  contents: string;
  contentType?: string;
}

import { query, insertRows, uploadString } from '@dulce/gcp';

export const tools = {
  'bq.query': {
    name: 'bq.query',
    description: 'Run a BigQuery SQL query. Input: { sql: string, params?: object }',
    run: async (input: BigQueryInput) => {
      const rows = await query(input.sql, input.params);
      return { rows };
    },
  },
  'bq.insert': {
    name: 'bq.insert',
    description: 'Insert rows into a BigQuery table. Input: { table: string, rows: any[] }',
    run: async (input: BigQueryInsertInput) => {
      await insertRows(input.table, input.rows);
      return { ok: true };
    },
  },
  'storage.uploadString': {
    name: 'storage.uploadString',
    description:
      'Upload a string to Cloud Storage. Input: { path: string, contents: string, contentType?: string }',
    run: async (input: StorageUploadInput) => {
      const uri = await uploadString(input.path, input.contents, input.contentType);
      return { uri };
    },
  },
} as const;
export type DefaultToolName = keyof typeof tools;
