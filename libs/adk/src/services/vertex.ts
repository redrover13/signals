/**
 * @fileoverview vertex module for the services component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { GeminiLlm, BaseLlm, LlmRequest, LlmResponse } from '@waldzellai/adk-typescript';

/**
 * Configuration interface for Vertex AI client using ADK
 */
export interface VertexAIClientConfig {
  project?: string;
  location?: string;
  endpointId?: string;
  model?: string;
  apiKey?: string;
}

/**
 * Vertex AI client implementation using Google's ADK
 * Provides integration with Vertex AI through ADK's LLM abstraction
 */
export class VertexAIClient {
  private llm: BaseLlm;
  private config: VertexAIClientConfig;

  constructor(config: VertexAIClientConfig) {
    this.config = {
      project: config.project || process.env.GCP_PROJECT_ID,
      location: config.location || process.env.GCP_LOCATION || 'us-central1',
      endpointId: config.endpointId || process.env.VERTEX_AI_ENDPOINT_ID,
      model: config.model || 'gemini-1.5-pro',
      apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
      ...config,
    };

    // Initialize Gemini LLM using ADK
    this.llm = new GeminiLlm({
      apiKey: this.config.apiKey,
      model: this.config.model,
    });
  }

  /**
   * Make a prediction using the Vertex AI model
   * @param instancePayload - The input data for prediction
   * @returns Promise with prediction results
   */
  async predict(instancePayload: any): Promise<any> {
    try {
      const request: LlmRequest = {
        messages: [
          {
            role: 'user',
            content: JSON.stringify(instancePayload),
          },
        ],
      };

      const response: LlmResponse = await this.llm.invoke(request);
      
      return {
        predictions: [response.content],
        metadata: {
          model: this.config.model,
          project: this.config.project,
          location: this.config.location,
        },
      };
    } catch (error) {
      throw new Error(`Vertex AI prediction failed: ${error}`);
    }
  }

  /**
   * Generate text using the LLM
   * @param prompt - Input prompt
   * @param options - Additional generation options
   * @returns Generated text response
   */
  async generateText(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const request: LlmRequest = {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      ...(options?.maxTokens && { max_tokens: options.maxTokens }),
      ...(options?.temperature && { temperature: options.temperature }),
    };

    const response = await this.llm.invoke(request);
    return response.content || '';
  }

  /**
   * Get the underlying LLM instance for advanced usage
   * @returns The ADK LLM instance
   */
  getLlm(): BaseLlm {
    return this.llm;
  }

  /**
   * Get current configuration
   * @returns Current client configuration
   */
  getConfig(): VertexAIClientConfig {
    return { ...this.config };
  }
}
