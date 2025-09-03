/**
 * @fileoverview otel-config module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SpanKind, SpanStatusCode, Tracer, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BigQueryLogger } from './bigquery-logger';
import { CloudTraceExporter } from './cloud-trace-exporter';

// Default OpenTelemetry configuration
export const DEFAULT_CONFIG = {
  serviceName: 'dulce-saigon-service',
  serviceVersion: '1.0.0',
  environment: 'development',
  traceExporterEndpoint: 'http://localhost:4318/v1/traces',
  logLevel: 'info',
  instrumentations: [],
  enabled: true,
};

// Type for OpenTelemetry configuration
export interface OtelConfig {
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  traceExporterEndpoint?: string;
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  instrumentations?: any[];
  enabled?: boolean;
}

// Global instance
let sdk: NodeSDK | null = null;
let tracer: Tracer | null = null;

/**
 * Initialize OpenTelemetry with configuration
 * @param config Optional configuration to override defaults
 */
export function initializeOpenTelemetry(config?: OtelConfig): NodeSDK | null {
  if (sdk) {
    return sdk;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enabled) {
    console.log('OpenTelemetry is disabled');
    return null;
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: finalConfig.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: finalConfig.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
  });

  let traceExporter: ConsoleSpanExporter | OTLPTraceExporter | CloudTraceExporter;
  
  if (finalConfig.environment === 'production') {
    // Use GCP Cloud Trace in production
    traceExporter = new CloudTraceExporter({
      projectId: process.env['GOOGLE_CLOUD_PROJECT'],
      serviceContext: {
        service: finalConfig.serviceName,
        version: finalConfig.serviceVersion,
      },
    });
  } else if (finalConfig.traceExporterEndpoint) {
    // Use OTLP exporter if endpoint provided
    traceExporter = new OTLPTraceExporter({
      url: finalConfig.traceExporterEndpoint,
    });
  } else {
    // Fallback to console exporter
    traceExporter = new ConsoleSpanExporter();
  }

  const sdkOptions = {
    resource,
    traceExporter,
  };

  if (sdkOptions && finalConfig.instrumentations && finalConfig.instrumentations.length > 0) {
    sdkOptions.instrumentations = finalConfig.instrumentations;
  }

  if (finalConfig.environment === 'production' && process.env['GOOGLE_CLOUD_PROJECT']) {
    const customExporter = new CloudTraceExporter({
      projectId: process.env['GOOGLE_CLOUD_PROJECT'],
      serviceContext: {
        service: finalConfig.serviceName,
        version: finalConfig.serviceVersion,
      },
    });
    
    if (sdkOptions) {
      sdkOptions.traceExporter = customExporter;
    }
  }

  sdk = new NodeSDK(sdkOptions);
  sdk.start();

  // Set up global tracer
  tracer = trace.getTracer(finalConfig.serviceName);

  console.log(`OpenTelemetry initialized for ${finalConfig.serviceName} in ${finalConfig.environment} environment`);
  
  return sdk;
}

/**
 * Get the global tracer instance
 */
export function getTracer(): Tracer {
  if (!tracer) {
    throw new Error('OpenTelemetry tracer not initialized. Call initializeOpenTelemetry first.');
  }
  return tracer;
}

/**
 * Create a new span
 * @param name Name of the span
 * @param options Span options
 */
export function createSpan(name: string, options?: { attributes?: Record<string, string | number | boolean>, kind?: SpanKind }) {
  const tracer = getTracer();
  
  return tracer.startSpan(name || 'unnamed-span', {
    attributes: options?.attributes || {},
    kind: options?.kind || SpanKind.INTERNAL,
  });
}

/**
 * Create a span within a context
 * @param name Name of the span
 * @param options Span options
 */
export function startActiveSpan<T>(name: string, callback: (span: any) => T, options?: { attributes?: Record<string, string | number | boolean>, kind?: SpanKind }): T {
  const tracer = getTracer();
  
  return tracer.startActiveSpan(name || 'unnamed-span', {
    attributes: options?.attributes || {},
    kind: options?.kind || SpanKind.INTERNAL,
  }, (span) => {
    try {
      const result = callback(span);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error)?.message || 'Unknown error',
      });
      span.end();
      throw error;
    }
  });
}

/**
 * Add an event to a span
 * @param span The span to add the event to
 * @param event Event name
 * @param data Additional event data
 */
export function addSpanEvent(span: any, event: string, data?: Record<string, any>): void {
  if (span) {
    span.addEvent(event || 'unnamed-event', data);
  }
}

/**
 * Set span attributes
 * @param span The span to set attributes on
 * @param attributes Attributes to set
 */
export function setSpanAttributes(span: any, attributes: Record<string, string | number | boolean>): void {
  if (span && attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Instrument a function with tracing
 * @param name Span name
 * @param fn Function to instrument
 * @param options Optional configuration
 */
export function instrument<T extends (...args: any[]) => any>(
  name: string | undefined,
  fn: T,
  options: {
    attributes?: Record<string, string | number | boolean> | undefined;
    kind?: SpanKind | undefined;
  } = {}
): T {
  return (async (...args: any[]) => {
    const spanName = name || fn.name || 'anonymous';
    
    return startActiveSpan(
      spanName,
      async (span) => {
        if (options.attributes) {
          setSpanAttributes(span, options.attributes);
        }
        
        try {
          const result = await fn(...args);
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error)?.message || 'Unknown error',
          });
          throw error;
        }
      },
      { kind: options.kind }
    );
  }) as T;
}

/**
 * Shutdown OpenTelemetry
 */
export function shutdownOpenTelemetry(): Promise<void> {
  if (!sdk) {
    return Promise.resolve();
  }
  
  return sdk.shutdown();
}
