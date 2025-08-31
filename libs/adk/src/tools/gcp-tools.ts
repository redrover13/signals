/**
 * @fileoverview gcp-tools module for the tools component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains GCP service tools implementation using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { query as bqQuery, insertRows, uploadString } from '@nx-monorepo/gcp';

/**
 * BigQuery query tool function
 */
async function bigQueryQuery(args: Record<string, unknown>, _toolContext?: ToolContext): Promise<any> {
  const { sql, params } = args;
  
  try {
    const rows = await bqQuery(sql as string, params as Record<string, unknown> | undefined);
    return {
      success: true,
      rows,
      count: rows.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * BigQuery insert tool function
 */
async function bigQueryInsert(args: Record<string, unknown>, _toolContext?: ToolContext): Promise<any> {
  const { table, rows } = args;
  
  try {
    await insertRows(table as string, rows as any[]);
    return {
      success: true,
      message: `Inserted ${(rows as any[]).length} rows into ${table}`,
      insertedCount: (rows as any[]).length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Google Cloud Storage upload tool function
 */
async function gcsUpload(args: Record<string, unknown>, _toolContext?: ToolContext): Promise<any> {
  const { path, contents, contentType } = args;
  
  try {
    const gsPath = await uploadString(path as string, contents as string, contentType as string);
    return {
      success: true,
      message: `Content uploaded successfully`,
      gsPath,
      size: (contents as string).length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * HTTP request tool function
 */
async function httpRequest(args: Record<string, unknown>, _toolContext?: ToolContext): Promise<any> {
  const { url, method, headers, body } = args;
  
  try {
    const fetchOptions: RequestInit = {
      method: method as string,
      headers: {
        'Content-Type': 'application/json',
        ...headers as Record<string, string>,
      },
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method as string)) {
      fetchOptions.body = body as string;
    }

    const response = await fetch(url as string, fetchOptions);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Registry of all available GCP tools
 */
export const GCP_TOOLS: BaseTool[] = [
  new FunctionTool(bigQueryQuery, 'bigquery_query', 'Execute a BigQuery SQL query and return results'),
  new FunctionTool(bigQueryInsert, 'bigquery_insert', 'Insert rows into a BigQuery table'),
  new FunctionTool(gcsUpload, 'gcs_upload', 'Upload content to Google Cloud Storage'),
  new FunctionTool(httpRequest, 'http_request', 'Make HTTP requests to external APIs'),
];

/**
 * Get tools by name
 */
export function getToolByName(name: string): BaseTool | undefined {
  return GCP_TOOLS.find(tool => (tool as any).name === name);
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return GCP_TOOLS.map(tool => (tool as any).name);
}