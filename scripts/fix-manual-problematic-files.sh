#!/bin/bash

# Script to manually fix specific problematic files
echo "🔧 Fixing problematic files manually..."

# Fix vertex.ts
echo "Fixing libs/adk/src/services/vertex.ts..."
cat > /home/g_nelson/signals-1/libs/adk/src/services/vertex.ts.fixed << 'EOF'
import { VertexAI } from '@google-cloud/vertexai';
import { GenModel } from '@google/generative-ai';
import { GeminiConfig, extractGeminiResponseText, formatGeminiError } from '../utilities/gemini';
import { VertexIndexer } from './vertex-indexer';
import { VertexEmbedder } from './vertex-embedder';
import { EmbeddingConfig } from '../interfaces/embedding-config';
import { FeatureDetails, DocumentChunk } from '../interfaces/document-chunk';
import { Buffer } from 'buffer';

export class VertexClient {
  private vertex: VertexAI;
  private indexer: VertexIndexer;
  private embedder: VertexEmbedder;
  private predictionClient: any;
  private endpointId: string;
  private projectId: string;
  private location: string;
  private modelName: string;
  private temperature: number;
  private maxOutputTokens: number;
  private topK: number;
  private topP: number;

  constructor(config: GeminiConfig & { projectId: string; location: string; endpointId?: string }) {
    this.projectId = config.projectId;
    this.location = config.location;
    this.modelName = config.modelName;
    this.temperature = config.temperature || 0.2;
    this.maxOutputTokens = config.maxOutputTokens || 1024;
    this.topK = config.topK || 40;
    this.topP = config.topP || 0.8;
    this.endpointId = config.endpointId || '';

    // Initialize Vertex AI
    this.vertex = new VertexAI({
      project: this.projectId,
      location: this.location,
    });

    // Initialize indexing and embedding
    this.indexer = new VertexIndexer({
      projectId: this.projectId,
      location: this.location,
    });

    this.embedder = new VertexEmbedder({
      projectId: this.projectId,
      location: this.location,
    });

    // Initialize Prediction client if endpoint is provided
    if (this.endpointId) {
      const { PredictionServiceClient } = require('@google-cloud/aiplatform');
      this.predictionClient = new PredictionServiceClient();
    }
  }

  async generateContent(promptText: string): Promise<string> {
    try {
      // Get the generative model
      const generativeModel = this.vertex.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxOutputTokens,
          topK: this.topK,
          topP: this.topP,
        },
      });

      // Generate content
      const response = await generativeModel.generateContent(promptText);
      return extractGeminiResponseText(response);
    } catch (error) {
      console.error('Error generating content:', formatGeminiError(error));
      throw error;
    }
  }

  async generateContentStream(promptText: string): Promise<ReadableStream<any>> {
    try {
      // Get the generative model
      const generativeModel = this.vertex.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxOutputTokens,
          topK: this.topK,
          topP: this.topP,
        },
      });

      // Generate content stream
      const responseStream = await generativeModel.generateContentStream(promptText);
      return responseStream.stream;
    } catch (error) {
      console.error('Error generating content stream:', formatGeminiError(error));
      throw error;
    }
  }

  async createEmbedding(text: string, config?: EmbeddingConfig): Promise<number[]> {
    try {
      return await this.embedder.createEmbedding(text, config);
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async createEmbeddings(texts: string[], config?: EmbeddingConfig): Promise<number[][]> {
    try {
      return await this.embedder.createEmbeddings(texts, config);
    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw error;
    }
  }

  async createIndex(displayName: string, description: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      return await this.indexer.createIndex(displayName, description, metadata);
    } catch (error) {
      console.error('Error creating index:', error);
      throw error;
    }
  }

  async listIndices(): Promise<any[]> {
    try {
      return await this.indexer.listIndices();
    } catch (error) {
      console.error('Error listing indices:', error);
      throw error;
    }
  }

  async deleteIndex(indexId: string): Promise<void> {
    try {
      await this.indexer.deleteIndex(indexId);
    } catch (error) {
      console.error('Error deleting index:', error);
      throw error;
    }
  }

  async createDataStore(indexId: string, displayName: string, description: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      return await this.indexer.createDataStore(indexId, displayName, description, metadata);
    } catch (error) {
      console.error('Error creating data store:', error);
      throw error;
    }
  }

  async listDataStores(indexId: string): Promise<any[]> {
    try {
      return await this.indexer.listDataStores(indexId);
    } catch (error) {
      console.error('Error listing data stores:', error);
      throw error;
    }
  }

  async deleteDataStore(indexId: string, dataStoreId: string): Promise<void> {
    try {
      await this.indexer.deleteDataStore(indexId, dataStoreId);
    } catch (error) {
      console.error('Error deleting data store:', error);
      throw error;
    }
  }

  async indexDocuments(dataStoreId: string, documents: DocumentChunk[]): Promise<void> {
    try {
      await this.indexer.indexDocuments(dataStoreId, documents);
    } catch (error) {
      console.error('Error indexing documents:', error);
      throw error;
    }
  }

  async createDocumentChunks(text: string, chunkSize = 1000, chunkOverlap = 200, features: FeatureDetails[] = []): Promise<DocumentChunk[]> {
    try {
      // Split text into chunks
      const chunks: DocumentChunk[] = [];
      let startIndex = 0;

      while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        const chunkText = text.substring(startIndex, endIndex);

        chunks.push({
          id: `chunk-${startIndex}`,
          text: chunkText,
          metadata: {
            startIndex,
            endIndex,
          },
          features,
        });

        startIndex = endIndex - chunkOverlap;
      }

      // Generate embeddings for each chunk
      const embeddingTexts = chunks.map((chunk) => chunk.text);
      const embeddingResponses = await this.createEmbeddings(embeddingTexts);

      // Add embeddings to chunks
      chunks.forEach((chunk, index) => {
        if (chunk && embeddingResponses && embeddingResponses[index]) {
          chunk.embedding = embeddingResponses[index];
        }
      });

      await this.indexDocuments(dataStoreId, chunks);
      return chunks;
    } catch (error) {
      console.error('Error creating document chunks:', error);
      throw error;
    }
  }

  async predict(instancePayload: any): Promise<any> {
    const endpoint = `projects/${this.projectId}/locations/${this.location}/endpoints/${this.endpointId}`;
    const request = {
      endpoint,
      instances: [instancePayload],
    };
    return this.predictionClient && this.predictionClient.predict(request);
  }
}
EOF

cat > /home/g_nelson/signals-1/libs/mcp/src/lib/clients/mcp-client.service.ts.fixed << 'EOF'
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, firstValueFrom, of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { MCPConfig } from '../interfaces/mcp-config.interface';
import { MCPServerConfig } from '../interfaces/mcp-server-config.interface';
import { HealthCheckResult } from '../interfaces/health-check-result.interface';
import { MCPResponse } from '../interfaces/mcp-response.interface';
import { MCPRequest } from '../interfaces/mcp-request.interface';
import { MCPInvocationLoggingService } from '../services/mcp-invocation-logging.service';
import { LogLevel } from '../enums/log-level.enum';
import { ErrorCodes } from '../enums/error-codes.enum';
import { MCPError } from '../errors/mcp.error';
import { ServerHealthMonitoringService } from '../services/server-health-monitoring.service';
import { ServerHealthStatus } from '../interfaces/server-health-status.interface';

@Injectable()
export class MCPClientService {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly loggingService: MCPInvocationLoggingService,
    private readonly healthMonitoring: ServerHealthMonitoringService,
    private readonly config: MCPConfig
  ) {
    this.setupHealthChecks();
  }
  
  private setupHealthChecks(): void {
    try {
      if (this.config?.global.healthMonitoring && this.config?.global.healthMonitoring.enabled) {
        const interval = this.config.global.healthMonitoring.interval || 60000;
        
        // Clear any existing interval
        if (this.healthCheckInterval) {
          clearInterval(this.healthCheckInterval);
        }
        
        // Set up new interval
        this.healthCheckInterval = setInterval(() => {
          this.checkAllServersHealth();
        }, interval);
        
        this.loggingService.log(
          LogLevel.INFO,
          `Health monitoring enabled with interval: ${interval}ms`
        );
      }
    } catch (error) {
      this.loggingService.error(
        'Failed to setup health checks',
        error
      );
    }
  }
  
  private async connectToServer(config: MCPServerConfig): Promise<void> {
    try {
      const healthCheck = await this.checkServerHealth(config);
      if (healthCheck && healthCheck.status === 'healthy') {
        this.loggingService.log(
          LogLevel.INFO,
          `Successfully connected to server: ${config.name}`
        );
      } else {
        throw new MCPError(
          ErrorCodes.SERVER_UNHEALTHY,
          `Server ${config.name} is unhealthy: ${healthCheck?.details || 'No details available'}`
        );
      }
    } catch (error) {
      this.loggingService.error(
        `Failed to connect to server: ${config.name}`,
        error
      );
      throw error;
    }
  }
  
  async checkServerHealth(config: MCPServerConfig): Promise<HealthCheckResult | null> {
    try {
      const url = `${config.url}/health`;
      
      this.loggingService.log(
        LogLevel.DEBUG,
        `Checking health for server: ${config.name} at ${url}`
      );
      
      const response = await firstValueFrom(
        this.httpService.get<HealthCheckResult>(url).pipe(
          catchError((error: AxiosError) => {
            this.loggingService.error(
              `Health check failed for server: ${config.name}`,
              error
            );
            return of({
              data: {
                status: 'unhealthy',
                details: error.message,
              } as HealthCheckResult,
            } as AxiosResponse);
          })
        )
      );
      
      const result = response.data;
      
      // Update server health status
      this.healthMonitoring.updateServerHealth(config.name, {
        timestamp: new Date().toISOString(),
        status: result.status === 'healthy' ? 'healthy' : 'unhealthy',
        details: result.details,
        latency: result.latency || 0,
      });
      
      return result;
    } catch (error) {
      this.loggingService.error(
        `Error during health check for server: ${config.name}`,
        error
      );
      
      // Update server health as unhealthy
      this.healthMonitoring.updateServerHealth(config.name, {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error',
        latency: 0,
      });
      
      return null;
    }
  }
  
  async checkAllServersHealth(): Promise<Record<string, ServerHealthStatus>> {
    const results: Record<string, ServerHealthStatus> = {};
    
    if (!this.config || !this.config.servers) {
      return results;
    }
    
    for (const server of this.config.servers) {
      if (server.enabled) {
        try {
          const health = await this.checkServerHealth(server);
          results[server.name] = this.healthMonitoring.getServerHealth(server.name);
        } catch (error) {
          this.loggingService.error(
            `Failed to check health for server: ${server.name}`,
            error
          );
        }
      }
    }
    
    return results;
  }
  
  async invokeServer(
    serverName: string,
    request: MCPRequest
  ): Promise<MCPResponse> {
    const server = this.getServerConfig(serverName);
    if (!server) {
      throw new MCPError(
        ErrorCodes.SERVER_NOT_FOUND,
        `Server not found: ${serverName}`
      );
    }
    
    if (!server.enabled) {
      throw new MCPError(
        ErrorCodes.SERVER_DISABLED,
        `Server is disabled: ${serverName}`
      );
    }
    
    // Get current health status
    const health = this.healthMonitoring.getServerHealth(serverName);
    if (health && health.status === 'unhealthy') {
      throw new MCPError(
        ErrorCodes.SERVER_UNHEALTHY,
        `Server is unhealthy: ${serverName} - ${health.details}`
      );
    }
    
    const url = `${server.url}/invoke`;
    const startTime = Date.now();
    
    try {
      this.loggingService.logRequest(serverName, request);
      
      const response = await firstValueFrom(
        this.httpService.post<MCPResponse>(url, request).pipe(
          catchError((error: AxiosError) => {
            const mcpError = new MCPError(
              ErrorCodes.SERVER_INVOCATION_FAILED,
              `Failed to invoke server: ${serverName}`,
              error
            );
            
            this.loggingService.logError(serverName, request, mcpError);
            this.healthMonitoring.recordFailure(serverName);
            
            return throwError(() => mcpError);
          })
        )
      );
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      this.loggingService.logResponse(serverName, request, response.data, latency);
      this.healthMonitoring.recordSuccess(serverName, latency);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  getServerConfig(serverName: string): MCPServerConfig | undefined {
    return this.config?.servers?.find((s) => s.name === serverName);
  }
  
  getServerHealthStatus(serverName: string): ServerHealthStatus | null {
    return this.healthMonitoring.getServerHealth(serverName);
  }
  
  getAllServersHealthStatus(): Record<string, ServerHealthStatus> {
    return this.healthMonitoring.getAllServersHealth();
  }
  
  getEnabledServers(): MCPServerConfig[] {
    return this.config?.servers?.filter((server) => server.enabled) || [];
  }
}
EOF

cat > /home/g_nelson/signals-1/libs/utils/signals/index.ts.fixed << 'EOF'
import { computed, signal, Signal } from '@angular/core';

export interface CreateSignalOptions {
  /**
   * Enable debugging for this signal by logging updates to console
   */
  debug?: boolean;
  /**
   * Name for debugging output
   */
  name?: string;
}

/**
 * Creates a signal with the provided initial value and options
 * @param initialValue The initial value for the signal
 * @param options Optional configuration
 * @returns A signal with the provided value
 */
export function createSignal<T>(initialValue: T, options?: CreateSignalOptions): Signal<T> {
  const internalSignal = signal<T>(initialValue);
  
  if (options?.debug) {
    const name = options.name || 'Signal';
    console.log(`${name} created with initial value:`, initialValue);
    
    const originalSet = internalSignal.set;
    internalSignal.set = (newValue: T) => {
      console.log(`${name} updating:`, {
        previous: internalSignal(),
        new: newValue,
      });
      originalSet(newValue);
    };
  }
  
  return internalSignal;
}

/**
 * Creates a persistent signal that saves its value to localStorage
 * @param key The localStorage key to use
 * @param initialValue The initial value (used if nothing exists in localStorage)
 * @returns A signal that persists its value
 */
export function createPersistentSignal<T>(key: string, initialValue: T): Signal<T> {
  // Get the stored value from localStorage
  let storedValue: T;
  try {
    const item = window.localStorage.getItem(key || "");
    storedValue = item ? JSON.parse(item) : initialValue || undefined;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    storedValue = initialValue;
  }
  
  // Create a signal with the stored or initial value
  const persistentSignal = signal<T>(storedValue);
  
  // Create a wrapped signal with a custom setter that updates localStorage
  const originalSet = persistentSignal.set;
  persistentSignal.set = (newValue: T) => {
    try {
      window.localStorage.setItem(key || "", JSON.stringify(newValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    originalSet(newValue);
  };
  
  return persistentSignal;
}

/**
 * Creates a derived signal based on a computation function
 * @param computeFn Function that derives a new value
 * @returns A computed signal
 */
export function createDerivedSignal<T>(computeFn: () => T): Signal<T> {
  const derivedValue = computed(computeFn);
  return derivedValue;
}

/**
 * Creates a signal with a value and a setter function
 * @param initialValue The initial value
 * @returns A tuple containing the signal and its setter
 */
export function createStateSignal<T>(initialValue: T): [Signal<T>, (value: T) => void] {
  const signal = createSignal<T>(initialValue);
  return [signal as T, signal.set];
}

export * from './src/index';
EOF

cp /home/g_nelson/signals-1/libs/adk/src/services/vertex.ts.fixed /home/g_nelson/signals-1/libs/adk/src/services/vertex.ts
cp /home/g_nelson/signals-1/libs/mcp/src/lib/clients/mcp-client.service.ts.fixed /home/g_nelson/signals-1/libs/mcp/src/lib/clients/mcp-client.service.ts
cp /home/g_nelson/signals-1/libs/utils/signals/index.ts.fixed /home/g_nelson/signals-1/libs/utils/signals/index.ts

echo "✅ Manual fixes applied to problematic files!"
