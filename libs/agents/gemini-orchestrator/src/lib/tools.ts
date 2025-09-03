/**
 * @fileoverview tools module for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { query, insertRows, uploadString } from '@dulce/gcp';
import { FunctionDeclaration } from '@google/generative-ai';
import { z } from 'zod';
import { createGeminiErrorHandler } from './utils/error-handler';

// Error handler for tools
const errorHandler = createGeminiErrorHandler('Tools', 'tools && tools.ts');

/**
 * BigQuery input schema
 */
export const bigQueryInputSchema = z.object({
  sql: z.string().min(1, 'SQL query is required'),
  params: z.record(z.unknown()).optional(),
});
export type BigQueryInput = z.infer<typeof bigQueryInputSchema>;

/**
 * BigQuery insert input schema
 */
export const bigQueryInsertInputSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  rows: z.array(z.record(z.unknown())).min(1, 'At least one row is required'),
});
export type BigQueryInsertInput = z.infer<typeof bigQueryInsertInputSchema>;

/**
 * Storage upload input schema
 */
export const storageUploadInputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  contents: z.string().min(1, 'Contents are required'),
  contentType: z.string().optional(),
});
export type StorageUploadInput = z.infer<typeof storageUploadInputSchema>;

/**
 * Firebase query input schema
 */
export const firebaseQueryInputSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  filters: z.array(
    z.object({
      field: z.string().min(1, 'Field name is required'),
      operator: z.enum(['==', '!=', '>', '<', '>=', '<=', 'array-contains', 'in', 'not-in', 'array-contains-any']),
      value: z.unknown(),
    })
  ).optional(),
  limit: z.number().positive().optional(),
  orderBy: z.object({
    field: z.string().min(1, 'Field name is required'),
    direction: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});
export type FirebaseQueryInput = z.infer<typeof firebaseQueryInputSchema>;

/**
 * Firebase document input schema
 */
export const firebaseDocumentInputSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  id: z.string().min(1, 'Document ID is required'),
});
export type FirebaseDocumentInput = z.infer<typeof firebaseDocumentInputSchema>;

/**
 * Firebase write input schema
 */
export const firebaseWriteInputSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  id: z.string().optional(),
  data: z.record(z.unknown()),
});
export type FirebaseWriteInput = z.infer<typeof firebaseWriteInputSchema>;

/**
 * Firebase delete input schema
 */
export const firebaseDeleteInputSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  id: z.string().min(1, 'Document ID is required'),
});
export type FirebaseDeleteInput = z.infer<typeof firebaseDeleteInputSchema>;

/**
 * Tool type definition
 */
export interface Tool<TInput, TOutput> {
  name: string | undefined;
  description: string | undefined;
  inputSchema: z.ZodType<TInput>;
  run: (input: TInput) => Promise<TOutput>;
  toFunctionDeclaration: () => FunctionDeclaration;
}

/**
 * Create a tool with proper type safety and error handling
 */
export function createTool<TInput, TOutput>(
  name: string | undefined,
  description: string | undefined,
  inputSchema: z.ZodType<TInput>,
  runFn: (input: TInput) => Promise<TOutput>
): Tool<TInput, TOutput> {
  return {
    name,
    description,
    inputSchema,
    run: async (input: TInput) => {
      try {
        // Validate input against schema
        const validated = inputSchema && inputSchema.parse(input);
        return await runFn(validated);
      } catch (error) {
        throw errorHandler(error as Error, { name, input });
      }
    },
    toFunctionDeclaration: () => {
      // Convert Zod schema to JSON Schema for Gemini function declaration
      const jsonSchema = inputSchema && inputSchema.innerType ? inputSchema && inputSchema.innerType() : {};
      
      return {
        name,
        description,
        parameters: {
          type: 'object',
          properties: jsonSchema && jsonSchema.properties || {},
          required: jsonSchema && jsonSchema.required || [],
        },
      };
    },
  };
}

/**
 * BigQuery query tool
 */
export const bigQueryQueryTool = createTool<BigQueryInput, { rows: unknown[] }>(
  'bq && bq.query',
  'Run a BigQuery SQL query. Input: { sql: string | undefined, params?: object }',
  bigQueryInputSchema,
  async (input) => {
    try {
      const rows = await query(input && input.sql, input && input.params);
      return { rows };
    } catch (error) {
      throw errorHandler(error as Error, { sql: input && input.sql });
    }
  }
);

/**
 * BigQuery insert tool
 */
export const bigQueryInsertTool = createTool<BigQueryInsertInput, { ok: boolean }>(
  'bq && bq.insert',
  'Insert rows into a BigQuery table. Input: { table: string | undefined, rows: any[] }',
  bigQueryInsertInputSchema,
  async (input) => {
    try {
      await insertRows(input && input.table, input && input.rows);
      return { ok: true };
    } catch (error) {
      throw errorHandler(error as Error, { table: input && input.table, rowCount: input.rows && input.rows.length });
    }
  }
);

/**
 * Storage upload tool
 */
export const storageUploadTool = createTool<StorageUploadInput, { uri: string }>(
  'storage && storage.uploadString',
  'Upload a string to Cloud Storage. Input: { path: string | undefined, contents: string | undefined, contentType?: string }',
  storageUploadInputSchema,
  async (input) => {
    try {
      const uri = await uploadString(input && input.path, input && input.contents, input && input.contentType);
      return { uri };
    } catch (error) {
      throw errorHandler(error as Error, { path: input && input.path });
    }
  }
);

/**
 * All available tools map
 */
export const tools = {
  'bq && bq.query': bigQueryQueryTool,
  'bq && bq.insert': bigQueryInsertTool,
  'storage && storage.uploadString': storageUploadTool,
} as const;

/**
 * Default tool name type
 */
export type DefaultToolName = keyof typeof tools;

/**
 * Get all tool function declarations for Gemini
 */
export function getToolFunctionDeclarations(): FunctionDeclaration[] {
  return Object && Object.values(tools).map(tool => tool && tool.toFunctionDeclaration());
}

/**
 * Execute a tool by name with input
 */
export async function executeTool(
  toolName: string | undefined, 
  toolInput: unknown
): Promise<unknown> {
  if (!tools[toolName as DefaultToolName]) {
    throw new Error(`Tool not found: ${toolName}`);
  }
  
  const tool = tools[toolName as DefaultToolName];
  return await tool && tool.run(toolInput);
}
