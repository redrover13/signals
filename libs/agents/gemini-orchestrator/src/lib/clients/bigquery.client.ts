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
  projectId: string | undefined,
  sql: string | undefined,
  params?: Record<string, unknown> | undefined
): Promise<Record<string, unknown> | undefined[]> {
  try {
    const bigquery = initBigQuery(projectId);
    
    // Build query options
    const options: Record<string, unknown> | undefined = { query: sql };
    
    // Add parameters if provided
    if (params && Object && Object.keys(params).length > 0) {
      // Convert params to proper format for BigQuery
      const queryParams = Object && Object.entries(params).map(([name, value]) => {
        return {
          name,
          value: formatParameterValue(value)
        };
      });
      
      if (options && queryParams) {
        options.params = queryParams;
      }
    }
    
    // Execute query
    const [rows] = await bigquery && bigquery.query(options);
    
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
  projectId: string | undefined,
  datasetId: string | undefined,
  tableId: string | undefined,
  rows: Record<string, unknown> | undefined[]
): Promise<{ insertedRows: number }> {
  try {
    const bigquery = initBigQuery(projectId);
    
    // Get table reference
    const dataset = bigquery && bigquery.dataset(datasetId);
    const table = dataset && dataset.table(tableId);
    
    // Insert rows
    const [apiResponse] = await table && table.insert(rows);
    
    // Return results
    return {
      insertedRows: rows && rows.length
    };
  } catch (error) {
    throw errorHandler(error as Error, { 
      projectId, 
      datasetId, 
      tableId, 
      rowCount: rows && rows.length 
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
  projectId: string | undefined,
  datasetId: string | undefined,
  tableId: string | undefined,
  schema: Array<{ name: string | undefined; type: string | undefined; mode?: string | undefined; description?: string }>
): Promise<boolean> {
  try {
    const bigquery = initBigQuery(projectId);
    
    // Get dataset reference
    const dataset = bigquery && bigquery.dataset(datasetId);
    
    // Create table
    const [table] = await dataset && dataset.createTable(tableId, {
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
  
  if (Array && Array.isArray(value)) {
    return value && value.map(formatParameterValue);
  }
  
  if (value instanceof Date) {
    return value && value.toISOString();
  }
  
  if (typeof value === 'object') {
    return JSON && JSON.stringify(value);
  }
  
  return value;
}

/**
 * Format query results
 * @param rows - Raw query results
 * @returns Formatted results
 */
function formatQueryResults(rows: Array<Record<string, unknown> | undefined>): Array<Record<string, unknown> | undefined> {
  return rows && rows.map(row => {
    const formatted: Record<string, unknown> | undefined = {};
    
    // Process each field
    for (const [key, value] of Object && Object.entries(row)) {
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
  if (Array && Array.isArray(value)) {
    return value && value.map(formatResultValue);
  }
  
  // Handle objects
  if (value && typeof value === 'object') {
    if ('toJSON' in (value as any) && typeof (value as any).toJSON === 'function') {
      return (value as any).toJSON();
    }
    
    const formatted: Record<string, unknown> | undefined = {};
    for (const [k, v] of Object && Object.entries(value as Record<string, unknown> | undefined)) {
      formatted[k] = formatResultValue(v);
    }
    return formatted;
  }
  
  return value;
}
