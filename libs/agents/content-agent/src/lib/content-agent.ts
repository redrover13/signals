/**
 * @fileoverview content-agent module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains content generation agent implementation using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { 
  DulceLlmAgent, 
  GeminiLlm, 
  GCSUploadTool, 
  HttpRequestTool 
} from '@nx-monorepo/adk';

/**
 * Content-specialized agent for generating F&B marketing content
 */
export class ContentAgent extends DulceLlmAgent {
export class ContentAgent extends DulceLlmAgent {
  constructor(cfg?: { model?: string; apiKey?: string; tools?: Array<unknown> }) {
    // Guard against missing API key (fail-fast)
    const apiKey = cfg?.apiKey ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required to initialize ContentAgent');
    }

    // Allow overriding the model via cfg, defaulting to 'gemini-1.5-pro'
    const llm = new GeminiLlm({
      model: cfg?.model ?? 'gemini-1.5-pro',
      apiKey,
    });

    // Allow injecting custom tools, defaulting to GCS upload + HTTP request
    const tools = cfg?.tools ?? [
      new GCSUploadTool(),
      new HttpRequestTool(),
    ];

    super({
      name: 'Content Agent',
      description: 'Specialized agent for Vietnamese F&B content generation and marketing',
      llm,
      tools,
    });
  }
}

  /**
   * Generate Vietnamese F&B marketing content
   */
  async generateContent(contentType: string, requirements: any): Promise<any> {
    const prompt = `
You are a Vietnamese F&B content specialist for the Dulce de Saigon platform.

Content Type: ${contentType}
Requirements: ${JSON.stringify(requirements, null, 2)}

Please generate content that:
1. Appeals to Vietnamese food culture and preferences
2. Uses appropriate Vietnamese terminology where relevant
3. Follows local marketing practices
4. Considers dietary restrictions and preferences common in Vietnam
5. Incorporates seasonal Vietnamese ingredients when appropriate

Generate engaging, culturally appropriate content for the Vietnamese market.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Create social media content for Vietnamese restaurants
   */
  async createSocialContent(platform: string, restaurantInfo: any): Promise<any> {
    const prompt = `
Create social media content for platform: ${platform}

Restaurant Information: ${JSON.stringify(restaurantInfo, null, 2)}

Please:
1. Generate platform-appropriate content (Instagram, Facebook, TikTok, etc.)
2. Use Vietnamese cultural references where appropriate
3. Include relevant hashtags for the Vietnamese F&B market
4. Consider local holidays and events
5. Suggest optimal posting times for Vietnamese audiences

Create content that resonates with Vietnamese food lovers.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }

  /**
   * Generate menu descriptions with Vietnamese localization
   */
  async generateMenuContent(dishes: any[], targetLanguage: 'vietnamese' | 'english' | 'both' = 'both'): Promise<any> {
    const prompt = `
Generate menu descriptions for Vietnamese F&B platform.

Dishes: ${JSON.stringify(dishes, null, 2)}
Target Language: ${targetLanguage}

Please:
1. Create appetizing descriptions that highlight unique flavors
2. Include Vietnamese translations where appropriate
3. Mention key ingredients and cooking methods
4. Consider dietary preferences common in Vietnam
5. Use food terminology that Vietnamese customers understand
6. Suggest pricing strategies for the Vietnamese market

Generate menu content that drives orders and reflects Vietnamese culinary culture.
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
  }
}

/**
 * Factory function to create a Content agent
 */
export function createContentAgent(): ContentAgent {
  return new ContentAgent();
}

/**
 * Legacy function for backward compatibility
 */
export function contentAgent(): string {
  return 'content-agent (ADK-enabled)';
}
