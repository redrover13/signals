/**
 * @fileoverview reviews-agent module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains reviews agent implementation using Google's ADK.
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
 * Review data interface
 */
export interface ReviewData {
  reviewId: string;
  restaurantId: string;
  customerId?: string;
  rating: number;
  comment: string;
  timestamp: string;
  platform?: string;
}

/**
 * Reviews-specialized agent for processing and analyzing customer reviews
 */
export class ReviewsAgent extends DulceLlmAgent {
  constructor(cfg?: { model?: string; apiKey?: string; tools?: Array<unknown> }) {
    // Require an API key, whether passed in or via env, to avoid silent misconfig
    const apiKey = cfg?.apiKey ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required to initialize ReviewsAgent');
    }

    // Allow overriding the model name for flexibility/testing
    const llm = new GeminiLlm({
      model: cfg?.model ?? 'gemini-1.5-pro',
      apiKey,
    });

    // Permit injecting custom tools, else use the reviews defaults
    const tools = cfg?.tools ?? [
      new BigQueryQueryTool(),
      new HttpRequestTool(),
    ];

    super({
      name: 'Reviews Agent',
      description: 'Specialized agent for Vietnamese F&B review analysis and processing',
      llm,
      tools,
    });
  }

  /**
   * Analyze customer reviews and extract insights
   */
  async analyzeReviews(reviews: ReviewData[], context?: string): Promise<any> {
    const prompt = `
You are a review analyst for the Dulce de Saigon F&B platform.

Reviews to analyze: ${JSON.stringify(reviews, null, 2)}
${context ? `Context: ${context}` : ''}

Please:
1. Perform sentiment analysis on each review
2. Identify common themes and patterns
3. Extract actionable insights for restaurant improvement
4. Consider Vietnamese cultural context and expectations
5. Suggest specific improvements based on feedback
6. Identify trending topics in Vietnamese F&B reviews

Focus on insights that can improve restaurant operations and customer satisfaction.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Generate responses to customer reviews
   */
  async generateReviewResponse(review: ReviewData, restaurantInfo?: any): Promise<any> {
    const prompt = `
Generate an appropriate response to a customer review for the Dulce de Saigon platform.

Review: ${JSON.stringify(review, null, 2)}
${restaurantInfo ? `Restaurant Info: ${JSON.stringify(restaurantInfo, null, 2)}` : ''}

Please:
1. Craft a culturally appropriate response in Vietnamese
2. Address specific concerns mentioned in the review
3. Show empathy and understanding
4. Offer solutions or improvements where appropriate
5. Maintain a professional and friendly tone
6. Consider Vietnamese communication norms

Create a response that improves customer relations and reflects well on the restaurant.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Identify review trends and patterns
   */
  async identifyTrends(timeframe: string, filters?: any): Promise<any> {
    const prompt = `
Analyze review trends for the Dulce de Saigon F&B platform.

Timeframe: ${timeframe}
${filters ? `Filters: ${JSON.stringify(filters, null, 2)}` : ''}

Please:
1. Query review data from BigQuery for the specified timeframe
2. Identify trending positive and negative themes
3. Analyze rating patterns and changes over time
4. Consider seasonal or cultural factors affecting reviews
5. Identify restaurants or dishes with notable trends
6. Suggest proactive measures based on trends

Provide insights that help restaurants anticipate and respond to customer needs.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Moderate and filter reviews for quality
   */
  async moderateReview(review: ReviewData): Promise<any> {
    const prompt = `
Moderate and assess the quality of a customer review for the Dulce de Saigon platform.

Review: ${JSON.stringify(review, null, 2)}

Please:
1. Assess if the review meets quality standards
2. Check for spam, fake reviews, or inappropriate content
3. Evaluate the helpfulness and relevance of the review
4. Consider Vietnamese cultural context and language
5. Determine if the review should be published or flagged
6. Suggest appropriate actions if issues are found

Ensure review quality standards are maintained for the platform.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }
}

/**
 * Factory function to create a Reviews agent
 */
export function createReviewsAgent(config?: {
  vertexClient?: any;
  projectId?: string;
  datasetId?: string;
  reviewsTableId?: string;
  sentimentModel?: string;
  pubSubClient?: any;
  topicName?: string;
}): ReviewsAgent {
  // For now, just return a new instance
  // In the future, we can use the config parameters for initialization
  return new ReviewsAgent();
}

/**
 * Legacy function for backward compatibility
 */
export function reviewsAgent(): string {
  return 'reviews-agent (ADK-enabled)';
}
