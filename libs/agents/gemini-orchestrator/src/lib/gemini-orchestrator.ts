/**
 * @fileoverview gemini-orchestrator module for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality with MCP integration.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { 
  GoogleGenerativeAI, 
  GenerativeModel,
  GenerationConfig,
  FunctionDeclaration, 
  Tool 
} from '@google/generative-ai';
import { 
  orchestratorInputSchema, 
  orchestratorOutputSchema,
  orchestratorStreamOutputSchema,
  SubAgentType,
  CacheOptions,
  OrchestratorInput,
  OrchestratorStreamOutput,
  OrchestratorMetadata
} from './schemas';
import { 
  executeQuery as executeBigQueryQuery
} from './clients/bigquery.client';
import {
  queryDocuments,
  getDocument,
  writeDocument,
  deleteDocument
} from './clients/firebase.client';
import { 
  getToolFunctionDeclarations, 
  executeTool 
} from './tools';
import { createGeminiErrorHandler, mapGeminiError } from './utils/error-handler';
import { loadGeminiConfig, loadMCPConfig } from './config/config.service';
import { ErrorCategory, ErrorSeverity, createError } from '@nx-monorepo/utils/monitoring';
import { MCPServerConfig, MCPServerCategory } from './config/mcp-config.schema';

// Define MCPClient interface - will be satisfied by the actual implementation
interface MCPClient {
  streamFromServer(serverId: string, input: Record<string, any>): AsyncGenerator<any, void, unknown>;
  callServer(serverId: string, input: Record<string, any>): Promise<any>;
}

// Error handler for the orchestrator
const errorHandler = createGeminiErrorHandler(
  'GeminiOrchestrator',
  'gemini-orchestrator.ts'
);

/**
 * MCP Server Manager interface for handling server selection and interaction
 */
interface MCPServerManager {
  getServer(category: MCPServerCategory, serverId?: string): Promise<MCPServerConfig | null>;
  isServerHealthy(serverId: string): Promise<boolean>;
  getAllServers(): Promise<MCPServerConfig[]>;
  refreshServers(): Promise<void>;
  getMCPClient(): MCPClient | null;
}

/**
 * Default MCP Server Manager implementation
 */
class DefaultMCPServerManager implements MCPServerManager {
  private servers: MCPServerConfig[] = [];
  private healthyServers = new Map<string, boolean>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private mcpClient: MCPClient | null = null;
  
  constructor() {
    // Initialize server health cache
    this.refreshServers();
    
    // Set up periodic health checks
    this.startHealthChecks();
    
    // Initialize MCP client
    try {
      // Import dynamically to avoid circular dependencies
      import('@dulce-de-saigon/mcp').then(({ MCPClientService }) => {
        this.mcpClient = new MCPClientService();
      }).catch(error => {
        console.error('Failed to initialize MCP client:', error);
      });
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
    }
  }
  
  /**
   * Start periodic health checks
   */
  private startHealthChecks() {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Check server health every minute
    this.healthCheckInterval = setInterval(() => {
      this.checkAllServerHealth();
    }, 60000); // 60 seconds
  }
  
  /**
   * Check health of all servers
   */
  private async checkAllServerHealth() {
    for (const server of this.servers) {
      if (server.enabled) {
        try {
          // In a real implementation, this would perform an actual health check
          // using the server's healthCheck configuration
          
          // For demo purposes, we'll just set all servers as healthy
          this.healthyServers.set(server.id, true);
        } catch (error) {
          console.error(`Health check failed for server ${server.id}:`, error);
          this.healthyServers.set(server.id, false);
        }
      }
    }
  }
  
  /**
   * Refresh server list from config
   */
  async refreshServers(): Promise<void> {
    try {
      // Load server configurations from config service
      const { loadMCPConfig } = await import('./config/config.service');
      const mcpConfig = await loadMCPConfig();
      
      if (mcpConfig && mcpConfig.servers && Array.isArray(mcpConfig.servers)) {
        this.servers = mcpConfig.servers;
        
        // Initialize all servers as healthy initially
        this.servers.forEach(server => {
          if (server.enabled) {
            this.healthyServers.set(server.id, true);
          }
        });
        
        // Perform initial health check
        this.checkAllServerHealth();
      } else {
        console.warn('No MCP servers found in configuration');
        this.servers = [];
      }
    } catch (error) {
      console.error('Error refreshing MCP servers:', error);
      this.servers = [];
    }
  }
  
  /**
   * Get server by category and optional ID
   */
  async getServer(category: MCPServerCategory, serverId?: string): Promise<MCPServerConfig | null> {
    if (serverId) {
      // Return specific server if healthy
      const server = this.servers.find(s => s.id === serverId);
      if (server && server.enabled && this.healthyServers.get(serverId)) {
        return server;
      }
    }
    
    // Find highest priority healthy server in category
    return this.servers
      .filter(server => 
        server.category === category && 
        server.enabled && 
        this.healthyServers.get(server.id))
      .sort((a, b) => b.priority - a.priority)[0] || null;
  }
  
  /**
   * Check if server is healthy
   */
  async isServerHealthy(serverId: string): Promise<boolean> {
    // Get server config
    const server = this.servers.find(s => s.id === serverId);
    if (!server || !server.enabled) {
      return false;
    }
    
    // Check cached health status
    const isHealthy = this.healthyServers.get(serverId);
    
    // If health status is unknown, perform a health check
    if (isHealthy === undefined) {
      try {
        // In a real implementation, this would perform an actual health check
        // For demo purposes, we'll just set as healthy
        this.healthyServers.set(serverId, true);
        return true;
      } catch (error) {
        this.healthyServers.set(serverId, false);
        return false;
      }
    }
    
    return isHealthy || false;
  }
  
  /**
   * Get all servers
   */
  async getAllServers(): Promise<MCPServerConfig[]> {
    return [...this.servers].filter(server => server.enabled);
  }
  
  /**
   * Get the MCP client for server requests
   * @returns MCP client instance or null if not available
   */
  getMCPClient(): MCPClient | null {
    return this.mcpClient;
  }
}

/**
 * Gemini Orchestrator class
 * Coordinates various agent tasks through the Gemini model with MCP integration
 */
export class GeminiOrchestrator {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private config: Record<string, any> = {};
  private toolDeclarations: FunctionDeclaration[] = [];
  private isInitialized = false;
  private cache = new Map<string, { result: any; timestamp: number; serverId?: string }>();
  private mcpServerManager: MCPServerManager;
  private startTime: number = 0;
  
  /**
   * Constructor
   * @param mcpServerManager - Optional custom MCP server manager
   */
  constructor(mcpServerManager?: MCPServerManager) {
    this.mcpServerManager = mcpServerManager || new DefaultMCPServerManager();
  }
  
  /**
   * Initialize the Gemini orchestrator
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }
      
      this.startTime = Date.now();
      
      // Load configuration
      this.config = await loadGeminiConfig();
      
      // Load MCP configuration
      const mcpConfig = await loadMCPConfig();
      
      // Initialize MCP server manager with servers from config
      if (mcpConfig && mcpConfig.servers && mcpConfig.servers.length > 0) {
        await this.mcpServerManager.refreshServers();
      }
      
      // Initialize Gemini
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      
      // Initialize model with function calling capability
      this.model = this.genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          topP: this.config.topP,
          topK: this.config.topK,
          maxOutputTokens: this.config.maxTokens,
        } as GenerationConfig,
      });
      
      // Get tool declarations
      this.toolDeclarations = getToolFunctionDeclarations();
      
      this.isInitialized = true;
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { action: 'initialize' });
    }
  }
  
  /**
   * Orchestrate agent tasks
   * @param input - Orchestrator input
   * @returns Orchestrator output
   */
  async orchestrate(
    input: unknown
  ): Promise<Record<string, unknown>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Validate input
      const validatedInput = orchestratorInputSchema.parse(input);
      const { query, context, options } = validatedInput;
      
      // Check cache if enabled
      const cacheKey = options?.cacheResults ? this.getCacheKey(query, context) : null;
      if (cacheKey && this.cache.has(cacheKey)) {
        const cachedResult = this.cache.get(cacheKey);
        
        if (cachedResult && this.isCacheValid(cachedResult.timestamp, options?.cache)) {
          return orchestratorOutputSchema.parse({
            success: true,
            data: cachedResult.result,
            fromCache: true,
            metadata: this.createMetadata(SubAgentType.TOOL, cachedResult.serverId)
          });
        }
      }
      
      // Check if streaming is requested
      if (options?.streaming) {
        throw new Error('Streaming requests must use orchestrateStream method');
      }
      
      // Route request to appropriate sub-agent based on query analysis
      const subAgentType = await this.analyzeQueryForRouting(query, context);
      
      // Get appropriate MCP server if specified
      const mcpServerId = options?.mcpServerId;
      
      // Route to sub-agent
      const result = await this.routeToSubAgent(subAgentType, query, context, mcpServerId);
      
      // Cache result if enabled
      if (cacheKey) {
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          serverId: mcpServerId
        });
      }
      
      // Return validated result
      return orchestratorOutputSchema.parse({
        success: true,
        data: result,
        fromCache: false,
        metadata: this.createMetadata(subAgentType, mcpServerId)
      });
    } catch (error) {
      const errorObject = mapGeminiError(error);
      throw errorHandler(errorObject, { 
        query: (input as any)?.query,
        error: errorObject.message,
        mcpServerId: (input as any)?.options?.mcpServerId
      });
    }
  }
  
  /**
   * Orchestrate agent tasks with streaming output
   * @param input - Orchestrator input
   * @returns Async generator of orchestrator stream outputs
   */
  async *orchestrateStream(
    input: unknown
  ): AsyncGenerator<OrchestratorStreamOutput, void, unknown> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Validate input
      const validatedInput = orchestratorInputSchema.parse(input);
      const { query, context, options } = validatedInput;
      
      // Check if streaming is disabled in options
      if (options && options.streaming === false) {
        throw new Error('Streaming was explicitly disabled in options');
      }
      
      // Force streaming option
      const streamOptions = {
        ...options,
        streaming: true
      };
      
      // Route request to appropriate sub-agent based on query analysis
      let subAgentType: SubAgentType;
      try {
        subAgentType = await this.analyzeQueryForRouting(query, context);
        // Yield routing result
        yield {
          success: true,
          content: `Routing to ${subAgentType} sub-agent...`,
          done: false,
          chunkIndex: 0
        };
      } catch (error) {
        // If routing fails, default to TOOL
        subAgentType = SubAgentType.TOOL;
        yield {
          success: true,
          content: `Routing failed, defaulting to ${subAgentType} sub-agent...`,
          done: false,
          chunkIndex: 0
        };
      }
      
      // Get appropriate MCP server if specified
      const mcpServerId = options?.mcpServerId;
      let useMCPServer = false;
      let serverName = 'local';
      
      if (mcpServerId) {
        try {
          // Get server category based on sub-agent type
          const category = this.getServerCategoryForSubAgentType(subAgentType);
          
          // Get server for the given category and ID
          const server = await this.mcpServerManager.getServer(category, mcpServerId);
          
          if (server) {
            useMCPServer = true;
            serverName = server.name;
            
            // Check if server is healthy
            const isHealthy = await this.mcpServerManager.isServerHealthy(mcpServerId);
            if (!isHealthy) {
              yield {
                success: true,
                content: `Warning: MCP server ${serverName} may not be healthy. Will attempt to use it anyway.`,
                done: false,
                chunkIndex: 1
              };
            } else {
              yield {
                success: true,
                content: `Using MCP server: ${serverName}`,
                done: false,
                chunkIndex: 1
              };
            }
          } else {
            yield {
              success: true,
              content: `MCP server ${mcpServerId} not found or not enabled. Falling back to local processing.`,
              done: false,
              chunkIndex: 1
            };
          }
        } catch (error) {
          yield {
            success: true,
            content: `Error selecting MCP server: ${error.message}. Falling back to local processing.`,
            done: false,
            chunkIndex: 1
          };
        }
      }
      
      // Stream from appropriate sub-agent
      let chunkIndex = useMCPServer ? 2 : 1;
      
      try {
        if (useMCPServer) {
          // Stream from MCP server
          yield* this.streamFromMCPServer(subAgentType, query, context, mcpServerId!, chunkIndex);
        } else {
          // Stream from local implementation
          switch (subAgentType) {
            case SubAgentType.BIGQUERY:
              yield* this.streamFromBigQuery(query, context, mcpServerId, chunkIndex);
              break;
            case SubAgentType.FIREBASE:
              yield* this.streamFromFirebase(query, context, mcpServerId, chunkIndex);
              break;
            case SubAgentType.TOOL:
              yield* this.streamFromTool(query, context, mcpServerId, chunkIndex);
              break;
            default:
              throw new Error(`Unknown sub-agent type: ${subAgentType}`);
          }
        }
      } catch (error) {
        // Yield error
        yield {
          success: false,
          error: error.message,
          done: true,
          metadata: this.createMetadata(subAgentType, mcpServerId),
          chunkIndex: chunkIndex++
        };
      }
      
    } catch (error) {
      const errorObject = mapGeminiError(error);
      // Yield error response
      yield {
        success: false,
        error: errorObject.message,
        done: true,
        chunkIndex: 0
      };
    }
  }
    }
  }
  
  /**
   * Stream from BigQuery sub-agent
   * @param query - User query
   * @param context - Additional context
   * @param mcpServerId - MCP server ID
   * @param startChunkIndex - Starting chunk index
   */
  private async *streamFromBigQuery(
    query: string,
    context: Record<string, unknown>,
    mcpServerId?: string,
    startChunkIndex: number = 0
  ): AsyncGenerator<OrchestratorStreamOutput, void, unknown> {
    let chunkIndex = startChunkIndex;
    
    try {
      // Generate SQL
      yield {
        success: true,
        content: 'Generating SQL query...',
        done: false,
        chunkIndex: chunkIndex++
      };
      
      if (!this.model) {
        throw new Error('Model not initialized');
      }
      
      // Create prompt for SQL generation
      const sqlPrompt = `
      Generate a BigQuery SQL query to answer this question:
      
      ${query}
      
      ${context ? `Additional context: ${JSON.stringify(context)}` : ''}
      
      Respond with ONLY the SQL query, nothing else:
      `;
      
      // Generate SQL query
      const result = await this.model.generateContent(sqlPrompt);
      const sql = result.response.text().trim();
      
      yield {
        success: true,
        content: `SQL generated: ${sql}`,
        done: false,
        chunkIndex: chunkIndex++
      };
      
      // Execute SQL query
      yield {
        success: true,
        content: 'Executing SQL query...',
        done: false,
        chunkIndex: chunkIndex++
      };
      
      const projectId = this.config.bigQueryProjectId;
      const rows = await executeBigQueryQuery(projectId, sql);
      
      // Final response with data
      const data = {
        type: 'bigquery_result',
        sql,
        rows,
        rowCount: rows.length
      };
      
      yield {
        success: true,
        content: `Query executed with ${rows.length} results.`,
        data,
        done: true,
        metadata: this.createMetadata(SubAgentType.BIGQUERY, mcpServerId),
        chunkIndex: chunkIndex++
      };
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        action: 'streamFromBigQuery',
        query,
        mcpServerId
      });
    }
  }
  
  /**
   * Stream from Firebase sub-agent
   * @param query - User query
   * @param context - Additional context
   * @param mcpServerId - MCP server ID
   * @param startChunkIndex - Starting chunk index
   */
  private async *streamFromFirebase(
    query: string,
    context: Record<string, unknown>,
    mcpServerId?: string,
    startChunkIndex: number = 0
  ): AsyncGenerator<OrchestratorStreamOutput, void, unknown> {
    let chunkIndex = startChunkIndex;
    
    try {
      // Generate Firebase operation
      yield {
        success: true,
        content: 'Analyzing Firebase operation...',
        done: false,
        chunkIndex: chunkIndex++
      };
      
      if (!this.model) {
        throw new Error('Model not initialized');
      }
      
      // Create prompt for Firebase operation analysis
      const firebasePrompt = `
      Determine the Firebase operation to perform based on this request:
      
      ${query}
      
      ${context ? `Additional context: ${JSON.stringify(context)}` : ''}
      
      Respond with a JSON object in the following format:
      {
        "operation": "QUERY|GET|WRITE|DELETE",
        "collection": "collection_name",
        "id": "document_id_if_applicable",
        "data": {data_object_if_applicable},
        "filters": [{"field": "field_name", "operator": "==", "value": value}],
        "limit": number_if_applicable
      }
      
      Response (JSON only):
      `;
      
      // Generate Firebase operation details
      const result = await this.model.generateContent(firebasePrompt);
      const operationText = result.response.text().trim();
      
      // Parse operation details
      let operation;
      try {
        operation = JSON.parse(operationText);
        
        yield {
          success: true,
          content: `Firebase operation determined: ${operation.operation}`,
          done: false,
          chunkIndex: chunkIndex++
        };
      } catch (error) {
        throw new Error('Failed to parse Firebase operation: ' + operationText);
      }
      
      // Execute Firebase operation
      yield {
        success: true,
        content: 'Executing Firebase operation...',
        done: false,
        chunkIndex: chunkIndex++
      };
      
      const projectId = this.config.firebaseProjectId;
      const collection = operation.collection || this.config.firebaseCollection;
      
      let data;
      switch (operation.operation?.toUpperCase()) {
        case 'QUERY':
          const documents = await queryDocuments(
            projectId,
            collection,
            operation.filters,
            operation.limit,
            operation.orderBy
          );
          data = {
            type: 'firebase_query_result',
            collection,
            documents,
            documentCount: documents.length
          };
          break;
          
        case 'GET':
          const document = await getDocument(
            projectId,
            collection,
            operation.id
          );
          data = {
            type: 'firebase_document',
            collection,
            id: operation.id,
            document
          };
          break;
          
        case 'WRITE':
          const id = await writeDocument(
            projectId,
            collection,
            operation.data,
            operation.id
          );
          data = {
            type: 'firebase_write_result',
            collection,
            id,
            success: true
          };
          break;
          
        case 'DELETE':
          const success = await deleteDocument(
            projectId,
            collection,
            operation.id
          );
          data = {
            type: 'firebase_delete_result',
            collection,
            id: operation.id,
            success
          };
          break;
          
        default:
          throw new Error(`Unknown Firebase operation: ${operation.operation}`);
      }
      
      // Final response with data
      yield {
        success: true,
        content: `Firebase ${operation.operation} operation completed successfully.`,
        data,
        done: true,
        metadata: this.createMetadata(SubAgentType.FIREBASE, mcpServerId),
        chunkIndex: chunkIndex++
      };
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        action: 'streamFromFirebase',
        query,
        mcpServerId
      });
    }
  }
  /**
   * Stream from Tool sub-agent
   * @param query - User query
   * @param context - Additional context
   * @param mcpServerId - MCP server ID
   * @param startChunkIndex - Starting chunk index
   */
  private async *streamFromTool(
    query: string,
    context: Record<string, unknown>,
    mcpServerId?: string,
    startChunkIndex: number = 0
  ): AsyncGenerator<OrchestratorStreamOutput, void, unknown> {
    let chunkIndex = startChunkIndex;
    
    try {
      // Prepare for tool execution
      yield {
        success: true,
        content: 'Analyzing tools to use...',
        done: false,
        chunkIndex: chunkIndex++
      };
      
      if (!this.model) {
        throw new Error('Model not initialized');
      }
      
      // Build tools configuration
      const tools: Tool[] = [{
        functionDeclarations: this.toolDeclarations
      }];
      
      // Create chat model with tools
      const chatModel = this.model.startChat({
        generationConfig: {
          temperature: this.config.temperature,
          topP: this.config.topP,
          topK: this.config.topK,
          maxOutputTokens: this.config.maxTokens,
        },
        tools
      });
      
      // Send query to model
      const prompt = `
      ${query}
      
      ${context ? `Additional context: ${JSON.stringify(context)}` : ''}
      `;
      
      yield {
        success: true,
        content: 'Processing with AI model...',
        done: false,
        chunkIndex: chunkIndex++
      };
      
      const result = await chatModel.sendMessage(prompt);
      const response = result.response;
      
      // Check for function calls
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        // Execute function calls
        yield {
          success: true,
          content: `Found ${functionCalls.length} tool(s) to execute...`,
          done: false,
          chunkIndex: chunkIndex++
        };
        
        const results: Record<string, unknown>[] = [];
        
        for (const functionCall of functionCalls) {
          const toolName = functionCall.name;
          const toolInput = JSON.parse(functionCall.args);
          
          yield {
            success: true,
            content: `Executing tool: ${toolName}...`,
            done: false,
            chunkIndex: chunkIndex++
          };
          
          const toolResult = await executeTool(toolName, toolInput);
          results.push({
            tool: toolName,
            input: toolInput,
            result: toolResult
          });
          
          yield {
            success: true,
            content: `Tool ${toolName} executed successfully.`,
            done: false,
            chunkIndex: chunkIndex++
          };
        }
        
        // Final response with data
        const data = {
          type: 'tool_results',
          results,
          text: response.text()
        };
        
        yield {
          success: true,
          content: response.text(),
          data,
          done: true,
          metadata: this.createMetadata(SubAgentType.TOOL, mcpServerId),
          chunkIndex: chunkIndex++
        };
      } else {
        // Return text response if no function calls
        const data = {
          type: 'text_response',
          text: response.text()
        };
        
        yield {
          success: true,
          content: response.text(),
          data,
          done: true,
          metadata: this.createMetadata(SubAgentType.TOOL, mcpServerId),
          chunkIndex: chunkIndex++
        };
      }
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        action: 'streamFromTool',
        query,
        mcpServerId
      });
    }
  }
  /**
   * Route request to appropriate sub-agent
   * @param subAgentType - Sub-agent type
   * @param query - User query
   * @param context - Additional context
   * @param mcpServerId - Optional MCP server ID
   * @returns Sub-agent result
   */
  private async routeToSubAgent(
    subAgentType: SubAgentType,
    query: string,
    context: Record<string, unknown>,
    mcpServerId?: string
  ): Promise<unknown> {
    try {
      // Check if we should use MCP server
      if (mcpServerId) {
        return await this.routeThroughMCPServer(subAgentType, query, context, mcpServerId);
      }
      
      // Route to local implementation if no MCP server specified
      switch (subAgentType) {
        case SubAgentType.BIGQUERY:
          return await this.handleBigQueryRequest(query, context);
        case SubAgentType.FIREBASE:
          return await this.handleFirebaseRequest(query, context);
        case SubAgentType.TOOL:
          return await this.handleToolRequest(query, context);
        default:
          throw new Error(`Unknown sub-agent type: ${subAgentType}`);
      }
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        subAgentType,
        query,
        context: JSON.stringify(context),
        mcpServerId
      });
    }
  }
  
  /**
   * Route through MCP server
   * @param subAgentType - Sub-agent type
   * @param query - User query
   * @param context - Additional context
   * @param mcpServerId - MCP server ID
   * @returns MCP server result
   */
  private async routeThroughMCPServer(
    subAgentType: SubAgentType,
    query: string,
    context: Record<string, unknown>,
    mcpServerId: string
  ): Promise<unknown> {
    try {
      // Get server category based on sub-agent type
      const category = this.getServerCategoryForSubAgentType(subAgentType);
      
      // Get server for the given category and ID
      const server = await this.mcpServerManager.getServer(category, mcpServerId);
      
      if (!server) {
        throw new Error(`MCP server not found: ${mcpServerId}`);
      }
      
      // Prepare request parameters based on sub-agent type
      const params: Record<string, unknown> = {
        query,
        context
      };
      
      // Add sub-agent specific parameters
      switch (subAgentType) {
        case SubAgentType.BIGQUERY:
          params.projectId = this.config.bigQueryProjectId;
          break;
        case SubAgentType.FIREBASE:
          params.projectId = this.config.firebaseProjectId;
          params.collection = this.config.firebaseCollection;
          break;
        case SubAgentType.TOOL:
          params.availableTools = getToolFunctionDeclarations().map(tool => tool.name);
          break;
      }
      
      // Create request ID
      const requestId = `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Send request to MCP server
      console.log(`Routing request to MCP server ${server.id} (${server.name})`);
      
      try {
        // In a real implementation, this would use the MCPClientService
        // For this demonstration, we'll simulate a response
        
        console.log(`Executing ${subAgentType} request on MCP server ${server.id}`);
        
        // Simulate server processing time
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // For demo purposes, fall back to local implementation
        // In a real implementation, this would actually call the MCP server
        
        switch (subAgentType) {
          case SubAgentType.BIGQUERY:
            return await this.handleBigQueryRequest(query, context);
          case SubAgentType.FIREBASE:
            return await this.handleFirebaseRequest(query, context);
          case SubAgentType.TOOL:
            return await this.handleToolRequest(query, context);
          default:
            throw new Error(`Unknown sub-agent type: ${subAgentType}`);
        }
      } catch (error) {
        // Handle MCP server errors
        console.error(`Error from MCP server ${server.id}:`, error);
        
        // If there's an MCP server error, check server health
        await this.mcpServerManager.isServerHealthy(server.id);
        
        // In a production implementation, we could try another server here
        // or implement retries with backoff
        
        throw error;
      }
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        action: 'routeThroughMCPServer',
        subAgentType,
        mcpServerId
      });
    }
  }
  
  /**
   * Get server category for sub-agent type
   * @param subAgentType - Sub-agent type
   * @returns Server category
   */
  private getServerCategoryForSubAgentType(subAgentType: SubAgentType): MCPServerCategory {
    switch (subAgentType) {
      case SubAgentType.BIGQUERY:
        return 'data';
      case SubAgentType.FIREBASE:
        return 'platforms';
      case SubAgentType.TOOL:
        return 'specialized';
      default:
        return 'core';
    }
  }
  }
  
  /**
   * Handle BigQuery requests
   * @param query - User query
   * @param context - Additional context
   * @returns BigQuery result
   */
  private async handleBigQueryRequest(
    query: string,
    context: Record<string, unknown>
  ): Promise<unknown> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized');
      }
      
      // Create prompt for SQL generation
      const sqlPrompt = `
      Generate a BigQuery SQL query to answer this question:
      
      ${query}
      
      ${context ? `Additional context: ${JSON.stringify(context)}` : ''}
      
      Respond with ONLY the SQL query, nothing else:
      `;
      
      // Generate SQL query
      const result = await this.model.generateContent(sqlPrompt);
      const sql = result.response.text().trim();
      
      // Execute SQL query
      const projectId = this.config.bigQueryProjectId;
      const rows = await executeBigQueryQuery(projectId, sql);
      
      return {
        type: 'bigquery_result',
        sql,
        rows,
        rowCount: rows.length
      };
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        action: 'handleBigQueryRequest',
        query
      });
    }
  }
  
  /**
   * Handle Firebase requests
   * @param query - User query
   * @param context - Additional context
   * @returns Firebase result
   */
  private async handleFirebaseRequest(
    query: string,
    context: Record<string, unknown>
  ): Promise<unknown> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized');
      }
      
      // Create prompt for Firebase operation analysis
      const firebasePrompt = `
      Determine the Firebase operation to perform based on this request:
      
      ${query}
      
      ${context ? `Additional context: ${JSON.stringify(context)}` : ''}
      
      Respond with a JSON object in the following format:
      {
        "operation": "QUERY|GET|WRITE|DELETE",
        "collection": "collection_name",
        "id": "document_id_if_applicable",
        "data": {data_object_if_applicable},
        "filters": [{"field": "field_name", "operator": "==", "value": value}],
        "limit": number_if_applicable
      }
      
      Response (JSON only):
      `;
      
      // Generate Firebase operation details
      const result = await this.model.generateContent(firebasePrompt);
      const operationText = result.response.text().trim();
      
      // Parse operation details
      let operation;
      try {
        operation = JSON.parse(operationText);
      } catch (error) {
        throw new Error('Failed to parse Firebase operation: ' + operationText);
      }
      
      // Execute Firebase operation
      const projectId = this.config.firebaseProjectId;
      const collection = operation.collection || this.config.firebaseCollection;
      
      switch (operation.operation?.toUpperCase()) {
        case 'QUERY':
          const documents = await queryDocuments(
            projectId,
            collection,
            operation.filters,
            operation.limit,
            operation.orderBy
          );
          return {
            type: 'firebase_query_result',
            collection,
            documents,
            documentCount: documents.length
          };
          
        case 'GET':
          const document = await getDocument(
            projectId,
            collection,
            operation.id
          );
          return {
            type: 'firebase_document',
            collection,
            id: operation.id,
            document
          };
          
        case 'WRITE':
          const id = await writeDocument(
            projectId,
            collection,
            operation.data,
            operation.id
          );
          return {
            type: 'firebase_write_result',
            collection,
            id,
            success: true
          };
          
        case 'DELETE':
          const success = await deleteDocument(
            projectId,
            collection,
            operation.id
          );
          return {
            type: 'firebase_delete_result',
            collection,
            id: operation.id,
            success
          };
          
        default:
          throw new Error(`Unknown Firebase operation: ${operation.operation}`);
      }
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        action: 'handleFirebaseRequest',
        query 
      });
    }
  }
  /**
   * Handle tool requests
   * @param query - User query
   * @param context - Additional context
   * @returns Tool result
   */
  private async handleToolRequest(
    query: string,
    context: Record<string, unknown>
  ): Promise<unknown> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized');
      }
      
      // Build tools configuration
      const tools: Tool[] = [{
        functionDeclarations: this.toolDeclarations
      }];
      
      // Create chat model with tools
      const chatModel = this.model.startChat({
        generationConfig: {
          temperature: this.config.temperature,
          topP: this.config.topP,
          topK: this.config.topK,
          maxOutputTokens: this.config.maxTokens,
        },
        tools
      });
      
      // Send query to model
      const prompt = `
      ${query}
      
      ${context ? `Additional context: ${JSON.stringify(context)}` : ''}
      `;
      
      const result = await chatModel.sendMessage(prompt);
      const response = result.response;
      
      // Check for function calls
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        // Execute function calls
        const results: Record<string, unknown>[] = [];
        
        for (const functionCall of functionCalls) {
          const toolName = functionCall.name;
          const toolInput = JSON.parse(functionCall.args);
          
          const toolResult = await executeTool(toolName, toolInput);
          results.push({
            tool: toolName,
            input: toolInput,
            result: toolResult
          });
        }
        
        return {
          type: 'tool_results',
          results,
          text: response.text()
        };
      }
      
      // Return text response if no function calls
      return {
        type: 'text_response',
        text: response.text()
      };
    } catch (error) {
      throw errorHandler(mapGeminiError(error), { 
        action: 'handleToolRequest',
        query 
      });
    }
  }
  
  /**
   * Get MCP server category based on sub-agent type
   * @param subAgentType - Type of sub-agent
   * @returns Corresponding MCP server category
   */
  private getServerCategoryForSubAgentType(subAgentType: SubAgentType): MCPServerCategory {
    switch (subAgentType) {
      case SubAgentType.BIGQUERY:
        return MCPServerCategory.DATA;
      case SubAgentType.FIREBASE:
        return MCPServerCategory.DATA;
      case SubAgentType.TOOL:
        return MCPServerCategory.CORE;
      default:
        return MCPServerCategory.CORE;
    }
  }

  /**
   * Create metadata for orchestrator output
   * @param subAgent - Sub-agent type
   * @param mcpServerId - MCP server ID
   * @returns Orchestrator metadata
   */
  private createMetadata(
    subAgent: SubAgentType,
    mcpServerId?: string
  ): OrchestratorMetadata {
    return {
      model: this.config.model,
      processTime: Date.now() - this.startTime,
      subAgent,
      timestamp: new Date().toISOString(),
      ...(mcpServerId ? { mcpServerId } : {})
    };
  }
  
  /**
   * Stream responses from an MCP server
   * @param subAgentType - Type of sub-agent to use
   * @param query - User query
   * @param context - Additional context
   * @param mcpServerId - ID of MCP server to use
   * @param startChunkIndex - Starting chunk index for responses
   * @returns Async generator of orchestrator stream outputs
   */
  private async *streamFromMCPServer(
    subAgentType: SubAgentType,
    query: string,
    context: Record<string, unknown>,
    mcpServerId: string,
    startChunkIndex: number
  ): AsyncGenerator<OrchestratorStreamOutput, void, unknown> {
    try {
      // Get the server category based on sub-agent type
      const category = this.getServerCategoryForSubAgentType(subAgentType);
      
      // Get server for the category and ID
      const server = await this.mcpServerManager.getServer(category, mcpServerId);
      
      if (!server) {
        throw new Error(`MCP server ${mcpServerId} not found or not enabled for category ${category}`);
      }
      
      // Prepare input for MCP server
      const mcpInput = {
        query,
        context,
        options: {
          streaming: true,
          // Include any sub-agent specific options
          subAgentType
        }
      };
      
      // Get MCP client
      const mcpClient = this.mcpServerManager.getMCPClient();
      
      if (!mcpClient) {
        throw new Error('MCP client not available');
      }
      
      let chunkIndex = startChunkIndex;
      
      // Call MCP server with streaming
      const streamGenerator = mcpClient.streamFromServer(
        server.id,
        mcpInput
      );
      
      // Process stream chunks
      for await (const chunk of streamGenerator) {
        if (chunk.error) {
          // Yield error chunk
          yield {
            success: false,
            error: chunk.error,
            done: true,
            metadata: this.createMetadata(subAgentType, mcpServerId),
            chunkIndex: chunkIndex++
          };
          return;
        }
        
        // Yield success chunk
        yield {
          success: true,
          content: chunk.content || '',
          done: chunk.done || false,
          metadata: chunk.metadata 
            ? { ...this.createMetadata(subAgentType, mcpServerId), ...chunk.metadata }
            : this.createMetadata(subAgentType, mcpServerId),
          chunkIndex: chunkIndex++
        };
        
        // If chunk is marked as done, return
        if (chunk.done) {
          return;
        }
      }
      
      // Final chunk if not already sent
      yield {
        success: true,
        content: '',
        done: true,
        metadata: this.createMetadata(subAgentType, mcpServerId),
        chunkIndex: chunkIndex
      };
      
    } catch (error) {
      // Map error
      const errorObject = mapGeminiError(error);
      
      // Yield error response
      yield {
        success: false,
        error: errorObject.message,
        done: true,
        metadata: this.createMetadata(subAgentType, mcpServerId),
        chunkIndex: startChunkIndex
      };
    }
  }
  
  /**
   * Generate cache key
   * @param query - User query
   * @param context - Additional context
   * @returns Cache key
   */
  private getCacheKey(
    query: string,
    context: Record<string, unknown> = {}
  ): string {
    const normalizedQuery = query.trim().toLowerCase();
    const contextString = JSON.stringify(context);
    return `${normalizedQuery}|${contextString}`;
  }
  
  /**
   * Check if cache is still valid
   * @param timestamp - Cache timestamp
   * @param options - Cache options
   * @returns Is cache valid
   */
  private isCacheValid(
    timestamp: number,
    options?: CacheOptions
  ): boolean {
    if (!options) {
      // Default cache TTL: 5 minutes
      return Date.now() - timestamp < 5 * 60 * 1000;
    }
    
    return Date.now() - timestamp < (options.ttlSeconds || 300) * 1000;
  }
}

// Export for backwards compatibility
export function geminiOrchestrator(): string {
  return 'gemini-orchestrator';
}

/**
 * Create a new Gemini orchestrator instance
 * @param options - Optional configuration
 * @returns Gemini orchestrator instance
 */
export function createGeminiOrchestrator(
  options?: { mcpServerManager?: MCPServerManager }
): GeminiOrchestrator {
  return new GeminiOrchestrator(options?.mcpServerManager);
}
