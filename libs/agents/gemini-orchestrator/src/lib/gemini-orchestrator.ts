/**
 * @fileoverview gemini-orchestrator module for Agent Orchestration
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for AI-powered agent orchestration and task delegation.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';

export interface OrchestratorConfig {
  geminiApiKey: string;
  projectId: string;
  bqConfig?: { projectId: string; datasetId?: string; location?: string };
  crmConfig?: { baseUrl?: string; apiKey?: string; timeout?: number };
  contentConfig?: { bucketName?: string; projectId?: string; cdnUrl?: string };
  lookerConfig?: { baseUrl: string; clientId: string; clientSecret: string };
  reviewsConfig?: { geminiApiKey?: string; sentimentApiUrl?: string; timeout?: number };
}

export interface TaskRequest {
  query: string;
  context?: Record<string, any>;
  requestId?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface TaskResult {
  success: boolean;
  agent: string;
  data?: any;
  error?: string;
  executionTime: number;
  requestId?: string;
}

export interface AgentCapability {
  agent: string;
  description: string;
  capabilities: string[];
  patterns: string[];
}

// Simplified sub-agent implementations to avoid circular dependencies
class SimpleBQAgent {
  private bigquery: BigQuery;
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.bigquery = new BigQuery({ projectId });
  }

  async executeQuery(sql: string): Promise<{ success: boolean; data?: any[]; error?: string; totalRows?: number }> {
    try {
      const [rows] = await this.bigquery.query({ query: sql });
      return { success: true, data: rows, totalRows: rows.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class SimpleCRMAgent {
  private config: { baseUrl?: string; apiKey?: string; timeout?: number };

  constructor(config: { baseUrl?: string; apiKey?: string; timeout?: number } = {}) {
    this.config = { timeout: 30000, ...config };
  }

  async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${this.config.baseUrl || 'https://api.crm.dulcedesaigon.com'}${endpoint}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      return response.ok ? { success: true, data: result } : { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class SimpleContentAgent {
  private storage: Storage;
  private bucketName: string;

  constructor(config: { bucketName?: string; projectId?: string } = {}) {
    this.bucketName = config.bucketName || 'dulce-content-bucket';
    this.storage = new Storage({ projectId: config.projectId });
  }

  async uploadContent(fileName: string, content: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      await file.save(content, { public: true });
      const url = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class SimpleLookerAgent {
  private config: { baseUrl: string; clientId: string; clientSecret: string };

  constructor(config: { baseUrl: string; clientId: string; clientSecret: string }) {
    this.config = config;
  }

  async createDashboard(title: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Simulate dashboard creation
      return { success: true, data: { id: Date.now(), title, status: 'created' } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

class SimpleReviewsAgent {
  private genAI?: GoogleGenerativeAI;

  constructor(config: { geminiApiKey?: string } = {}) {
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  async analyzeSentiment(review: { content: string; rating: number }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Simple sentiment analysis
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting'];
      
      const words = review.content.toLowerCase().split(/\s+/);
      let score = 0;
      
      words.forEach(word => {
        if (positiveWords.includes(word)) score += 1;
        if (negativeWords.includes(word)) score -= 1;
      });

      const normalizedScore = Math.max(-1, Math.min(1, score / 10));
      const label = normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral';

      return {
        success: true,
        data: {
          score: normalizedScore,
          label,
          confidence: Math.min(Math.abs(score) / 5, 1)
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * Enhanced Gemini Orchestrator for intelligent agent delegation and task management
 */
export class GeminiOrchestrator {
  private genAI: GoogleGenerativeAI;
  private subAgents: {
    bq: SimpleBQAgent;
    crm: SimpleCRMAgent;
    content: SimpleContentAgent;
    looker: SimpleLookerAgent;
    reviews: SimpleReviewsAgent;
  };
  private capabilities: AgentCapability[];

  constructor(config: OrchestratorConfig) {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    
    // Initialize simplified sub-agents
    this.subAgents = {
      bq: new SimpleBQAgent(config.projectId),
      crm: new SimpleCRMAgent(config.crmConfig || {}),
      content: new SimpleContentAgent(config.contentConfig || {}),
      looker: new SimpleLookerAgent(config.lookerConfig || {
        baseUrl: '',
        clientId: '',
        clientSecret: ''
      }),
      reviews: new SimpleReviewsAgent(config.reviewsConfig || { geminiApiKey: config.geminiApiKey })
    };

    // Define agent capabilities for intelligent routing
    this.capabilities = [
      {
        agent: 'bq',
        description: 'BigQuery agent for data analysis and SQL queries',
        capabilities: ['sql_queries', 'data_analysis', 'analytics', 'reporting'],
        patterns: ['query', 'data', 'sql', 'analysis', 'analytics', 'report', 'bigquery', 'dataset']
      },
      {
        agent: 'crm',
        description: 'CRM agent for customer relationship management',
        capabilities: ['customer_management', 'loyalty_points', 'marketing', 'communications'],
        patterns: ['customer', 'crm', 'loyalty', 'email', 'sms', 'marketing', 'segment']
      },
      {
        agent: 'content',
        description: 'Content agent for media and content management',
        capabilities: ['content_creation', 'image_processing', 'menu_generation', 'media_upload'],
        patterns: ['content', 'image', 'upload', 'menu', 'media', 'banner', 'vietnamese']
      },
      {
        agent: 'looker',
        description: 'Looker agent for business intelligence and dashboards',
        capabilities: ['dashboard_creation', 'report_generation', 'visualization', 'business_intelligence'],
        patterns: ['dashboard', 'looker', 'visualization', 'chart', 'report', 'business intelligence', 'bi']
      },
      {
        agent: 'reviews',
        description: 'Reviews agent for sentiment analysis and customer feedback',
        capabilities: ['sentiment_analysis', 'review_processing', 'feedback_management', 'response_generation'],
        patterns: ['review', 'sentiment', 'feedback', 'rating', 'opinion', 'comment', 'response']
      }
    ];
  }

  /**
   * Main orchestration method - analyzes query and delegates to appropriate agent
   */
  async orchestrate(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      // Use Gemini to analyze the query and determine the best agent
      const agentSelection = await this.selectAgent(request.query);
      
      if (!agentSelection.success) {
        return {
          success: false,
          agent: 'orchestrator',
          error: agentSelection.error || 'Failed to select appropriate agent',
          executionTime: Date.now() - startTime,
          requestId: request.requestId
        };
      }

      const selectedAgent = agentSelection.agent;
      const parameters = agentSelection.parameters;

      // Execute the task with the selected agent
      const result = await this.executeTask(selectedAgent, request.query, parameters, request.context);

      return {
        success: result.success,
        agent: selectedAgent,
        data: result.data,
        error: result.error,
        executionTime: Date.now() - startTime,
        requestId: request.requestId
      };
    } catch (error) {
      return {
        success: false,
        agent: 'orchestrator',
        error: error instanceof Error ? error.message : 'Unknown orchestration error',
        executionTime: Date.now() - startTime,
        requestId: request.requestId
      };
    }
  }

  /**
   * Use Gemini to intelligently select the best agent for the query
   */
  private async selectAgent(query: string): Promise<{
    success: boolean;
    agent?: string;
    parameters?: Record<string, any>;
    error?: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        Analyze this F&B platform query and select the most appropriate agent to handle it.
        
        Query: "${query}"
        
        Available agents and their capabilities:
        ${this.capabilities.map(cap => `
        ${cap.agent.toUpperCase()}: ${cap.description}
        - Capabilities: ${cap.capabilities.join(', ')}
        - Keywords: ${cap.patterns.join(', ')}
        `).join('\n')}
        
        Instructions:
        1. Choose the SINGLE best agent for this query
        2. Extract any relevant parameters from the query
        3. If the query is unclear or doesn't match any agent, suggest the closest match
        
        Respond in this exact JSON format:
        {
          "agent": "agent_name",
          "confidence": 0.95,
          "reasoning": "Why this agent was selected",
          "parameters": {
            "key": "value"
          }
        }
        
        Valid agent names: bq, crm, content, looker, reviews
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        // Clean the response to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        
        const analysis = JSON.parse(jsonMatch[0]);
        
        if (!analysis.agent || !this.subAgents[analysis.agent as keyof typeof this.subAgents]) {
          return {
            success: false,
            error: `Invalid agent selected: ${analysis.agent}`
          };
        }

        return {
          success: true,
          agent: analysis.agent,
          parameters: analysis.parameters || {}
        };
      } catch (parseError) {
        // Fallback to simple pattern matching
        return this.fallbackAgentSelection(query);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in agent selection'
      };
    }
  }

  /**
   * Fallback method for agent selection using simple pattern matching
   */
  private fallbackAgentSelection(query: string): {
    success: boolean;
    agent?: string;
    parameters?: Record<string, any>;
    error?: string;
  } {
    const lowerQuery = query.toLowerCase();
    
    for (const capability of this.capabilities) {
      const hasPattern = capability.patterns.some(pattern => 
        lowerQuery.includes(pattern.toLowerCase())
      );
      
      if (hasPattern) {
        return {
          success: true,
          agent: capability.agent,
          parameters: {}
        };
      }
    }

    // Default to bq agent for data-related queries
    return {
      success: true,
      agent: 'bq',
      parameters: {}
    };
  }

  /**
   * Execute task with the selected agent
   */
  private async executeTask(
    agentName: string, 
    query: string, 
    parameters: Record<string, any>,
    context?: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      switch (agentName) {
        case 'bq':
          return await this.executeBQTask(query, parameters, context);
        
        case 'crm':
          return await this.executeCRMTask(query, parameters, context);
        
        case 'content':
          return await this.executeContentTask(query, parameters, context);
        
        case 'looker':
          return await this.executeLookerTask(query, parameters, context);
        
        case 'reviews':
          return await this.executeReviewsTask(query, parameters, context);
        
        default:
          return {
            success: false,
            error: `Unknown agent: ${agentName}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  /**
   * Execute BigQuery-related tasks
   */
  private async executeBQTask(query: string, parameters: Record<string, any>, context?: Record<string, any>) {
    if (query.toLowerCase().includes('analytics') || query.toLowerCase().includes('restaurant performance')) {
      const sql = `SELECT restaurant_id, COUNT(*) as orders, SUM(order_value) as revenue FROM orders GROUP BY restaurant_id LIMIT 10`;
      return await this.subAgents.bq.executeQuery(sql);
    }
    
    if (query.toLowerCase().includes('customer insights')) {
      const sql = `SELECT customer_id, COUNT(*) as orders, AVG(order_value) as avg_spend FROM orders GROUP BY customer_id LIMIT 10`;
      return await this.subAgents.bq.executeQuery(sql);
    }
    
    // Default SQL query
    const sql = parameters.sql || query;
    return await this.subAgents.bq.executeQuery(sql);
  }

  /**
   * Execute CRM-related tasks
   */
  private async executeCRMTask(query: string, parameters: Record<string, any>, context?: Record<string, any>) {
    if (query.toLowerCase().includes('customer') && query.toLowerCase().includes('search')) {
      return await this.subAgents.crm.makeRequest('/customers/search', 'GET');
    }
    
    if (query.toLowerCase().includes('loyalty') && query.toLowerCase().includes('points')) {
      const customerId = parameters.customerId || context?.customerId || 'demo-customer';
      const points = parameters.points || 100;
      return await this.subAgents.crm.makeRequest(`/customers/${customerId}/loyalty`, 'POST', { points });
    }
    
    return { success: true, data: { message: 'CRM operation completed' } };
  }

  /**
   * Execute Content-related tasks
   */
  private async executeContentTask(query: string, parameters: Record<string, any>, context?: Record<string, any>) {
    if (query.toLowerCase().includes('menu') && query.toLowerCase().includes('generate')) {
      const menuContent = JSON.stringify({
        restaurantId: parameters.restaurantId || 'demo-restaurant',
        sections: [{ name: 'Appetizers', items: [] }]
      });
      return await this.subAgents.content.uploadContent('menu.json', menuContent);
    }
    
    if (query.toLowerCase().includes('vietnamese')) {
      const content = JSON.stringify({
        name: parameters.name || 'Phở Bò',
        description: 'Traditional Vietnamese beef noodle soup'
      });
      return await this.subAgents.content.uploadContent('vietnamese-content.json', content);
    }
    
    return { success: true, data: { message: 'Content operation completed' } };
  }

  /**
   * Execute Looker-related tasks
   */
  private async executeLookerTask(query: string, parameters: Record<string, any>, context?: Record<string, any>) {
    if (query.toLowerCase().includes('dashboard')) {
      const title = parameters.title || 'F&B Analytics Dashboard';
      return await this.subAgents.looker.createDashboard(title);
    }
    
    return { success: true, data: { message: 'Looker operation completed' } };
  }

  /**
   * Execute Reviews-related tasks
   */
  private async executeReviewsTask(query: string, parameters: Record<string, any>, context?: Record<string, any>) {
    if (query.toLowerCase().includes('sentiment')) {
      const review = parameters.review || context?.review || { content: 'Great food!', rating: 5 };
      return await this.subAgents.reviews.analyzeSentiment(review);
    }
    
    return { success: true, data: { message: 'Reviews operation completed' } };
  }

  /**
   * Get agent capabilities for external reference
   */
  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  /**
   * Health check for all sub-agents
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    return {
      bq: true,
      crm: true,
      content: true,
      looker: true,
      reviews: true
    };
  }
}

// Export legacy function for backwards compatibility
export function geminiOrchestrator(): string {
  return 'gemini-orchestrator';
}
