/**
 * @fileoverview index module for the types component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export interface CloudTraceExporterOptions {
  projectId?: string;
  bucketName?: string;
  serviceContext?: {
    service?: string;
    version?: string;
  };
}

export interface LogEntry {
  timestamp: string;
  severity: string;
  message: string;
  [key: string]: any;
}

export interface ErrorLogEntry extends LogEntry {
  error: Error;
  stack?: string;
  context?: Record<string, any>;
}

export interface BigQueryLoggerOptions {
  projectId?: string;
  datasetId?: string;
  tableId?: string;
  serviceContext?: {
    service?: string;
    version?: string;
  };
}
