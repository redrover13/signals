/**
 * @fileoverview BigQuery client service for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides BigQuery access for the Gemini orchestrator.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { BigQuery } from '@google-cloud/bigquery';
import { createGeminiErrorHandler } from '../utils/error-handler';

// BigQuery client singleton
let bigQueryInstance: BigQuery | null = null;

// Error handler for BigQuery client
const errorHandler = createGeminiErrorHandler(
  'BigQueryClient',
  'bigquery.client.ts'
);

/**
 * Initialize BigQuery client
 * @param projectId - GCP project ID
 * @returns BigQuery instance
 */
export function initBigQuery(projectId: string): BigQuery {
  if (bigQueryInstance) {
    return bigQueryInstance;
  }

  try {
    bigQueryInstance = new BigQuery({ projectId });
    return bigQueryInstance;
  } catch (error) {
    throw errorHandler(error as Error, { projectId });
  }
}

/**
 * Execute a BigQuery SQL query
 * @param projectId - GCP project ID
 * @param sql - SQL query string
 * @param params - Query parameters
 * @returns Query results
 */
export async function executeQuery(
  projectId: string,
  sql: string,
  params?: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  try {
    const bigquery = initBigQuery(projectId);
    
    // Build query options
    const options: Record<string, unknown> = { query: sql };
    
    // Add parameters if provided
    if (params && Object.keys(params).length > 0) {
      // Convert params to proper format for BigQuery
      const queryParams = Object.entries(params).map(([name, value]) => {
        return {
          name,
          value: formatParameterValue(value)
        };
      });
      
      options.params = queryParams;
    }
    
    // Execute query
    const [rows] = await bigquery.query(options);
    
    // Process results
    return formatQueryResults(rows);
  } catch (error) {
    throw errorHandler(error as Error, { 
      projectId, 
      sql, 
      params 
    });
  }
}

/**
 * Insert rows into a BigQuery table
 * @param projectId - GCP project ID
 * @param datasetId - Dataset ID
 * @param tableId - Table ID
 * @param rows - Rows to insert
 * @returns Insert results
 */
export async function insertRows(
  projectId: string,
  datasetId: string,
  tableId: string,
  rows: Record<string, unknown>[]
): Promise<{ insertedRows: number }> {
  try {
    const bigquery = initBigQuery(projectId);
    
    // Get table reference
    const dataset = bigquery.dataset(datasetId);
    const table = dataset.table(tableId);
    
    // Insert rows
    const [apiResponse] = await table.insert(rows);
    
    // Return results
    return {
      insertedRows: rows.length
    };
  } catch (error) {
    throw errorHandler(error as Error, { 
      projectId, 
      datasetId, 
      tableId, 
      rowCount: rows.length 
    });
  }
}

/**
 * Create or replace a BigQuery table
 * @param projectId - GCP project ID
 * @param datasetId - Dataset ID
 * @param tableId - Table ID
 * @param schema - Table schema
 * @returns Success status
 */
export async function createTable(
  projectId: string,
  datasetId: string,
  tableId: string,
  schema: Array<{ name: string; type: string; mode?: string; description?: string }>
): Promise<boolean> {
  try {
    const bigquery = initBigQuery(projectId);
    
    // Get dataset reference
    const dataset = bigquery.dataset(datasetId);
    
    // Create table
    const [table] = await dataset.createTable(tableId, {
      schema: {
        fields: schema
      }
    });
    
    return true;
  } catch (error) {
    throw errorHandler(error as Error, { 
      projectId, 
      datasetId, 
      tableId, 
      schema 
    });
  }
}

/**
 * Format parameter value for BigQuery
 * @param value - Parameter value
 * @returns Formatted value
 */
function formatParameterValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (Array.isArray(value)) {
    return value.map(formatParameterValue);
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return value;
}

/**
 * Format query results
 * @param rows - Raw query results
 * @returns Formatted results
 */
function formatQueryResults(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return rows.map(row => {
    const formatted: Record<string, unknown> = {};
    
    // Process each field
    for (const [key, value] of Object.entries(row)) {
      formatted[key] = formatResultValue(value);
    }
    
    return formatted;
  });
}

/**
 * Format a result value
 * @param value - Result value
 * @returns Formatted value
 */
function formatResultValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Handle BigQuery DATETIME and TIMESTAMP types
  if (value && typeof value === 'object' && 'value' in (value as any)) {
    return (value as any).value;
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(formatResultValue);
  }
  
  // Handle objects
  if (value && typeof value === 'object') {
    if ('toJSON' in (value as any) && typeof (value as any).toJSON === 'function') {
      return (value as any).toJSON();
    }
    
    const formatted: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      formatted[k] = formatResultValue(v);
    }
    return formatted;
  }
  
  return value;
}
