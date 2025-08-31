/**
 * @fileoverview RAG client implementation for Gemini Orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides integration with Vertex AI for Retrieval-Augmented Generation.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { VertexAIClient, DocumentChunk, RAGSearchOptions } from '@nx-monorepo/adk';
import { errorHandler } from '../utils/error-handler';
import { GeminiErrorCategory } from '../utils/error-handler';

/**
 * Interface for RAG client operations
 */
export interface RAGClientInterface {
  /**
   * Search for relevant documents based on a query
   * @param query - User query
   * @param options - Search options
   * @returns Search results
   */
  searchDocuments(query: string, options?: Partial<RAGSearchOptions>): Promise<any[]>;
  
  /**
   * Process a document for RAG operations
   * @param content - Document content
   * @param metadata - Document metadata
   * @param options - Processing options
   * @returns Processed document chunks
   */
  processDocument(
    content: string, 
    metadata: Record<string, any>,
    options?: {
      dataStoreId?: string;
      chunkSize?: number;
      overlap?: number;
      generateEmbeddings?: boolean;
    }
  ): Promise<DocumentChunk[]>;
  
  /**
   * Extract text from a file for RAG processing
   * @param fileBuffer - File buffer
   * @param mimeType - File MIME type
   * @param fileName - File name
   * @returns Extracted text content
   */
  extractTextFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<string>;
  
  /**
   * Generate embeddings for text content
   * @param texts - Array of text strings
   * @returns Embedding response with vectors
   */
  generateEmbeddings(texts: string[]): Promise<{ embeddings: number[][] }>;
}

/**
 * RAG client implementation using Vertex AI
 */
export class RAGClient implements RAGClientInterface {
  private vertexClient: VertexAIClient;
  private defaultDataStoreId: string;
  private defaultSearchEngineId: string;
  
  /**
   * Constructor
   * @param config - Configuration options
   */
  constructor(config: {
    projectId: string;
    location: string;
    embeddingModel?: string;
    defaultDataStoreId?: string;
    defaultSearchEngineId?: string;
  }) {
    this.vertexClient = new VertexAIClient({
      projectId: config.projectId,
      location: config.location,
      embeddingModel: config.embeddingModel
    });
    
    this.defaultDataStoreId = config.defaultDataStoreId || 'default-datastore';
    this.defaultSearchEngineId = config.defaultSearchEngineId || 'default-search-engine';
  }
  
  /**
   * Search for documents using RAG
   * @param query - User query
   * @param options - Search options
   * @returns Search results
   */
  async searchDocuments(
    query: string, 
    options: Partial<RAGSearchOptions> = {}
  ): Promise<any[]> {
    try {
      const searchEngineId = options.searchEngineId || this.defaultSearchEngineId;
      
      const searchOptions: RAGSearchOptions = {
        query,
        maxResults: options.maxResults || 5,
        filter: options.filter
      };
      
      return await this.vertexClient.searchDocuments(searchEngineId, searchOptions);
    } catch (error) {
      throw errorHandler({
        message: `RAG search failed: ${error.message}`,
        category: GeminiErrorCategory.RAG_SEARCH_ERROR,
        originalError: error
      });
    }
  }
  
  /**
   * Process a document for RAG
   * @param content - Document content
   * @param metadata - Document metadata
   * @param options - Processing options
   * @returns Processed document chunks
   */
  async processDocument(
    content: string,
    metadata: Record<string, any>,
    options: {
      dataStoreId?: string;
      chunkSize?: number;
      overlap?: number;
      generateEmbeddings?: boolean;
    } = {}
  ): Promise<DocumentChunk[]> {
    try {
      const dataStoreId = options.dataStoreId || this.defaultDataStoreId;
      
      return await this.vertexClient.processDocumentForRAG(
        content,
        metadata,
        dataStoreId,
        {
          chunkSize: options.chunkSize,
          overlap: options.overlap,
          generateEmbeddings: options.generateEmbeddings
        }
      );
    } catch (error) {
      throw errorHandler({
        message: `RAG document processing failed: ${error.message}`,
        category: GeminiErrorCategory.RAG_PROCESSING_ERROR,
        originalError: error
      });
    }
  }
  
  /**
   * Extract text from a file for RAG processing
   * @param fileBuffer - File buffer
   * @param mimeType - File MIME type
   * @param fileName - File name
   * @returns Extracted text content
   */
  async extractTextFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<string> {
    try {
      return await this.vertexClient.extractTextFromFile(fileBuffer, mimeType, fileName);
    } catch (error) {
      throw errorHandler({
        message: `Text extraction failed: ${error.message}`,
        category: GeminiErrorCategory.RAG_EXTRACTION_ERROR,
        originalError: error
      });
    }
  }
  
  /**
   * Generate embeddings for text content
   * @param texts - Array of text strings
   * @returns Embedding response with vectors
   */
  async generateEmbeddings(texts: string[]): Promise<{ embeddings: number[][] }> {
    try {
      return await this.vertexClient.generateEmbeddings(texts);
    } catch (error) {
      throw errorHandler({
        message: `Embedding generation failed: ${error.message}`,
        category: GeminiErrorCategory.RAG_EMBEDDING_ERROR,
        originalError: error
      });
    }
  }
}
