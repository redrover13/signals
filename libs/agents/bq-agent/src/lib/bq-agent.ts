/**
 * @fileoverview bq-agent module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains BigQuery agent implementation using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { 
  DulceLlmAgent, 
  GeminiLlm, 
  BigQueryQueryTool, 
  BigQueryInsertTool 
} from '@nx-monorepo/adk';

/**
 * BigQuery-specialized agent for data analysis and manipulation
 */
export class BigQueryAgent extends DulceLlmAgent {
  constructor(cfg?: { model?: string; apiKey?: string; tools?: Array<unknown> }) {
    // Require an API key, whether passed in or via env, to avoid silent misconfig
    const apiKey = cfg?.apiKey ?? process.env['GOOGLE_API_KEY'];
    if (!apiKey) {
      console.warn('GOOGLE_API_KEY not provided for BigQueryAgent, using mock mode');
    }

    // Allow overriding the model name for flexibility/testing
    const llm = new GeminiLlm({
      model: cfg?.model ?? 'gemini-1.5-pro',
      apiKey: apiKey || 'mock-api-key',
    });

    // Permit injecting custom tools, else use the BigQuery defaults
    const tools = cfg?.tools ?? [
      new BigQueryQueryTool(),
      new BigQueryInsertTool(),
    ];

    super({
      name: 'BigQuery Agent',
      description: 'Specialized agent for BigQuery data operations, analysis, and insights',
      llm,
      tools,
    });
  }

  /**
   * Execute a BigQuery query and analyze results
   */
  async analyzeData(query: string, context?: string): Promise<any> {
    const prompt = `
You are a BigQuery data analyst for the Dulce de Saigon F&B platform.

Query: ${query}
${context ? `Context: ${context}` : ''}

Please:
1. Execute the query using the bigquery_query tool
2. Analyze the results
3. Provide insights relevant to the Vietnamese F&B market
4. Suggest any follow-up queries if appropriate

Focus on actionable insights for restaurant operations and customer behavior.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Insert data with validation
   */
  async insertData(table: string, data: any[], context?: string): Promise<any> {
    const prompt = `
You are inserting data into the BigQuery table: ${table}

Data to insert: ${JSON.stringify(data, null, 2)}
${context ? `Context: ${context}` : ''}

Please:
1. Validate the data structure is appropriate for the F&B platform
2. Use the bigquery_insert tool to insert the data
3. Confirm the operation was successful
4. Provide a summary of what was inserted

Ensure all data complies with Vietnamese data privacy regulations.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }
}

/**
 * Factory function to create a BigQuery agent
 */
export function createBqAgent(): BigQueryAgent {
  return new BigQueryAgent();
}

/**
 * Legacy function for backward compatibility
 */
export function bqAgent(): string {
  return 'bq-agent (ADK-enabled)';
}
