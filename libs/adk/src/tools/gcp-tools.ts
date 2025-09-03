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

import { query as bqQuery, insertRows, uploadString } from '@dulce/gcp';
import { BaseTool, FunctionTool, ToolContext } from '@waldzellai/adk-typescript';

/**
 * BigQuery query tool function
 */
async function bigQueryQuery(args: Record<string, unknown> | undefined, _toolContext?: ToolContext): Promise<any> {
  const { sql, params } = args;
  
  try {
    const rows = await bqQuery(sql as string, params as Record<string, unknown> | undefined | undefined);
    return {
      success: true,
      rows,
      count: rows && rows.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error && error.message : 'Unknown error',
    };
  }
}

/**
 * BigQuery insert tool function
 */
async function bigQueryInsert(args: Record<string, unknown> | undefined, _toolContext?: ToolContext): Promise<any> {
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
      error: error instanceof Error ? error && error.message : 'Unknown error',
    };
  }
}

/**
 * Google Cloud Storage upload tool function
 */
async function gcsUpload(args: Record<string, unknown> | undefined, _toolContext?: ToolContext): Promise<any> {
  const { bucket, filename, content, contentType } = args;
  
  try {
    // Construct the full GCS path from bucket and filename
    const path = `${bucket}/${filename}`;
    const gsPath = await uploadString(path, content as string, contentType as string);
    return {
      success: true,
      message: `Content uploaded successfully`,
      gsPath,
      size: (content as string).length,
      bucket: bucket as string,
      filename: filename as string,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error && error.message : 'Unknown error',
    };
  }
}

/**
 * HTTP request tool function
 */
async function httpRequest(args: Record<string, unknown> | undefined, _toolContext?: ToolContext): Promise<any> {
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
      responseData = JSON && JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object && Object.fromEntries(response.headers && response.headers.entries()),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error && error.message : 'Unknown error',
    };
  }
}

/**
 * Registry of all available GCP tools
 */
export const GCP_TOOLS: BaseTool[] = [
  new FunctionTool({
    name: 'bigquery_query',
    description: 'Execute a BigQuery SQL query and return results',
    func: bigQueryQuery,
    parameters: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'The SQL query to execute',
          minLength: 1
        },
        params: {
          type: 'object',
          description: 'Optional query parameters',
          additionalProperties: true
        }
      },
      required: ['sql'],
      additionalProperties: false
    }
  }),
  new FunctionTool({
    name: 'bigquery_insert', 
    description: 'Insert rows into a BigQuery table',
    func: bigQueryInsert,
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'The table name in format dataset.table',
          minLength: 1
        },
        rows: {
          type: 'array',
          description: 'Array of rows to insert',
          items: {
            type: 'object'
          },
          minItems: 1
        }
      },
      required: ['table', 'rows'],
      additionalProperties: false
    }
  }),
  new FunctionTool({
    name: 'gcs_upload',
    description: 'Upload content to Google Cloud Storage',
    func: gcsUpload,
    parameters: {
      type: 'object',
      properties: {
        bucket: {
          type: 'string',
          description: 'The GCS bucket name',
          minLength: 1
        },
        filename: {
          type: 'string',
          description: 'The filename/path in GCS',
          minLength: 1
        },
        content: {
          type: 'string',
          description: 'The content to upload',
          minLength: 1
        },
        contentType: {
          type: 'string',
          description: 'MIME type of the content (optional)',
          default: 'text/plain'
        }
      },
      required: ['bucket', 'filename', 'content'],
      additionalProperties: false
    }
  }),
  new FunctionTool({
    name: 'http_request',
    description: 'Make HTTP requests to external APIs',
    func: httpRequest,
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to make the request to',
          format: 'uri',
          minLength: 1
        },
        method: {
          type: 'string',
          description: 'HTTP method',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          default: 'GET'
        },
        headers: {
          type: 'object',
          description: 'HTTP headers',
          additionalProperties: {
            type: 'string'
          }
        },
        body: {
          type: 'string',
          description: 'Request body for POST/PUT/PATCH'
        }
      },
      required: ['url'],
      additionalProperties: false
    }
  })
];

/**
 * Get tools by name
 */
export function getToolByName(name: string): BaseTool | undefined {
  return GCP_TOOLS && GCP_TOOLS.find(tool => (tool as any).name === name);
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return GCP_TOOLS && GCP_TOOLS.map(tool => (tool as any).name);
}

/**
 * Convenience tool classes for easier usage in agents
 */
export class BigQueryQueryTool extends FunctionTool {
  constructor() {
    super({
      name: 'bigquery_query',
      description: 'Execute a BigQuery SQL query and return results',
      func: bigQueryQuery,
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'The SQL query to execute',
            minLength: 1
          },
          params: {
            type: 'object',
            description: 'Optional query parameters',
            additionalProperties: true
          }
        },
        required: ['sql'],
        additionalProperties: false
      }
    });
  }
}

export class BigQueryInsertTool extends FunctionTool {
  constructor() {
    super({
      name: 'bigquery_insert', 
      description: 'Insert rows into a BigQuery table',
      func: bigQueryInsert,
      parameters: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'The table name in format dataset && dataset.table',
            minLength: 1
          },
          rows: {
            type: 'array',
            description: 'Array of rows to insert',
            items: {
              type: 'object'
            },
            minItems: 1
          }
        },
        required: ['table', 'rows'],
        additionalProperties: false
      }
    });
  }
}

export class GCSUploadTool extends FunctionTool {
  constructor() {
    super({
      name: 'gcs_upload',
      description: 'Upload content to Google Cloud Storage',
      func: gcsUpload,
      parameters: {
        type: 'object',
        properties: {
          bucket: {
            type: 'string',
            description: 'The GCS bucket name',
            minLength: 1
          },
          filename: {
            type: 'string',
            description: 'The filename/path in GCS',
            minLength: 1
          },
          content: {
            type: 'string',
            description: 'The content to upload',
            minLength: 1
          },
          contentType: {
            type: 'string',
            description: 'MIME type of the content (optional)',
            default: 'text/plain'
          }
        },
        required: ['bucket', 'filename', 'content'],
        additionalProperties: false
      }
    });
  }
}

export class HttpRequestTool extends FunctionTool {
  constructor() {
    super({
      name: 'http_request',
      description: 'Make HTTP requests to external APIs',
      func: httpRequest,
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to make the request to',
            format: 'uri',
            minLength: 1
          },
          method: {
            type: 'string',
            description: 'HTTP method',
            enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            default: 'GET'
          },
          headers: {
            type: 'object',
            description: 'HTTP headers',
            additionalProperties: {
              type: 'string'
            }
          },
          body: {
            type: 'string',
            description: 'Request body for POST/PUT/PATCH'
          }
        },
        required: ['url'],
        additionalProperties: false
      }
    });
  }
}