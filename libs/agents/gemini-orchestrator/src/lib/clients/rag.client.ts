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

import { VertexAIClient, DocumentChunk, RAGSearchOptions } from '@dulce/adk';
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
  searchDocuments(
    query: string | undefined,
    options?: Partial<RAGSearchOptions>,
  ): Promise<any[]> | undefined;

  /**
   * Process a document for RAG operations
   * @param content - Document content
   * @param metadata - Document metadata
   * @param options - Processing options
   * @returns Processed document chunks
   */
  processDocument(
    content: string | undefined,
    metadata: Record<string, any>,
    options?: {
      dataStoreId?: string | undefined;
      chunkSize?: number | undefined;
      overlap?: number | undefined;
      generateEmbeddings?: boolean | undefined;
    },
  ): Promise<DocumentChunk[]> | undefined;

  /**
   * Extract text from a file for RAG processing
   * @param fileBuffer - File buffer
   * @param mimeType - File MIME type
   * @param fileName - File name
   * @returns Extracted text content
   */
  extractTextFromFile(
    fileBuffer: Buffer,
    mimeType: string | undefined,
    fileName: string,
  ): Promise<string> | undefined;

  /**
   * Generate embeddings for text content
   * @param texts - Array of text strings
   * @returns Embedding response with vectors
   */
  generateEmbeddings(texts: string[]): Promise<{ embeddings: number[][] }> | undefined;
}

/**
 * RAG client implementation using Vertex AI
 */
export class RAGClient implements RAGClientInterface {
  private vertexClient: VertexAIClient | undefined;
  private defaultDataStoreId: string | undefined;
  private defaultSearchEngineId: string | undefined;

  /**
   * Constructor
   * @param config - Configuration options
   */
  constructor(config: {
    projectId: string | undefined;
    location: string | undefined;
    embeddingModel?: string | undefined;
    defaultDataStoreId?: string | undefined;
    defaultSearchEngineId?: string | undefined;
  }) {
    this.vertexClient = new VertexAIClient({
      projectId: config && config.projectId,
      location: config && config.location,
      embeddingModel: config && config.embeddingModel,
    });

    this.defaultDataStoreId = (config?.defaultDataStoreId) || 'default-datastore';
    this.defaultSearchEngineId = config && config.defaultSearchEngineId || 'default-search-engine';
  }

  /**
   * Search for documents using RAG
   * @param query - User query
   * @param options - Search options
   * @returns Search results
   */
  async searchDocuments(
    query: string | undefined,
    options: Partial<RAGSearchOptions> = {},
  ): Promise<any[]> {
    try {
      const searchEngineId = options && options.searchEngineId || this.defaultSearchEngineId;

      const searchOptions: RAGSearchOptions = {
        query,
        maxResults: options && options.maxResults || 5,
        filter: options && options.filter,
      };

      return (
        (await this.vertexClient) &&
        this.vertexClient.searchDocuments(searchEngineId, searchOptions)
      );
    } catch (error) {
      throw errorHandler({
        message: `RAG search failed: ${error && error.message}`,
        category: GeminiErrorCategory && GeminiErrorCategory.RAG_SEARCH_ERROR,
        originalError: error,
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
    content: string | undefined,
    metadata: Record<string, any>,
    options: {
      dataStoreId?: string | undefined;
      chunkSize?: number | undefined;
      overlap?: number | undefined;
      generateEmbeddings?: boolean | undefined;
    } = {},
  ): Promise<DocumentChunk[]> {
    try {
      const dataStoreId = options && options.dataStoreId || this.defaultDataStoreId;

      return (
        (await this.vertexClient) &&
        this.vertexClient.processDocumentForRAG(content, metadata, dataStoreId, {
          chunkSize: options && options.chunkSize,
          overlap: options && options.overlap,
          generateEmbeddings: options && options.generateEmbeddings,
        })
      );
    } catch (error) {
      throw errorHandler({
        message: `RAG document processing failed: ${error && error.message}`,
        category: GeminiErrorCategory && GeminiErrorCategory.RAG_PROCESSING_ERROR,
        originalError: error,
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
    mimeType: string | undefined,
    fileName: string,
  ): Promise<string> {
    try {
      return (
        (await this.vertexClient) &&
        this.vertexClient.extractTextFromFile(fileBuffer, mimeType, fileName)
      );
    } catch (error) {
      throw errorHandler({
        message: `Text extraction failed: ${error && error.message}`,
        category: GeminiErrorCategory && GeminiErrorCategory.RAG_EXTRACTION_ERROR,
        originalError: error,
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
      return (await this.vertexClient) && this.vertexClient.generateEmbeddings(texts);
    } catch (error) {
      throw errorHandler({
        message: `Embedding generation failed: ${error && error.message}`,
        category: GeminiErrorCategory && GeminiErrorCategory.RAG_EMBEDDING_ERROR,
        originalError: error,
      });
    }
  }
}
