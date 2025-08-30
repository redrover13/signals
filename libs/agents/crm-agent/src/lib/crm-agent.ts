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
  DulceLlmAgent,
  GeminiLlm,
  BigQueryQueryTool,
  HttpRequestTool
} from '@nx-monorepo/adk';

/**
 * Customer data interface
 */
export interface CustomerData {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, any>;
  orderHistory?: any[];
  location?: string;
}

/**
 * CRM-specialized agent for customer relationship management
 */
export class CrmAgent extends DulceLlmAgent {
  constructor(cfg?: { model?: string; apiKey?: string; tools?: Array<unknown> }) {
    // Require an API key, whether passed in or via env, to avoid silent misconfig
    const apiKey = cfg?.apiKey ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required to initialize CrmAgent');
    }

    // Allow overriding the model name for flexibility/testing
    const llm = new GeminiLlm({
      model: cfg?.model ?? 'gemini-1.5-pro',
      apiKey,
    });

    // Permit injecting custom tools, else use the CRM defaults
    const tools = cfg?.tools ?? [
      new BigQueryQueryTool(),
      new HttpRequestTool(),
    ];

    super({
      name: 'CRM Agent',
      description: 'Specialized agent for Vietnamese F&B customer relationship management',
      llm,
      tools,
    });
  }

  /**
   * Analyze customer behavior and preferences
   */
  async analyzeCustomerBehavior(customerId: string, context?: string): Promise<any> {
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

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(customerData: CustomerData): Promise<any> {
    const prompt = `
Generate personalized recommendations for Vietnamese F&B customer.

Customer Data: ${JSON.stringify(customerData, null, 2)}

Please:
1. Analyze customer's order history and preferences
2. Consider Vietnamese culinary preferences and dietary restrictions
3. Suggest dishes based on seasonal ingredients
4. Recommend restaurants in their area
5. Create personalized marketing messages

Ensure recommendations are culturally appropriate and appealing to Vietnamese customers.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Handle customer feedback and sentiment analysis
   */
  async processFeedback(feedback: string, customerId?: string): Promise<any> {
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

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }
}

/**
 * Factory function to create a CRM agent
 */
export function createCrmAgent(config?: {
  vertexClient?: any;
  projectId?: string;
  datasetId?: string;
  customerTableId?: string;
  feedbackTableId?: string;
  pubSubClient?: any;
  topicName?: string;
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
