/**
 * @fileoverview BigQuery logger for agent traces and logs
 *
 * This module provides structured logging to BigQuery for long-term
 * analytics and compliance with Vietnamese data regulations.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { BigQuery, Dataset, Table } from '@google-cloud/bigquery';

/**
 * Configuration for BigQuery logger
 */
export interface BigQueryLoggerConfig {
  projectId: string;
  datasetId: string;
  tableId: string;
  location?: string;
  bufferSize?: number;
  flushIntervalMs?: number;
}

/**
 * Log entry structure for BigQuery
 */
export interface LogEntry {
  timestamp: Date;
  traceId?: string;
  spanId?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  event: string;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

/**
 * Error log entry structure
 */
export interface ErrorLogEntry {
  timestamp: Date;
  spanName: string;
  error: string;
  stack?: string;
  attributes?: Record<string, any>;
  traceId?: string;
  spanId?: string;
}

/**
 * BigQuery table schema for agent logs
 */
const LOG_TABLE_SCHEMA = [
  { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'trace_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'span_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'level', type: 'STRING', mode: 'REQUIRED' },
  { name: 'service', type: 'STRING', mode: 'REQUIRED' },
  { name: 'event', type: 'STRING', mode: 'REQUIRED' },
  { name: 'data', type: 'JSON', mode: 'NULLABLE' },
  { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'session_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'region', type: 'STRING', mode: 'REQUIRED' },
  { name: 'compliance_marker', type: 'STRING', mode: 'REQUIRED' },
];

/**
 * BigQuery logger for agent telemetry
 */
export class BigQueryLogger {
  private bigquery: BigQuery;
  private dataset: Dataset;
  private table: Table;
  private config: Required<BigQueryLoggerConfig>;
  private buffer: any[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: BigQueryLoggerConfig) {
    this.config = {
      location: 'asia-southeast1',
      bufferSize: 100,
      flushIntervalMs: 10000, // 10 seconds
      ...config,
    };

    this.bigquery = new BigQuery({
      projectId: this.config.projectId,
      location: this.config.location,
    });

    this.dataset = this.bigquery.dataset(this.config.datasetId);
    this.table = this.dataset.table(this.config.tableId);
  }

  /**
   * Initialize BigQuery dataset and table
   */
  async initialize(): Promise<void> {
    try {
      // Create dataset if it doesn't exist
      const [datasetExists] = await this.dataset.exists();
      if (!datasetExists) {
        console.log(`📊 Creating BigQuery dataset: ${this.config.datasetId}`);
        await this.dataset.create({
          location: this.config.location,
          labels: {
            project: 'dulce-de-saigon',
            component: 'agent-telemetry',
            compliance: 'vietnam-data-law',
          },
        });
      }

      // Create table if it doesn't exist
      const [tableExists] = await this.table.exists();
      if (!tableExists) {
        console.log(`📊 Creating BigQuery table: ${this.config.tableId}`);
        await this.table.create({
          schema: { fields: LOG_TABLE_SCHEMA },
          labels: {
            type: 'agent-logs',
            compliance: 'gdpr-vietnam',
          },
        });
      }

      // Start flush timer
      this.startFlushTimer();

      console.log(`✅ BigQuery logger initialized: ${this.config.projectId}.${this.config.datasetId}.${this.config.tableId}`);
    } catch (error) {
      console.error('❌ Failed to initialize BigQuery logger:', error);
      throw error;
    }
  }

  /**
   * Log an event to BigQuery
   */
  async logEvent(entry: LogEntry): Promise<void> {
    const row = {
      timestamp: entry.timestamp.toISOString(),
      trace_id: entry.traceId || null,
      span_id: entry.spanId || null,
      level: entry.level,
      service: entry.service,
      event: entry.event,
      data: JSON.stringify(entry.data),
      user_id: entry.userId || null,
      session_id: entry.sessionId || null,
      region: 'vietnam-southeast1',
      compliance_marker: 'GDPR-VIETNAM-COMPLIANT',
    };

    this.addToBuffer(row);
  }

  /**
   * Log an error to BigQuery
   */
  async logError(entry: ErrorLogEntry): Promise<void> {
    const row = {
      timestamp: entry.timestamp.toISOString(),
      trace_id: entry.traceId || null,
      span_id: entry.spanId || null,
      level: 'error',
      service: 'dulce-de-saigon-agent',
      event: 'span_error',
      data: JSON.stringify({
        span_name: entry.spanName,
        error_message: entry.error,
        stack_trace: entry.stack,
        attributes: entry.attributes,
      }),
      user_id: null,
      session_id: null,
      region: 'vietnam-southeast1',
      compliance_marker: 'GDPR-VIETNAM-COMPLIANT',
    };

    this.addToBuffer(row);
  }

  /**
   * Log agent performance metrics
   */
  async logPerformanceMetrics(metrics: {
    operation: string;
    duration: number;
    success: boolean;
    errorCount?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'info',
      service: 'dulce-de-saigon-agent',
      event: 'performance_metric',
      data: {
        operation: metrics.operation,
        duration_ms: metrics.duration,
        success: metrics.success,
        error_count: metrics.errorCount || 0,
        metadata: metrics.metadata || {},
      },
    };

    await this.logEvent(entry);
  }

  /**
   * Log user interaction events (F&B specific)
   */
  async logUserInteraction(event: {
    userId: string;
    sessionId: string;
    action: string;
    restaurantId?: string;
    menuItemId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'info',
      service: 'dulce-de-saigon-agent',
      event: 'user_interaction',
      data: {
        action: event.action,
        restaurant_id: event.restaurantId,
        menu_item_id: event.menuItemId,
        metadata: event.metadata || {},
      },
      userId: event.userId,
      sessionId: event.sessionId,
    };

    await this.logEvent(entry);
  }

  /**
   * Add row to buffer
   */
  private addToBuffer(row: any): void {
    this.buffer.push(row);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Flush buffered logs to BigQuery
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const rowsToInsert = [...this.buffer];
    this.buffer = [];

    try {
      await this.table.insert(rowsToInsert);
      console.log(`📊 Flushed ${rowsToInsert.length} log entries to BigQuery`);
    } catch (error) {
      console.error('❌ Failed to insert logs to BigQuery:', error);
      
      // Re-add failed rows to buffer (simple retry logic)
      this.buffer.unshift(...rowsToInsert);
      
      // Prevent infinite buffer growth
      if (this.buffer.length > this.config.bufferSize * 3) {
        console.warn('⚠️  Dropping oldest log entries due to persistent BigQuery errors');
        this.buffer = this.buffer.slice(-this.config.bufferSize);
      }
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushIntervalMs);
  }

  /**
   * Shutdown the logger
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Final flush
    await this.flush();
    console.log('🔄 BigQuery logger shutdown complete');
  }

  /**
   * Query logs from BigQuery (for debugging/monitoring)
   */
  async queryLogs(options: {
    startTime?: Date;
    endTime?: Date;
    level?: string;
    service?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endTime = new Date(),
      level,
      service,
      limit = 100,
    } = options;

    let query = `
      SELECT *
      FROM \`${this.config.projectId}.${this.config.datasetId}.${this.config.tableId}\`
      WHERE timestamp BETWEEN @startTime AND @endTime
    `;

    const params: any = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    if (level) {
      query += ' AND level = @level';
      params.level = level;
    }

    if (service) {
      query += ' AND service = @service';
      params.service = service;
    }

    query += ' ORDER BY timestamp DESC';
    query += ` LIMIT ${limit}`;

    const [rows] = await this.bigquery.query({
      query,
      params,
    });

    return rows;
  }
}