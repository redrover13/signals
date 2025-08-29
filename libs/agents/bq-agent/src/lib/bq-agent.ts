/**
 * @fileoverview bq-agent module for BigQuery operations
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for BigQuery data analysis and querying.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { BigQuery, Job } from '@google-cloud/bigquery';

export interface BQAgentConfig {
  projectId: string;
  datasetId?: string;
  location?: string;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  jobId?: string;
  totalRows?: number;
}

export interface DatasetInfo {
  datasetId: string;
  location: string;
  tables: string[];
}

/**
 * BigQuery Agent for executing queries and managing BigQuery operations
 */
export class BQAgent {
  private bigquery: BigQuery;
  private config: BQAgentConfig;

  constructor(config: BQAgentConfig) {
    this.config = config;
    this.bigquery = new BigQuery({ 
      projectId: config.projectId,
      location: config.location || 'US'
    });
  }

  /**
   * Execute a BigQuery SQL query
   */
  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      const options = {
        query: sql,
        location: this.config.location || 'US',
        params: params || [],
        useLegacySql: false,
      };

      const [job] = await this.bigquery.createQueryJob(options);
      const [rows] = await job.getQueryResults();

      return {
        success: true,
        data: rows,
        jobId: job.id,
        totalRows: rows.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get F&B analytics data for restaurants
   */
  async getFBAnalytics(restaurantId?: string, dateRange?: { start: string; end: string }): Promise<QueryResult> {
    const whereClause = restaurantId ? `WHERE restaurant_id = '${restaurantId}'` : '';
    const dateFilter = dateRange ? 
      `${whereClause ? 'AND' : 'WHERE'} DATE(created_at) BETWEEN '${dateRange.start}' AND '${dateRange.end}'` : '';

    const sql = `
      SELECT 
        restaurant_id,
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(order_value) as revenue,
        AVG(order_value) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM \`${this.config.projectId}.${this.config.datasetId || 'dulce'}.orders\`
      ${whereClause}
      ${dateFilter}
      GROUP BY restaurant_id, DATE(created_at)
      ORDER BY date DESC
      LIMIT 100
    `;

    return this.executeQuery(sql);
  }

  /**
   * Get customer preferences and behavior data
   */
  async getCustomerInsights(customerId?: string): Promise<QueryResult> {
    const whereClause = customerId ? `WHERE c.customer_id = '${customerId}'` : '';

    const sql = `
      SELECT 
        c.customer_id,
        c.preferred_cuisine,
        c.dietary_restrictions,
        COUNT(o.order_id) as total_orders,
        AVG(o.order_value) as avg_spend,
        MAX(o.created_at) as last_order_date,
        ARRAY_AGG(DISTINCT o.restaurant_id LIMIT 5) as favorite_restaurants
      FROM \`${this.config.projectId}.${this.config.datasetId || 'dulce'}.customers\` c
      LEFT JOIN \`${this.config.projectId}.${this.config.datasetId || 'dulce'}.orders\` o 
        ON c.customer_id = o.customer_id
      ${whereClause}
      GROUP BY c.customer_id, c.preferred_cuisine, c.dietary_restrictions
      ORDER BY total_orders DESC
      LIMIT 50
    `;

    return this.executeQuery(sql);
  }

  /**
   * Get menu performance analytics
   */
  async getMenuPerformance(restaurantId: string): Promise<QueryResult> {
    const sql = `
      SELECT 
        m.item_name,
        m.category,
        m.price,
        COUNT(oi.item_id) as times_ordered,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.item_price * oi.quantity) as total_revenue,
        AVG(r.rating) as avg_rating
      FROM \`${this.config.projectId}.${this.config.datasetId || 'dulce'}.menu_items\` m
      LEFT JOIN \`${this.config.projectId}.${this.config.datasetId || 'dulce'}.order_items\` oi 
        ON m.item_id = oi.item_id
      LEFT JOIN \`${this.config.projectId}.${this.config.datasetId || 'dulce'}.reviews\` r 
        ON oi.item_id = r.item_id
      WHERE m.restaurant_id = '${restaurantId}'
      GROUP BY m.item_name, m.category, m.price
      ORDER BY total_revenue DESC
      LIMIT 20
    `;

    return this.executeQuery(sql);
  }

  /**
   * List available datasets and tables
   */
  async listDatasets(): Promise<DatasetInfo[]> {
    try {
      const [datasets] = await this.bigquery.getDatasets();
      const datasetInfos: DatasetInfo[] = [];

      for (const dataset of datasets) {
        const [tables] = await dataset.getTables();
        datasetInfos.push({
          datasetId: dataset.id!,
          location: dataset.location || 'US',
          tables: tables.map(table => table.id!)
        });
      }

      return datasetInfos;
    } catch (error) {
      throw new Error(`Failed to list datasets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new table for storing data
   */
  async createTable(datasetId: string, tableId: string, schema: any[]): Promise<boolean> {
    try {
      const dataset = this.bigquery.dataset(datasetId);
      const [table] = await dataset.createTable(tableId, { schema });
      return true;
    } catch (error) {
      throw new Error(`Failed to create table: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export legacy function for backwards compatibility
export function bqAgent(): string {
  return 'bq-agent';
}
