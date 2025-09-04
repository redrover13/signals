/**
 * @fileoverview cloud-trace-exporter module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Google Cloud Trace exporter for OpenTelemetry
 */
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { Storage } from '@google-cloud/storage';
import { CloudTraceExporterOptions } from './types';

/**
 * Exporter that writes spans to Google Cloud Trace
 */
export class CloudTraceExporter implements SpanExporter {
  private projectId: string;
  private bucketName?: string;
  private storage: Storage;
  private serviceContext: {
    service?: string;
    version?: string;
  };

  /**
   * Constructor
   * @param options Configuration options
   */
  constructor(options: CloudTraceExporterOptions = {}) {
    this.projectId = options.projectId || process.env['GOOGLE_CLOUD_PROJECT'] || '';
    this.bucketName = options.bucketName;
    this.serviceContext = options.serviceContext || {
      service: 'unknown-service',
      version: 'unknown-version',
    };

    this.storage = new Storage(
      this.projectId
        ? {
            projectId: this.projectId,
          }
        : {},
    );
  }

  /**
   * Export spans to Google Cloud Trace
   * @param spans Spans to export
   * @param resultCallback Callback for export result
   */
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    if (!spans || spans.length === 0) {
      resultCallback({ code: ExportResultCode.SUCCESS });
      return;
    }

    try {
      const traceData = this.convertSpansToTraceData(spans);

      if (this.bucketName) {
        this.exportToCloudStorage(traceData)
          .then(() => resultCallback({ code: ExportResultCode.SUCCESS }))
          .catch((err) => {
            console.error('Error exporting to Cloud Storage:', err);
            resultCallback({ code: ExportResultCode.FAILED, error: err });
          });
      } else {
        // If no bucket specified, just log to console in development
        console.log('Trace data (no bucket specified):', JSON.stringify(traceData, null, 2));
        resultCallback({ code: ExportResultCode.SUCCESS });
      }
    } catch (err) {
      console.error('Error converting spans:', err);
      resultCallback({ code: ExportResultCode.FAILED, error: err as Error });
    }
  }

  /**
   * Convert OpenTelemetry spans to Cloud Trace format
   * @param spans Spans to convert
   * @returns Trace data in Cloud Trace format
   */
  private convertSpansToTraceData(spans: ReadableSpan[]): any[] {
    return spans.map((span) => {
      const attributes: Record<string, any> = {};

      // Convert attributes
      span.attributes.forEach((value, key) => {
        attributes[key] = value;
      });

      // Convert events
      const events = span.events.map((event) => ({
        name: event.name,
        timestamp: event.time[0] * 1000000 + event.time[1] / 1000000,
        attributes: event.attributes || {},
      }));

      // Convert links
      const links = span.links.map((link) => ({
        spanId: (link as any).spanId,
        traceId: (link as any).traceId,
        attributes: link.attributes || {},
      }));

      return {
        name: span.name,
        spanId: span.spanContext().spanId,
        traceId: span.spanContext().traceId,
        // parentSpanId: removed - not available in ReadableSpan,
        startTime: span.startTime[0] * 1000000 + span.startTime[1] / 1000000,
        endTime: span.endTime[0] * 1000000 + span.endTime[1] / 1000000,
        attributes,
        events,
        links,
        status: {
          code: span.status.code,
          message: span.status.message || '',
        },
        kind: span.kind,
        serviceContext: this.serviceContext,
      };
    });
  }

  /**
   * Export trace data to Cloud Storage
   * @param traceData Trace data to export
   */
  private async exportToCloudStorage(traceData: any[]): Promise<void> {
    if (!this.bucketName) {
      console.warn('No bucket name specified for Cloud Trace export');
      return;
    }

    const timestamp = new Date().toISOString();
    const filename = `traces/${timestamp}-${Math.random().toString(36).substring(2, 10)}.json`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/json',
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(JSON.stringify(traceData, null, 2));
    });
  }

  /**
   * Shutdown the exporter
   */
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
