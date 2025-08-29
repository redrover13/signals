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

import { FunctionTool, ToolContext } from '@waldzellai/adk-typescript';
import { query as bqQuery, insertRows, uploadString } from '@nx-monorepo/gcp';

/**
 * BigQuery query tool
 */
export class BigQueryQueryTool extends FunctionTool {
  constructor() {
    super({
      name: 'bigquery_query',
      description: 'Execute a BigQuery SQL query and return results',
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'The SQL query to execute',
          },
          params: {
            type: 'object',
            description: 'Optional query parameters',
          },
        },
        required: ['sql'],
      },
    });
  }

  async execute(context: ToolContext): Promise<any> {
    const { sql, params } = context.arguments;
    
    try {
      const rows = await bqQuery(sql, params);
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
}

/**
 * BigQuery insert tool
 */
export class BigQueryInsertTool extends FunctionTool {
  constructor() {
    super({
      name: 'bigquery_insert',
      description: 'Insert rows into a BigQuery table',
      parameters: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'The table name in format dataset.table',
          },
          rows: {
            type: 'array',
            description: 'Array of row objects to insert',
            items: {
              type: 'object',
            },
          },
        },
        required: ['table', 'rows'],
      },
    });
  }

  async execute(context: ToolContext): Promise<any> {
    const { table, rows } = context.arguments;
    
    try {
      await insertRows(table, rows);
      return {
        success: true,
        message: `Inserted ${rows.length} rows into ${table}`,
        insertedCount: rows.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Google Cloud Storage upload tool
 */
export class GCSUploadTool extends FunctionTool {
  constructor() {
    super({
      name: 'gcs_upload',
      description: 'Upload content to Google Cloud Storage',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The GCS path to upload to (e.g., bucket/folder/file.txt)',
          },
          contents: {
            type: 'string',
            description: 'The content to upload',
          },
          contentType: {
            type: 'string',
            description: 'Optional content type (e.g., text/plain, application/json)',
          },
        },
        required: ['path', 'contents'],
      },
    });
  }

  async execute(context: ToolContext): Promise<any> {
    const { path, contents, contentType } = context.arguments;
    
    try {
      const gsPath = await uploadString(path, contents, contentType);
      return {
        success: true,
        message: `Content uploaded successfully`,
        gsPath,
        size: contents.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * HTTP request tool for external API calls
 */
export class HttpRequestTool extends FunctionTool {
  constructor() {
    super({
      name: 'http_request',
      description: 'Make HTTP requests to external APIs',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to make the request to',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'HTTP method',
          },
          headers: {
            type: 'object',
            description: 'Optional HTTP headers',
          },
          body: {
            type: 'string',
            description: 'Request body for POST/PUT requests',
          },
        },
        required: ['url', 'method'],
      },
    });
  }

  async execute(context: ToolContext): Promise<any> {
    const { url, method, headers, body } = context.arguments;
    
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = body;
      }

      const response = await fetch(url, fetchOptions);
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
}

/**
 * Registry of all available GCP tools
 */
export const GCP_TOOLS = [
  new BigQueryQueryTool(),
  new BigQueryInsertTool(),
  new GCSUploadTool(),
  new HttpRequestTool(),
];

/**
 * Get tools by name
 */
export function getToolByName(name: string): FunctionTool | undefined {
  return GCP_TOOLS.find(tool => tool.name === name);
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return GCP_TOOLS.map(tool => tool.name);
}