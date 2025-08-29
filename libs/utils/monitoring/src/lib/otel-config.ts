/**
 * @fileoverview OpenTelemetry configuration for Dulce de Saigon F&B Data Platform
 *
 * This file configures OpenTelemetry instrumentation for capturing traces and logs
 * from agent operations, with custom Cloud Trace exporter for large payloads.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { 
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';
import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { CloudTraceExporter } from './cloud-trace-exporter';
import { BigQueryLogger } from './bigquery-logger';

/**
 * OpenTelemetry configuration options
 */
export interface OtelConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  gcpProjectId?: string;
  enableAutoInstrumentation?: boolean;
  enableCustomExporter?: boolean;
  enableBigQueryLogs?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<OtelConfig> = {
  serviceName: 'dulce-de-saigon-agent',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  gcpProjectId: process.env.GCP_PROJECT_ID || '',
  enableAutoInstrumentation: true,
  enableCustomExporter: true,
  enableBigQueryLogs: true,
};

let sdk: NodeSDK | null = null;
let bigQueryLogger: BigQueryLogger | null = null;

/**
 * Initialize OpenTelemetry instrumentation
 */
export async function initializeOpenTelemetry(config: Partial<OtelConfig> = {}): Promise<NodeSDK> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (sdk) {
    console.log('OpenTelemetry already initialized');
    return sdk;
  }

  console.log('🔧 Initializing OpenTelemetry...');

  // Create resource with service metadata
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: finalConfig.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: finalConfig.serviceVersion,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
  });

  // Initialize BigQuery logger
  if (finalConfig.enableBigQueryLogs && finalConfig.gcpProjectId) {
    bigQueryLogger = new BigQueryLogger({
      projectId: finalConfig.gcpProjectId,
      datasetId: process.env.BIGQUERY_LOGS_DATASET || 'agent_logs',
      tableId: process.env.BIGQUERY_LOGS_TABLE || 'trace_logs',
    });
    await bigQueryLogger.initialize();
  }

  // Configure SDK
  const sdkOptions: any = {
    resource,
  };

  // Add auto-instrumentations if enabled
  if (finalConfig.enableAutoInstrumentation) {
    sdkOptions.instrumentations = [
      getNodeAutoInstrumentations({
        // Disable noisy instrumentations
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
      }),
    ];
  }

  // Add custom trace exporter if enabled
  if (finalConfig.enableCustomExporter && finalConfig.gcpProjectId) {
    const customExporter = new CloudTraceExporter({
      projectId: finalConfig.gcpProjectId,
      bucketName: process.env.GCS_TRACES_BUCKET || `${finalConfig.gcpProjectId}-agent-traces`,
    });
    
    sdkOptions.traceExporter = customExporter;
  }

  sdk = new NodeSDK(sdkOptions);

  try {
    sdk.start();
    console.log('✅ OpenTelemetry initialized successfully');
    console.log(`📊 Service: ${finalConfig.serviceName}`);
    console.log(`🌍 Environment: ${finalConfig.environment}`);
    console.log(`☁️  GCP Project: ${finalConfig.gcpProjectId || 'not configured'}`);
  } catch (error) {
    console.error('❌ Failed to initialize OpenTelemetry:', error);
    throw error;
  }

  return sdk;
}

/**
 * Shutdown OpenTelemetry instrumentation
 */
export async function shutdownOpenTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
    console.log('🔄 OpenTelemetry shutdown complete');
  }

  if (bigQueryLogger) {
    await bigQueryLogger.shutdown();
    bigQueryLogger = null;
  }
}

/**
 * Get the current tracer instance
 */
export function getTracer(name = 'dulce-de-saigon-agent') {
  return trace.getTracer(name);
}

/**
 * Create a new span with automatic error handling
 */
export async function withSpan<T>(
  name: string,
  operation: (span: any) => Promise<T>,
  options: {
    attributes?: Record<string, string | number | boolean>;
    kind?: SpanKind;
  } = {}
): Promise<T> {
  const tracer = getTracer();
  
  return tracer.startActiveSpan(name, {
    kind: options.kind || SpanKind.INTERNAL,
    attributes: options.attributes,
  }, async (span) => {
    try {
      const result = await operation(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (error instanceof Error) {
        span.recordException(error);
      }
      
      // Log to BigQuery if available
      if (bigQueryLogger) {
        await bigQueryLogger.logError({
          spanName: name,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          attributes: options.attributes,
          timestamp: new Date(),
        });
      }
      
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Log a structured event with trace context
 */
export async function logEvent(
  event: string,
  data: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
): Promise<void> {
  const span = trace.getActiveSpan();
  const traceId = span?.spanContext().traceId;
  const spanId = span?.spanContext().spanId;

  const logEntry = {
    event,
    level,
    data,
    traceId,
    spanId,
    timestamp: new Date(),
    service: 'dulce-de-saigon-agent',
  };

  // Add span attributes
  if (span) {
    span.addEvent(event, data);
  }

  // Log to BigQuery if available
  if (bigQueryLogger) {
    await bigQueryLogger.logEvent(logEntry);
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Agent Event:', logEntry);
  }
}

/**
 * Instrument a function with automatic tracing
 */
export function instrument<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  options: {
    attributes?: Record<string, string | number | boolean>;
    kind?: SpanKind;
  } = {}
): T {
  return (async (...args: any[]) => {
    return withSpan(
      name,
      async (span) => {
        // Add function arguments as attributes (be careful with sensitive data)
        if (options.attributes) {
          Object.entries(options.attributes).forEach(([key, value]) => {
            span.setAttributes({ [key]: value });
          });
        }
        
        return fn(...args);
      },
      options
    );
  }) as T;
}