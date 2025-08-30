/**
 * @fileoverview BigQuery service for data analytics
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides BigQuery integration for data analytics.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { BigQuery, Dataset, Table } from '@google-cloud/bigquery';

/**
 * Configuration for BigQuery service
 */
export interface BigQueryConfig {
  /**
   * GCP project ID
   */
  projectId: string;
  
  /**
   * Default dataset ID
   */
  defaultDatasetId?: string;
  
  /**
   * Dataset location (e.g., 'US', 'asia-southeast1')
   */
  location?: string;
}

/**
 * Query options for BigQuery
 */
export interface QueryOptions {
  /**
   * Whether to use legacy SQL syntax
   */
  useLegacySql?: boolean;
  
  /**
   * Maximum number of results to return
   */
  maxResults?: number;
  
  /**
   * Query parameters
   */
  params?: Record<string, any>;
  
  /**
   * Job timeout in milliseconds
   */
  timeoutMs?: number;
}

/**
 * BigQuery service for data analytics
 */
export class BigQueryService {
  private bigquery: BigQuery;
  private config: BigQueryConfig;
  
  /**
   * Creates a new BigQueryService
   * @param config BigQuery configuration
   */
  constructor(config: BigQueryConfig) {
    this.config = {
      location: 'US',
      ...config
    };
    
    // Initialize BigQuery
    this.bigquery = new BigQuery({
      projectId: config.projectId
    });
    
    console.log(`[BigQueryService] Initialized for project ${config.projectId}`);
  }
  
  /**
   * Get a dataset reference
   * @param datasetId Dataset ID
   * @returns BigQuery dataset
   */
  dataset(datasetId: string = this.config.defaultDatasetId): Dataset {
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }
    
    return this.bigquery.dataset(datasetId);
  }
  
  /**
   * Get a table reference
   * @param datasetId Dataset ID
   * @param tableId Table ID
   * @returns BigQuery table
   */
  table(datasetId: string, tableId: string): Table {
    return this.dataset(datasetId).table(tableId);
  }
  
  /**
   * Execute a SQL query
   * @param sql SQL query string
   * @param options Query options
   * @returns Promise with query results
   */
  async query(sql: string, options: QueryOptions = {}): Promise<any[]> {
    const defaultOptions = {
      query: sql,
      location: this.config.location,
      useLegacySql: false
    };
    
    const [rows] = await this.bigquery.query({
      ...defaultOptions,
      ...options
    });
    
    return rows;
  }
  
  /**
   * Insert rows into a table
   * @param datasetId Dataset ID
   * @param tableId Table ID
   * @param rows Rows to insert
   * @returns Promise resolving when insertion is complete
   */
  async insertRows(datasetId: string, tableId: string, rows: any[]): Promise<void> {
    const table = this.table(datasetId, tableId);
    
    try {
      await table.insert(rows);
      console.log(`[BigQueryService] Inserted ${rows.length} rows into ${datasetId}.${tableId}`);
    } catch (error) {
      console.error(`[BigQueryService] Error inserting rows:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new dataset
   * @param datasetId Dataset ID
   * @param options Dataset creation options
   * @returns Promise resolving when dataset is created
   */
  async createDataset(datasetId: string, options: any = {}): Promise<Dataset> {
    const [dataset] = await this.bigquery.createDataset(datasetId, {
      location: this.config.location,
      ...options
    });
    
    console.log(`[BigQueryService] Created dataset ${datasetId}`);
    return dataset;
  }
  
  /**
   * Create a new table
   * @param datasetId Dataset ID
   * @param tableId Table ID
   * @param schema Table schema
   * @param options Table creation options
   * @returns Promise resolving when table is created
   */
  async createTable(
    datasetId: string,
    tableId: string,
    schema: any[],
    options: any = {}
  ): Promise<Table> {
    const dataset = this.dataset(datasetId);
    
    const [table] = await dataset.createTable(tableId, {
      schema: {
        fields: schema
      },
      ...options
    });
    
    console.log(`[BigQueryService] Created table ${datasetId}.${tableId}`);
    return table;
  }
  
  /**
   * Execute a parameterized query
   * @param sql SQL query template with named parameters
   * @param params Query parameters
   * @param options Additional query options
   * @returns Promise with query results
   */
  async parameterizedQuery(
    sql: string,
    params: Record<string, any>,
    options: Omit<QueryOptions, 'params'> = {}
  ): Promise<any[]> {
    return this.query(sql, {
      ...options,
      params
    });
  }
}
