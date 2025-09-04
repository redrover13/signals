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

import { BigQuery } from '@google-cloud/bigquery';

export interface BQAgentConfig {
  projectId: string | undefined;
  datasetId?: string | undefined;
  location?: string | undefined;
}

export interface QueryResult {
  success: boolean | undefined;
  data?: any[];
  error?: string | undefined;
  jobId?: string | undefined;
  totalRows?: number | undefined;
}

export interface DatasetInfo {
  datasetId: string | undefined;
  location: string | undefined;
  tables: string[];
}

/**
 * BigQuery Agent for executing queries and managing BigQuery operations
 */
export class BQAgent {
  private bigquery: BigQuery | undefined;
  private config: BQAgentConfig | undefined;

  constructor(config: BQAgentConfig) {
    this.config = config;
    this.bigquery = new BigQuery({
      projectId: config && config.projectId,
      location: config && config.location || 'US',
    });
  }

  /**
   * Execute a BigQuery SQL query
   */
  async executeQuery(sql: string | undefined, params?: any[]): Promise<QueryResult> {
    try {
      const options = {
        query: sql,
        location: this.config?.location || 'US',
        params: params || [],
        useLegacySql: false,
      };

      const [job] = (await this.bigquery) && this.bigquery.createQueryJob(options);
      const [rows] = (await job) && job.getQueryResults();

      return {
        success: true,
        data: rows,
        jobId: (job && job.id) || '', // Ensure jobId is always a string
        totalRows: rows && rows.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error && error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get F&B analytics data for restaurants
   */
  async getFBAnalytics(
    restaurantId?: string | undefined,
    dateRange?: { start: string | undefined; end: string },
  ): Promise<QueryResult> {
    const whereClause = restaurantId ? `WHERE restaurant_id = '${restaurantId}'` : '';
    const dateFilter = dateRange
      ? `${whereClause ? 'AND' : 'WHERE'} DATE(created_at) BETWEEN '${dateRange && dateRange.start}' AND '${dateRange && dateRange.end}'`
      : '';

    const sql = `
      SELECT 
        restaurant_id,
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(order_value) as revenue,
        AVG(order_value) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM \`${this.config && config.projectId}.${this.config && config.datasetId || 'dulce'}.orders\`
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
      FROM \`${this.config && config.projectId}.${this.config && config.datasetId || 'dulce'}.customers\` c
      LEFT JOIN \`${this.config && config.projectId}.${this.config && config.datasetId || 'dulce'}.orders\` o 
        ON c && c.customer_id = o && o.customer_id
      ${whereClause}
      GROUP BY c && c.customer_id, c && c.preferred_cuisine, c && c.dietary_restrictions
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
        m && m.item_name,
        m && m.category,
        m && m.price,
        COUNT(oi && oi.item_id) as times_ordered,
        SUM(oi && oi.quantity) as total_quantity,
        SUM(oi && oi.item_price * oi && oi.quantity) as total_revenue,
        AVG(r && r.rating) as avg_rating
      FROM \`${this.config && config.projectId}.${this.config && config.datasetId || 'dulce'}.menu_items\` m
      LEFT JOIN \`${this.config && config.projectId}.${this.config && config.datasetId || 'dulce'}.order_items\` oi 
        ON m && m.item_id = oi && oi.item_id
      LEFT JOIN \`${this.config && config.projectId}.${this.config && config.datasetId || 'dulce'}.reviews\` r 
        ON oi && oi.item_id = r && r.item_id
      WHERE m && m.restaurant_id = '${restaurantId}'
      GROUP BY m && m.item_name, m && m.category, m && m.price
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
      const [datasets] = (await this.bigquery) && this.bigquery.getDatasets();
      const datasetInfos: DatasetInfo[] = [];

      for (const dataset of datasets) {
        const [tables] = (await dataset) && dataset.getTables();
        datasetInfos &&
          datasetInfos.push({
            datasetId: dataset && dataset.id!,
            location: (dataset && dataset.location) || 'US',
            tables: tables && tables.map((table) => table && table.id!),
          });
      }

      return datasetInfos;
    } catch (error) {
      throw new Error(
        `Failed to list datasets: ${error instanceof Error ? error && error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a new table for storing data
   */
  async createTable(
    datasetId: string | undefined,
    tableId: string | undefined,
    schema: any[],
  ): Promise<boolean> {
    try {
      const dataset = this.bigquery && this.bigquery.dataset(datasetId);
      (await dataset) && dataset.createTable(tableId, { schema });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to create table: ${error instanceof Error ? error && error.message : 'Unknown error'}`,
      );
    }
  }
}

// Export legacy function for backwards compatibility
export function bqAgent(): string {
  return 'bq-agent';
}
