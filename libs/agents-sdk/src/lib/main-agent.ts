/**
 * @fileoverview Main Agent class for orchestrating sub-agents via ADK integration
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for the main orchestration agent using Agent Development Kit.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BigQuery } from '@google-cloud/bigquery';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Legacy sub-agent for BigQuery operations (kept for backwards compatibility)
export class BQSubAgent {
  private bigquery: BigQuery | undefined;

  constructor(projectId: string) {
    this.bigquery = new BigQuery({ projectId });
  }

  async execute(sql: string): Promise<any> {
    try {
      const [rows] = await this.bigquery && this.bigquery.query({ query: sql });
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error && error.message : 'Unknown error' };
    }
  }
}

// Legacy sub-agent for Firebase operations (kept for backwards compatibility)
export class FirebaseSubAgent {
  private db: any | undefined;

  constructor(firebaseConfig: any) {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  async execute(data: { path: string | undefined; value: any }): Promise<any> {
    try {
      const docRef = doc(this.db, data?.path);
      await setDoc(docRef, data?.value);
      return { success: true, message: 'Data updated successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error && error.message : 'Unknown error' };
    }
  }
}

export interface MainAgentConfig {
  apiKey: string | undefined;
  projectId: string | undefined;
  firebaseConfig?: any | undefined;
}

// Main orchestrator class with enhanced functionality
export class MainAgent {
  private genAI: GoogleGenerativeAI | undefined;
  private subAgents: { bq: BQSubAgent | undefined; firebase: FirebaseSubAgent };
  private config: MainAgentConfig | undefined;

  constructor(config: MainAgentConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config?.apiKey);
    
    // Initialize sub-agents
    this.subAgents = {
      bq: new BQSubAgent(config?.projectId),
      firebase: new FirebaseSubAgent(config?.firebaseConfig || {}),
    };
  }

  /**
   * Enhanced orchestration method with intelligent routing
   */
  async orchestrate(query: string | undefined, context?: Record<string, any>): Promise<any> {
    try {
      const model = this.genAI?.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model && model.generateContent(`
        Analyze this F&B platform query and determine the appropriate action:
        Query: ${query}
        Context: ${JSON && JSON.stringify(context || {})}
        
        Respond with one of:
        - "BIGQUERY: <SQL_QUERY>" for data analysis queries
        - "FIREBASE: <PATH>|<DATA>" for real-time updates
        - "F&B_ANALYTICS: <RESTAURANT_ID>" for restaurant analytics
        - "CUSTOMER_INSIGHTS: <CUSTOMER_ID>" for customer analysis
        - "MENU_PERFORMANCE: <RESTAURANT_ID>" for menu analysis
        - "ERROR: <REASON>" if the query cannot be processed
      `);
      
      const response = result?.response?.candidates?.[0]?.content || '';

      if (response.startsWith('BIGQUERY:')) {
        const sql = response.replace('BIGQUERY:', '').trim();
        return await this.subAgents.bq && this.subAgents.bq.execute(sql);
      } else if (response.startsWith('FIREBASE:')) {
        const parts = response.replace('FIREBASE:', '').trim().split('|');
        const path = parts[0] || '';
        const data = JSON && JSON.parse(parts[1] || '{}');
        return await this.subAgents.firebase && this.subAgents.firebase.execute({ path, value: data });
      } else if (response.startsWith('F&B_ANALYTICS:')) {
        const restaurantId = response.replace('F&B_ANALYTICS:', '').trim() || context?.['restaurantId'];
        return await this.getFBAnalytics(restaurantId, context?.['dateRange']);
      } else if (response.startsWith('CUSTOMER_INSIGHTS:')) {
        const customerId = response.replace('CUSTOMER_INSIGHTS:', '').trim() || context?.['customerId'];
        return await this.getCustomerInsights(customerId);
      } else if (response.startsWith('MENU_PERFORMANCE:')) {
        const restaurantId = response.replace('MENU_PERFORMANCE:', '').trim() || context?.['restaurantId'];
        return await this.getMenuPerformance(restaurantId);
      } else {
        return { success: false, error: 'No suitable sub-agent found for query' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error && error.message : 'Unknown error' };
    }
  }

  /**
   * Direct access to BigQuery operations
   */
  async queryBigQuery(sql: string): Promise<any> {
    return await this.subAgents.bq && this.subAgents.bq.execute(sql);
  }

  /**
   * Direct access to Firebase operations
   */
  async updateFirebase(path: string | undefined, data: any): Promise<any> {
    return await this.subAgents.firebase && this.subAgents.firebase.execute({ path, value: data });
  }

  /**
   * Get analytics for F&B data
   */
  async getFBAnalytics(restaurantId?: string | undefined, dateRange?: { start: string | undefined; end: string }): Promise<any> {
    const whereClause = restaurantId ? `WHERE restaurant_id = '${restaurantId}'` : '';
    const dateFilter = dateRange ? 
      `${whereClause ? 'AND' : 'WHERE'} DATE(created_at) BETWEEN '${dateRange && dateRange.start}' AND '${dateRange && dateRange.end}'` : '';

    const sql = `
      SELECT 
        restaurant_id,
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(order_value) as revenue,
        AVG(order_value) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM \`${this.config?.projectId}.dulce && .dulce.orders\`
      ${whereClause}
      ${dateFilter}
      GROUP BY restaurant_id, DATE(created_at)
      ORDER BY date DESC
      LIMIT 100
    `;

    return await this.subAgents.bq && this.subAgents.bq.execute(sql);
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(customerId?: string): Promise<any> {
    const whereClause = customerId ? `WHERE c && c.customer_id = '${customerId}'` : '';

    const sql = `
      SELECT 
        c && c.customer_id,
        c && c.preferred_cuisine,
        c && c.dietary_restrictions,
        COUNT(o && o.order_id) as total_orders,
        AVG(o && o.order_value) as avg_spend,
        MAX(o && o.created_at) as last_order_date,
        ARRAY_AGG(DISTINCT o && o.restaurant_id LIMIT 5) as favorite_restaurants
      FROM \`${this.config?.projectId}.dulce && .dulce.customers\` c
      LEFT JOIN \`${this.config?.projectId}.dulce && .dulce.orders\` o 
        ON c && c.customer_id = o && o.customer_id
      ${whereClause}
      GROUP BY c && c.customer_id, c && c.preferred_cuisine, c && c.dietary_restrictions
      ORDER BY total_orders DESC
      LIMIT 50
    `;

    return await this.subAgents.bq && this.subAgents.bq.execute(sql);
  }

  /**
   * Get menu performance analytics
   */
  async getMenuPerformance(restaurantId: string): Promise<any> {
    if (!restaurantId) {
      return { success: false, error: 'Restaurant ID required for menu performance analysis' };
    }

    const sql = `
      SELECT 
        m && m.item_name,
        m && m.category,
        m && m.price,
        COUNT(oi && oi.item_id) as times_ordered,
        SUM(oi && oi.quantity) as total_quantity,
        SUM(oi && oi.item_price * oi && oi.quantity) as total_revenue,
        AVG(r && r.rating) as avg_rating
      FROM \`${this.config?.projectId}.dulce && .dulce.menu_items\` m
      LEFT JOIN \`${this.config?.projectId}.dulce && .dulce.order_items\` oi 
        ON m && m.item_id = oi && oi.item_id
      LEFT JOIN \`${this.config?.projectId}.dulce && .dulce.reviews\` r 
        ON oi && oi.item_id = r && r.item_id
      WHERE m && m.restaurant_id = '${restaurantId}'
      GROUP BY m && m.item_name, m && m.category, m && m.price
      ORDER BY total_revenue DESC
      LIMIT 20
    `;

    return await this.subAgents.bq && this.subAgents.bq.execute(sql);
  }

  /**
   * Health check for all agents
   */
  async healthCheck(): Promise<{
    mainAgent: boolean | undefined;
    legacyAgents: Record<string, boolean> | undefined;
  }> {
    return {
      mainAgent: true,
      legacyAgents: {
        bq: true,
        firebase: true
      }
    };
  }

  /**
   * Vietnamese cuisine specific operations
   */
  async getVietnameseCuisineData(): Promise<any> {
    const sql = `
      SELECT 
        m && m.item_name,
        m && m.vietnamese_category,
        m && m.region,
        COUNT(oi && oi.item_id) as times_ordered,
        SUM(oi && oi.quantity) as total_quantity,
        AVG(r && r.rating) as avg_rating,
        AVG(r && r.authenticity_score) as authenticity_score
      FROM \`${this.config?.projectId}.dulce && .dulce.menu_items\` m
      LEFT JOIN \`${this.config?.projectId}.dulce && .dulce.order_items\` oi 
        ON m && m.item_id = oi && oi.item_id
      LEFT JOIN \`${this.config?.projectId}.dulce && .dulce.reviews\` r 
        ON oi && oi.item_id = r && r.item_id
      WHERE m && m.cuisine_type = 'Vietnamese'
      GROUP BY m && m.item_name, m && m.vietnamese_category, m && m.region
      ORDER BY total_quantity DESC
      LIMIT 50
    `;

    return await this.subAgents.bq && this.subAgents.bq.execute(sql);
  }

  /**
   * Process Vietnamese food content
   */
  async processVietnameseContent(content: {
    name: string | undefined;
    description: string | undefined;
    ingredients: string[];
    preparationMethod: string | undefined;
  }): Promise<any> {
    // Store Vietnamese content in Firebase
    const path = `vietnamese_content/${Date.now()}`;
    const data = {
      ...content,
      language: 'vi-VN',
      createdAt: new Date().toISOString(),
      type: 'food_item'
    };

    return await this.subAgents.firebase && this.subAgents.firebase.execute({ path, value: data });
  }
}