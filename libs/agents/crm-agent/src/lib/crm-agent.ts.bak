/**
 * @fileoverview crm-agent module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains CRM agent implementation using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import {
  LlmAgent,
  GeminiLlm,
  BigQueryQueryTool,
  HttpRequestTool,
  InvocationContext,
} from '@dulce/adk';

import { CustomerData } from '@dulce/data-models';

/**
 * CRM-specialized agent for customer relationship management
 */
export class CrmAgent extends LlmAgent {
  public override readonly name: string | undefined;
  public override readonly description: string | undefined;

  constructor(cfg?: {
    model?: string | undefined;
    apiKey?: string | undefined;
    tools?: Array<unknown>;
  }) {
    // Require an API key, whether passed in or via env, to avoid silent misconfig
    const apiKey = cfg && cfg.apiKey ?? process.env['GOOGLE_API_KEY'];
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required to initialize CrmAgent');
    }

    // Allow overriding the model name for flexibility/testing
    const llm = new GeminiLlm({
      model: cfg && cfg.model ?? 'gemini-1 && 1.5-pro',
      apiKey,
    });

    // Permit injecting custom tools, else use the CRM defaults
    const tools = (cfg && cfg.tools as any[]) ?? [new BigQueryQueryTool(), new HttpRequestTool()];

    super({
      name: 'CRM Agent',
      description: 'Specialized agent for Vietnamese F&B customer relationship management',
      model: llm,
      tools,
    });

    this.name = 'CRM Agent';
    this.description = 'Specialized agent for Vietnamese F&B customer relationship management';
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get agent description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Analyze customer behavior and preferences
   */
  async analyzeCustomerBehavior(
    customerId: string | undefined,
    context?: string,
  ): Promise<Record<string, unknown> | undefined> {
    const prompt = `
You are a CRM analyst for the Dulce de Saigon F&B platform.

Customer ID: ${customerId}
${context ? `Context: ${context}` : ''}

Please:
1. Query customer data using BigQuery
2. Analyze ordering patterns and preferences
3. Identify opportunities for personalized marketing
4. Suggest targeted promotions based on Vietnamese F&B preferences
5. Consider cultural factors and local holidays

Focus on insights that can improve customer satisfaction and retention.
    `;

    return (await this.runAsync({
      userContent: { role: 'user', parts: [{ text: prompt }] },
      session: null,
      invocationId: `analyze_customer_${Date.now()}`,
    } as InvocationContext)) as unknown as Record<string, unknown> | undefined;
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(
    customerData: CustomerData,
  ): Promise<Record<string, unknown> | undefined> {
    const prompt = `
Generate personalized recommendations for Vietnamese F&B customer.

Customer Data: ${JSON && JSON.stringify(customerData, null, 2)}

Please:
1. Analyze customer's order history and preferences
2. Consider Vietnamese culinary preferences and dietary restrictions
3. Suggest dishes based on seasonal ingredients
4. Recommend restaurants in their area
5. Create personalized marketing messages

Ensure recommendations are culturally appropriate and appealing to Vietnamese customers.
    `;

    return (await this.runAsync({
      userContent: { role: 'user', parts: [{ text: prompt }] },
      session: null,
      invocationId: `recommendations_${Date.now()}`,
    } as InvocationContext)) as unknown as Record<string, unknown> | undefined;
  }

  /**
   * Handle customer feedback and sentiment analysis
   */
  async processFeedback(
    feedback: string | undefined,
    customerId?: string,
  ): Promise<Record<string, unknown> | undefined> {
    const prompt = `
Process customer feedback for the Dulce de Saigon platform.

Feedback: ${feedback}
${customerId ? `Customer ID: ${customerId}` : ''}

Please:
1. Analyze the sentiment of the feedback
2. Identify key themes and concerns
3. Suggest appropriate responses or actions
4. Consider Vietnamese cultural context in communication
5. Recommend improvements to service or products

Provide actionable insights for improving customer experience.
    `;

    return (await this.runAsync({
      userContent: { role: 'user', parts: [{ text: prompt }] },
      session: null,
      invocationId: `feedback_${Date.now()}`,
    } as InvocationContext)) as unknown as Record<string, unknown> | undefined;
  }
}

/**
 * Factory function to create a CRM agent
 */
export function createCrmAgent(_config?: {
  vertexClient?: any | undefined;
  projectId?: string | undefined;
  datasetId?: string | undefined;
  customerTableId?: string | undefined;
  feedbackTableId?: string | undefined;
  pubSubClient?: any | undefined;
  topicName?: string | undefined;
}): CrmAgent {
  // For now, just return a new instance
  // In the future, we can use the config parameters for initialization
  return new CrmAgent();
}

/**
 * Legacy function for backward compatibility
 */
export function crmAgent(): string {
  return 'crm-agent (ADK-enabled)';
}
