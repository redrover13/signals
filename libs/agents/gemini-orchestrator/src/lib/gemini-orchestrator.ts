/**
 * @fileoverview gemini-orchestrator module for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Using ES modules imports
import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
  FunctionDeclaration,
  Tool,
  FunctionCall,
  Content,
} from '@google/generative-ai';
import { getToolFunctionDeclarations, executeTool } from './tools';
import {
  SubAgentType,
  OrchestratorInput,
  OrchestratorOutput,
  OrchestratorOptions,
  orchestratorInputSchema,
  orchestratorOutputSchema,
} from './schemas';
import { createGeminiErrorHandler } from './utils/error-handler';

// Error handler for the orchestrator
const errorHandler = createGeminiErrorHandler('GeminiOrchestrator', 'gemini-orchestrator.ts');

export class GeminiOrchestrator {
  private model: GenerativeModel | undefined;
  private genAI: GoogleGenerativeAI | undefined;
  private isInitialized = false;

  constructor() {
    console.log('GeminiOrchestrator initialized');
  }

  /**
   * Initializes the Gemini Orchestrator with API key and model configuration.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('GeminiOrchestrator: Initializing...');

    try {
      // Get API key from environment variables
      const apiKey = process.env['GEMINI_API_KEY'] || process.env['GOOGLE_API_KEY'];

      if (!apiKey) {
        console.warn('GeminiOrchestrator: No API key found, running in simulation mode');
        this.isInitialized = true;
        return;
      }

      // Initialize Google Generative AI
      this.genAI = new GoogleGenerativeAI(apiKey);

      // Get the Gemini model with tools configuration
      const tools: Tool[] = [
        {
          functionDeclarations: getToolFunctionDeclarations(),
        },
      ];

      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        tools,
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        },
      });

      this.isInitialized = true;
      console.log('GeminiOrchestrator: Initialization complete with Gemini API');
    } catch (error) {
      const handledError = errorHandler(error as Error, { phase: 'initialization' });
      console.error('GeminiOrchestrator: Initialization failed:', handledError.message);
      // Continue in simulation mode
      this.isInitialized = true;
    }
  }

  /**
   * Orchestrates a request using Gemini with intelligent routing and tool execution.
   * @param params The orchestration parameters containing query, context, and options
   * @returns A structured result containing the orchestrated response
   */
  async orchestrate(params: {
    query: string | undefined;
    context?: Record<string, unknown> | undefined;
    options?: {
      streaming?: boolean | undefined;
      timeout?: number | undefined;
      cacheResults?: boolean | undefined;
    };
  }): Promise<Record<string, unknown> | undefined> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Validate input using schema
      const input: OrchestratorInput = orchestratorInputSchema.parse({
        query: params.query,
        context: params.context || {},
        options: params.options || {},
      });

      console.log('GeminiOrchestrator: Orchestrating request...');
      console.log('Query:', input.query);
      console.log('Context:', input.context);
      console.log('Options:', input.options);

      const startTime = Date.now();

      // If no model is available, return simulation response
      if (!this.model) {
        return this.createSimulationResponse(input, startTime);
      }

      // Determine sub-agent type based on query analysis
      const subAgent = this.analyzeQueryForRouting(input.query);

      // Create the conversation with context
      const conversation = this.buildConversation(input);

      // Execute the conversation with Gemini
      const result = await this.model.generateContent(conversation);
      const response = await result.response;

      // Handle function calls if present
      if (response.functionCalls && response.functionCalls.length > 0) {
        return await this.handleFunctionCalls(response.functionCalls, input, subAgent, startTime);
      }

      // Return text response
      const textResponse = response.text();
      return this.createSuccessResponse(
        {
          type: 'text_response' as const,
          text: textResponse,
        },
        subAgent,
        startTime,
      );
    } catch (error) {
      const handledError = errorHandler(error as Error, {
        query: params.query,
        context: params.context,
        options: params.options,
      });

      return {
        success: false,
        error: handledError.message,
        metadata: {
          model: 'gemini-1.5-pro',
          processTime: Date.now() - Date.now(),
          subAgent: SubAgentType.TOOL,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Analyzes the query to determine the appropriate sub-agent for routing
   */
  private analyzeQueryForRouting(query: string): SubAgentType {
    const lowerQuery = query.toLowerCase();

    // BigQuery patterns
    if (
      lowerQuery.includes('sql') ||
      lowerQuery.includes('query') ||
      lowerQuery.includes('data') ||
      lowerQuery.includes('analytics') ||
      lowerQuery.includes('select') ||
      lowerQuery.includes('table') ||
      lowerQuery.includes('sales') ||
      lowerQuery.includes('revenue') ||
      lowerQuery.includes('orders') ||
      lowerQuery.includes('selling') ||
      lowerQuery.includes('performance') ||
      lowerQuery.includes('metrics') ||
      lowerQuery.includes('report') ||
      lowerQuery.includes('count') ||
      lowerQuery.includes('top') ||
      lowerQuery.includes('best')
    ) {
      return SubAgentType.BIGQUERY;
    }

    // Firebase patterns
    if (
      lowerQuery.includes('document') ||
      lowerQuery.includes('collection') ||
      lowerQuery.includes('firestore') ||
      lowerQuery.includes('save') ||
      lowerQuery.includes('update') ||
      lowerQuery.includes('delete') ||
      lowerQuery.includes('get ') ||
      lowerQuery.includes('fetch')
    ) {
      return SubAgentType.FIREBASE;
    }

    // RAG patterns
    if (
      lowerQuery.includes('search') ||
      lowerQuery.includes('find') ||
      lowerQuery.includes('knowledge') ||
      lowerQuery.includes('information') ||
      lowerQuery.includes('learn') ||
      lowerQuery.includes('about') ||
      lowerQuery.includes('recipe') ||
      lowerQuery.includes('how to') ||
      lowerQuery.includes('what is')
    ) {
      return SubAgentType.RAG;
    }

    // Default to tool execution
    return SubAgentType.TOOL;
  }

  /**
   * Builds the conversation context for Gemini
   */
  private buildConversation(input: OrchestratorInput): Content[] {
    const systemPrompt = `You are an intelligent F&B data platform orchestrator for Dulce de Saigon.
Your role is to:
1. Analyze user queries and determine the best approach to fulfill them
2. Use available tools for BigQuery data analysis, Firebase document operations, and storage operations
3. Provide helpful, accurate responses in Vietnamese when appropriate
4. Handle F&B industry-specific queries about menus, pricing, sales, and customer data

Available tools:
- bq.query: Execute BigQuery SQL queries for analytics
- bq.insert: Insert data into BigQuery tables
- storage.uploadString: Upload content to Cloud Storage

Context provided: ${JSON.stringify(input.context)}

Please analyze the user's query and determine if you need to use any tools, then provide a comprehensive response.`;

    return [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser Query: ${input.query}` }],
      },
    ];
  }

  /**
   * Handles function calls from Gemini responses
   */
  private async handleFunctionCalls(
    functionCalls: FunctionCall[],
    input: OrchestratorInput,
    subAgent: SubAgentType,
    startTime: number,
  ): Promise<Record<string, unknown>> {
    try {
      const toolResults = [];

      for (const call of functionCalls) {
        try {
          const result = await executeTool(call.name, call.args);
          toolResults.push({
            tool: call.name,
            input: call.args,
            result: result,
          });
        } catch (toolError) {
          const handledToolError = errorHandler(toolError as Error, {
            toolName: call.name,
            toolArgs: call.args,
          });
          toolResults.push({
            tool: call.name,
            input: call.args,
            result: { error: handledToolError.message },
          });
        }
      }

      return this.createSuccessResponse(
        {
          type: 'tool_results' as const,
          results: toolResults,
          text: `Executed ${functionCalls.length} tool(s) successfully`,
        },
        subAgent,
        startTime,
      );
    } catch (error) {
      const handledError = errorHandler(error as Error, { functionCalls });
      throw handledError;
    }
  }

  /**
   * Creates a simulation response when Gemini API is not available
   */
  private createSimulationResponse(
    input: OrchestratorInput,
    startTime: number,
  ): Record<string, unknown> {
    const subAgent = this.analyzeQueryForRouting(input.query);

    // Create response data based on the sub-agent type
    let responseData;
    switch (subAgent) {
      case SubAgentType.BIGQUERY:
        responseData = {
          type: 'bigquery_result' as const,
          sql: 'SIMULATED_SQL_QUERY',
          rows: [{ simulated: true, message: 'This would contain BigQuery results' }],
          rowCount: 1,
        };
        break;
      case SubAgentType.FIREBASE:
        responseData = {
          type: 'firebase_document' as const,
          collection: 'simulated_collection',
          id: 'simulated_id',
          document: { simulated: true, message: 'This would contain Firebase document' },
        };
        break;
      case SubAgentType.RAG:
        responseData = {
          type: 'text_response' as const,
          text: `RAG search simulation for: "${input.query}". This would return relevant knowledge base results.`,
        };
        break;
      default:
        responseData = {
          type: 'text_response' as const,
          text: `Tool execution simulation for: "${input.query}". This would execute the appropriate tools.`,
        };
    }

    return this.createSuccessResponse(responseData, subAgent, startTime);
  }

  /**
   * Creates a standardized success response
   */
  private createSuccessResponse(
    data: any,
    subAgent: SubAgentType,
    startTime: number,
  ): Record<string, unknown> {
    return {
      success: true,
      data,
      fromCache: false,
      metadata: {
        model: 'gemini-1.5-pro',
        processTime: Date.now() - startTime,
        subAgent,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get the current model status
   */
  public getStatus(): { initialized: boolean; hasModel: boolean; modelName?: string } {
    return {
      initialized: this.isInitialized,
      hasModel: !!this.model,
      modelName: this.model ? 'gemini-1.5-pro' : undefined,
    };
  }

  /**
   * Reset the orchestrator (useful for testing)
   */
  public async reset(): Promise<void> {
    this.model = undefined;
    this.genAI = undefined;
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Health check method
   */
  public async healthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          details: { error: 'Not initialized' },
        };
      }

      if (!this.model) {
        return {
          status: 'degraded',
          details: { warning: 'Running in simulation mode - no Gemini API key' },
        };
      }

      // Test with a simple query
      const testResult = await this.model.generateContent(
        'Hello, respond with "OK" if you are working.',
      );
      const response = await testResult.response;

      return {
        status: 'healthy',
        details: {
          model: 'gemini-1.5-pro',
          testResponse: response.text(),
          initialized: this.isInitialized,
        },
      };
    } catch (error) {
      const handledError = errorHandler(error as Error, { operation: 'healthCheck' });
      return {
        status: 'unhealthy',
        details: { error: handledError.message },
      };
    }
  }
}
