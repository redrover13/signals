/**
 * @fileoverview vertex module for the services component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

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
