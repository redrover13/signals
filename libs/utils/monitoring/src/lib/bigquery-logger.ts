/**
 * @fileoverview bigquery-logger module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * BigQuery Logger for Dulce Saigon
 */
import { BigQuery } from '@google-cloud/bigquery';
import { LogEntry } from './types';

export interface BigQueryLoggerConfig {
  projectId?: string;
  datasetId?: string;
  tableId?: string;
  bufferSize?: number;
  flushIntervalMs?: number;
  serviceContext?: {
    service?: string;
    version?: string;
  };
}

/**
 * Logger that sends log entries to BigQuery
 */
export class BigQueryLogger {
  private bigquery: BigQuery;
  private config: BigQueryLoggerConfig;
  private buffer: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private datasetTable: string;

  /**
   * Constructor
   * @param config Logger configuration
   */
  constructor(config: BigQueryLoggerConfig = {}) {
    this.config = {
      projectId: config.projectId || process.env['GOOGLE_CLOUD_PROJECT'] || '',
      datasetId: config.datasetId || 'logging',
      tableId: config.tableId || 'logs',
      bufferSize: config.bufferSize || 100,
      flushIntervalMs: config.flushIntervalMs || 30000, // 30 seconds
      serviceContext: config.serviceContext || {
        service: 'unknown-service',
        version: 'unknown-version',
      },
    };

    this.bigquery = new BigQuery({
      projectId: this.config.projectId,
    });

    // Construct dataset.table
    this.datasetTable = `${this.config.datasetId}.${this.config.tableId}`;

    // Start flush timer
    this.startFlushTimer();
  }

  /**
   * Log a message to BigQuery
   * @param message Message or object to log
   * @param severity Log severity (info, warn, error)
   * @param metadata Additional metadata
   */
  log(
    message: string | Record<string, any>,
    severity: string = 'info',
    metadata: Record<string, any> = {},
  ): void {
    const timestamp = new Date().toISOString();
    let entry: LogEntry;

    if (typeof message === 'string') {
      entry = {
        timestamp,
        severity,
        message,
        ...metadata,
        serviceContext: this.config.serviceContext,
      };
    } else {
      entry = {
        timestamp,
        severity,
        ...message,
        ...metadata,
        serviceContext: this.config.serviceContext,
      };
    }

    this.addToBuffer(entry);
  }

  /**
   * Log an error to BigQuery
   * @param error Error object
   * @param metadata Additional metadata
   */
  logError(error: Error | any, metadata: Record<string, any> = {}): void {
    const entry = {
      timestamp: new Date().toISOString(),
      severity: 'error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      errorName: error.name,
      ...metadata,
      serviceContext: this.config.serviceContext,
    };

    this.addToBuffer(entry);
  }

  /**
   * Log a performance metric to BigQuery
   * @param metric Performance metric name
   * @param value Metric value
   * @param metadata Additional metadata
   */
  logPerformance(metric: string, value: number, metadata: Record<string, any> = {}): void {
    const entry = {
      timestamp: new Date().toISOString(),
      severity: 'info',
      message: `Performance: ${metric}`,
      metric,
      value,
      ...metadata,
      serviceContext: this.config.serviceContext,
    };

    this.addToBuffer(entry);
  }

  /**
   * Log a user interaction event to BigQuery
   * @param event User interaction event
   */
  async logUserInteraction(event: {
    userId: string | undefined;
    sessionId: string | undefined;
    action: string | undefined;
    restaurantId?: string | undefined;
    menuItemId?: string | undefined;
    metadata?: Record<string, any> | undefined;
  }): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      severity: 'info',
      message: `User Interaction: ${event.action}`,
      userId: event.userId,
      sessionId: event.sessionId,
      action: event.action,
      restaurantId: event.restaurantId,
      menuItemId: event.menuItemId,
      ...(event.metadata || {}),
      serviceContext: this.config.serviceContext,
    };

    this.addToBuffer(entry);
  }

  /**
   * Add a row to the buffer
   * @param row Row to add
   */
  private addToBuffer(row: any): void {
    if (this.buffer) {
      this.buffer.push(row);
    }

    // If buffer is full, flush it
    if (this.buffer && this.buffer.length >= (this.config && config.bufferSize || 100)) {
      this.flush().catch(console.error);
    }
  }

  /**
   * Flush the buffer to BigQuery
   */
  async flush(): Promise<void> {
    if (this.buffer && this.buffer.length === 0) {
      return;
    }

    try {
      // Make a copy of the buffer and clear it
      const rows = [...(this.buffer || [])];
      this.buffer = [];

      // Insert rows into BigQuery
      await this.bigquery
        .dataset(this.config.datasetId || 'logging')
        .table(this.config.tableId || 'logs')
        .insert(rows, {
          skipInvalidRows: true,
          ignoreUnknownValues: true,
        });

      console.log(`Flushed ${rows.length} logs to BigQuery`);
    } catch (error) {
      console.error('Error flushing logs to BigQuery:', error);

      // Add back to buffer for retry
      if (this.buffer) {
        this.buffer.push(...(this.buffer || []));
      }
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config && config.flushIntervalMs || 30000);
  }

  /**
   * Shutdown the logger
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    try {
      await this.flush();
    } catch (error) {
      console.error('Error during shutdown flush:', error);
    }
  }

  /**
   * Query logs from BigQuery
   * @param options Query options
   */
  async queryLogs(
    options: {
      startTime?: Date | undefined;
      endTime?: Date | undefined;
      level?: string | undefined;
      service?: string | undefined;
      limit?: number | undefined;
    } = {},
  ): Promise<any[]> {
    const { startTime, endTime, level, service, limit = 100 } = options;

    let query = `
      SELECT *
      FROM \`${this.config.projectId}.${this.datasetTable}\`
      WHERE 1=1
    `;

    const params: any = {};

    if (startTime) {
      query += ` AND timestamp >= @startTime`;
      if (params) {
        params.startTime = startTime.toISOString();
      }
    }

    if (endTime) {
      query += ` AND timestamp <= @endTime`;
      if (params) {
        params.endTime = endTime.toISOString();
      }
    }

    if (level) {
      query += ` AND severity = @level`;
      if (params) {
        params.level = level;
      }
    }

    if (service) {
      query += ` AND serviceContext.service = @service`;
      if (params) {
        params.service = service;
      }
    }

    query += ' ORDER BY timestamp DESC';
    query += ` LIMIT ${limit}`;

    try {
      const [rows] = await this.bigquery.query({
        query,
        params,
        parameterMode: 'named',
      });

      return rows;
    } catch (error) {
      console.error('Error querying logs:', error);
      throw error;
    }
  }
}
