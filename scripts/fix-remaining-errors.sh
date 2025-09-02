#!/bin/bash

# Fix remaining TypeScript syntax errors
# This script addresses specific syntax errors after the initial fixes

echo "🔧 Fixing remaining syntax errors..."

# Fix error-handler.ts
if [ -f ./libs/utils/monitoring/src/lib/error-handler.ts ]; then
  echo "📝 Fixing error-handler.ts..."
  cat > ./libs/utils/monitoring/src/lib/error-handler.ts << 'EOF'
import { BigQueryLogger } from './bigquery-logger';

export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  INTERNAL = 'internal',
  EXTERNAL_SERVICE = 'external_service',
  PERMISSIONS = 'permissions',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ErrorOptions {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  originalError?: Error;
  retryable?: boolean;
  retryDelay?: number;
  userMessage?: string;
}

export interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: Record<string, any>;
  originalError?: Error;
  retryable: boolean;
  retryDelay?: number;
  userMessage?: string;
}

function isRetryableError(category: ErrorCategory): boolean {
  return [
    ErrorCategory.DATABASE,
    ErrorCategory.NETWORK,
    ErrorCategory.EXTERNAL_SERVICE,
    ErrorCategory.TIMEOUT
  ].includes(category);
}

function getLogLevel(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 'error';
    case ErrorSeverity.ERROR:
      return 'error';
    case ErrorSeverity.WARNING:
      return 'warn';
    case ErrorSeverity.INFO:
      return 'info';
    default:
      return 'error';
  }
}

export function createError(
  message: string,
  options: ErrorOptions = {}
): AppError {
  const {
    category = ErrorCategory.UNKNOWN,
    severity = ErrorSeverity.ERROR,
    context = {},
    originalError,
    retryable = isRetryableError(category),
    retryDelay,
    userMessage = 'An error occurred. Please try again later.'
  } = options;

  const error = new Error(message) as AppError;
  error.name = 'AppError';
  
  if (error) {
    error.category = category;
    error.severity = severity;
    error.context = {
      ...context,
      timestamp: new Date()
    };
    error.originalError = originalError;
    error.retryable = isRetryableError(category);
    error.userMessage = userMessage;
  }

  return error;
}

export function logError(error: AppError, logger?: BigQueryLogger): void {
  const logLevel = getLogLevel(error.severity || 'error');
  
  // Log to console
  console[logLevel](`[${error.category}] ${error.message}`, {
    severity: error.severity,
    context: error.context,
    stack: error.stack
  });

  // Log to BigQuery if logger provided
  if (logger) {
    logger.log({
      message: error.message,
      severity: error.severity,
      category: error.category,
      context: error.context,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

export function handleError(error: AppError, logger?: BigQueryLogger): void {
  logError(error, logger);
  
  // Add additional error handling logic here
  // For example, sending to error monitoring service
}
EOF
fi

# Fix otel-config.ts
if [ -f ./libs/utils/monitoring/src/lib/otel-config.ts ]; then
  echo "📝 Fixing otel-config.ts..."
  cat > ./libs/utils/monitoring/src/lib/otel-config.ts << 'EOF'
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SpanKind, SpanStatusCode, Tracer, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BigQueryLogger } from './bigquery-logger';
import { CloudTraceExporter } from './cloud-trace-exporter';
import { Signal, computed, effect, signal } from '@angular/core';

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
EOF
fi

# Fix mcp-utils.ts
if [ -f ./libs/utils/monitoring/src/lib/mcp-utils.ts ]; then
  echo "📝 Fixing mcp-utils.ts..."
  cat > ./libs/utils/monitoring/src/lib/mcp-utils.ts << 'EOF'
/**
 * Utility functions for Model Context Protocol (MCP) servers
 */

export interface McpServerConfig {
  name: string;
  enabled: boolean;
  endpoint: string;
  auth?: {
    type: 'none' | 'apikey' | 'oauth';
    key?: string;
    token?: string;
  };
  timeoutMs?: number;
  retries?: number;
  tools?: string[];
  modelContext?: Record<string, any>;
}

export interface McpMetrics {
  serverCount: number;
  healthyServers: number;
  requestCount: number;
  successCount: number;
  failureCount: number;
  avgResponseTimeMs: number;
  p95ResponseTimeMs: number;
  p99ResponseTimeMs: number;
  timeWindow: {
    start: string;
    end: string;
  };
}

/**
 * Format MCP metrics for logging and monitoring
 * @param metrics MCP metrics object
 * @returns Formatted metrics string
 */
export function formatMcpMetrics(metrics: McpMetrics): string {
  if (!metrics) {
    return 'No metrics available';
  }
  
  return `
MCP Metrics:
-----------
Servers: ${metrics?.serverCount || 0} (${metrics?.healthyServers || 0} healthy)
Requests: ${metrics?.requestCount || 0} (${metrics?.successCount || 0} success, ${metrics?.failureCount || 0} failures)
Response Times: 
  - Avg: ${metrics?.avgResponseTimeMs || 0}ms
  - P95: ${metrics?.p95ResponseTimeMs || 0}ms
  - P99: ${metrics?.p99ResponseTimeMs || 0}ms
Time Window: ${metrics?.timeWindow?.start || 'N/A'} to ${metrics?.timeWindow?.end || 'N/A'}
`;
}

/**
 * Safely parse a JSON string into an object
 * @param jsonStr JSON string to parse
 * @param defaultValue Default value to return if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(jsonStr: string | null | undefined, defaultValue: T): T {
  if (!jsonStr) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Error parsing JSON:', err);
    return defaultValue;
  }
}

/**
 * Create a standardized health check for MCP servers
 * @param config MCP server configuration
 * @returns Promise resolving to a health check result
 */
export async function checkMcpServerHealth(config: McpServerConfig): Promise<boolean> {
  if (!config || !config.enabled || !config.endpoint) {
    return false;
  }
  
  try {
    const response = await fetch(`${config.endpoint}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(config.auth?.type === 'apikey' && config.auth.key 
          ? { 'Authorization': `Bearer ${config.auth.key}` } 
          : {})
      },
      timeout: config.timeoutMs || 5000
    });
    
    return response.ok;
  } catch (err) {
    console.error(`Health check failed for MCP server ${config.name}:`, err);
    return false;
  }
}

/**
 * Calculate metrics for MCP server configuration
 * @param config MCP configuration with multiple servers
 * @returns MCP metrics object
 */
export function calculateMcpMetrics(config: { servers?: McpServerConfig[] }): McpMetrics {
  const metrics: McpMetrics = {
    serverCount: 0,
    healthyServers: 0,
    requestCount: 0,
    successCount: 0,
    failureCount: 0,
    avgResponseTimeMs: 0,
    p95ResponseTimeMs: 0,
    p99ResponseTimeMs: 0,
    timeWindow: {
      start: new Date(Date.now() - 3600000).toISOString(), // Last hour
      end: new Date().toISOString()
    }
  };
  
  if (config?.servers) {
    config.servers.forEach((server, index) => {
      if (server && server.enabled) {
        metrics.serverCount++;
        // We'd need to actually check health in a real implementation
        // For now, we'll simulate some healthy servers
        if (index % 3 !== 0) { // Arbitrary condition for demo
          metrics.healthyServers++;
        }
      }
    });
  }
  
  const enabledServers = config?.servers ? config.servers.filter(s => s && s.enabled) : [];
  metrics.serverCount = enabledServers.length;
  
  // Sample data for demonstration
  metrics.requestCount = 1250;
  metrics.successCount = 1180;
  metrics.failureCount = 70;
  metrics.avgResponseTimeMs = 234;
  metrics.p95ResponseTimeMs = 456;
  metrics.p99ResponseTimeMs = 789;
  
  return metrics;
}
EOF
fi

# Fix signals/index.ts
if [ -f ./libs/utils/signals/src/index.ts ]; then
  echo "📝 Fixing signals/index.ts..."
  cat > ./libs/utils/signals/src/index.ts << 'EOF'
/**
 * Angular Signals implementation
 */
import { Signal, computed as angularComputed, effect as angularEffect, signal as angularSignal } from '@angular/core';

/**
 * Create a signal with the given initial value
 * @param initialValue Initial value for the signal
 * @returns Signal instance
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  return angularSignal<T>(initialValue);
}

/**
 * Create a computed signal derived from other signals
 * @param derivationFn Function that computes the derived value
 * @returns Computed signal
 */
export function createComputed<T>(derivationFn: () => T): Signal<T> {
  return angularComputed<T>(derivationFn);
}

/**
 * Register an effect that runs when dependencies change
 * @param effectFn Effect function to run
 * @returns Cleanup function
 */
export function createEffect(effectFn: () => void): () => void {
  return angularEffect(effectFn);
}

/**
 * Create a derived signal from a set of input signals
 * @param inputs Object of input signals
 * @param derivationFn Function that computes the derived value
 * @returns Derived signal
 */
export function derive<D extends Record<string, Signal<any>>, T>(
  inputs: D,
  derivationFn: (values: { [K in keyof D]: D[K] extends Signal<infer U> ? U : never }) => T
): Omit<Signal<T>, 'set'> {
  // Create the derived signal
  const derivedValue = createSignal<T>(
    derivationFn(mapSignalValues(inputs))
  );
  
  // Track dependencies
  const dependencies = Object.values(inputs) as Signal<any>[];
  
  // Set up effect to update the derived value
  if (dependencies) {
    dependencies.map((dep) => {
      createEffect(() => {
        const values = mapSignalValues(inputs);
        const newValue = derivationFn(values);
        (derivedValue as any).set(newValue);
      });
    });
  }
  
  // Remove the set method to make it read-only
  const { set, ...readOnlySignal } = derivedValue as any;
  
  return readOnlySignal;
}

/**
 * Helper to map signal objects to their current values
 */
function mapSignalValues<D extends Record<string, Signal<any>>>(
  inputs: D
): { [K in keyof D]: D[K] extends Signal<infer U> ? U : never } {
  const result: any = {};
  
  for (const key in inputs) {
    if (Object.prototype.hasOwnProperty.call(inputs, key)) {
      const signal = inputs[key];
      result[key] = signal();
    }
  }
  
  return result;
}

/**
 * Create a mutable signal that can be set
 * @param initialValue Initial value
 * @returns Mutable signal
 */
export function mutable<T>(initialValue: T): Signal<T> & { set: (newValue: T) => void } {
  const signal = createSignal<T>(initialValue);
  
  // Add set method
  const mutableSignal = signal as Signal<T> & { set: (newValue: T) => void };
  
  if (mutableSignal) {
    mutableSignal.set = (newValue: T) => {
      (signal as any).set(newValue);
    };
  }
  
  return mutableSignal;
}

/**
 * Create a signal that can only be set once
 * @param initialValue Initial value
 * @returns Signal that can only be set once
 */
export function immutable<T>(initialValue: T): Signal<T> {
  return createSignal<T>(initialValue);
}

export { Signal, angularComputed as computed, angularEffect as effect, angularSignal as signal };
EOF
fi

# Fix tools/scripts/update-project-configs.ts
if [ -f ./tools/scripts/update-project-configs.ts ]; then
  echo "📝 Fixing update-project-configs.ts..."
  cat > ./tools/scripts/update-project-configs.ts << 'EOF'
/**
 * Script to update project configuration files
 */
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ProjectConfig {
  name?: string;
  $schema?: string;
  projectType?: 'application' | 'library';
  sourceRoot?: string;
  targets?: Record<string, any>;
  tags?: string[];
  implicitDependencies?: string[];
  namedInputs?: Record<string, any>;
}

const STANDARD_ESLINT_CONFIG = {
  executor: '@nx/eslint:lint',
  outputs: ['{options.outputFile}'],
  options: {
    lintFilePatterns: ['libs/**/*.ts', 'libs/**/*.html']
  }
};

const STANDARD_TEST_CONFIG = {
  executor: '@nx/jest:jest',
  outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
  options: {
    jestConfig: 'jest.config.ts',
    passWithNoTests: true
  },
  configurations: {
    ci: {
      ci: true,
      codeCoverage: true
    }
  }
};

const STANDARD_BUILD_CONFIG = {
  executor: '@nx/js:tsc',
  outputs: ['{options.outputPath}'],
  options: {
    outputPath: 'dist/{projectRoot}',
    tsConfig: '{projectRoot}/tsconfig.lib.json',
    packageJson: '{projectRoot}/package.json',
    main: '{projectRoot}/src/index.ts',
    assets: ['{projectRoot}/*.md']
  }
};

/**
 * Update project configuration files
 */
async function updateProjectConfigs(): Promise<void> {
  const projectPaths = await glob('libs/**/project.json');
  
  for (const projectPath of projectPaths) {
    console.log(`Updating ${projectPath}...`);
    
    try {
      const configContent = fs.readFileSync(projectPath, 'utf8');
      const config: ProjectConfig = JSON.parse(configContent);
      
      // Extract domain from path for tagging
      const pathParts = path.dirname(projectPath).split(path.sep);
      const domain = pathParts[1]; // 'libs/domain/...'
      
      // Add standard configurations
      if (config?.targets) {
        config.targets["build"] = {
          ...STANDARD_BUILD_CONFIG,
          ...config.targets["build"]
        };
        
        config.targets["lint"] = {
          ...STANDARD_ESLINT_CONFIG,
          ...config.targets["lint"]
        };
        
        config.targets["test"] = {
          ...STANDARD_TEST_CONFIG,
          ...config.targets["test"]
        };
      }
      
      // Add named inputs for cache busting
      if (config) {
        config.namedInputs = {
          default: ['{projectRoot}/**/*', '!{projectRoot}/**/*.test.ts'],
          production: ['default'],
          ...config.namedInputs
        };
      }
      
      // Add domain tags
      if (config) {
        config.tags = config.tags || [];
      }
      
      if (config?.tags && domain && !config.tags.includes(domain)) {
        config.tags.push(domain);
      }
      
      // Write updated config
      fs.writeFileSync(projectPath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`✅ Updated ${projectPath}`);
    } catch (err) {
      console.error(`Error updating ${projectPath}:`, err);
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🔄 Updating project configurations...');
  await updateProjectConfigs();
  console.log('✅ Project configurations updated successfully!');
}

// Run the script
main().catch(err => {
  console.error('Error updating project configurations:', err);
  process.exit(1);
});
EOF
fi

# Fix cloud-trace-exporter.ts
if [ -f ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts ]; then
  echo "📝 Fixing cloud-trace-exporter.ts..."
  cat > ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts << 'EOF'
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
    
    this.storage = new Storage(this.projectId ? {
      projectId: this.projectId
    } : {});
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
    return spans.map(span => {
      const attributes: Record<string, any> = {};
      
      // Convert attributes
      span.attributes.forEach((value, key) => {
        attributes[key] = value;
      });
      
      // Convert events
      const events = span.events.map(event => ({
        name: event.name,
        timestamp: event.time[0] * 1000000 + event.time[1] / 1000000,
        attributes: event.attributes || {},
      }));
      
      // Convert links
      const links = span.links.map(link => ({
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
EOF
fi

# Fix secrets-manager/src/index.ts
if [ -f ./libs/utils/secrets-manager/src/index.ts ]; then
  echo "📝 Fixing secrets-manager/src/index.ts..."
  cat > ./libs/utils/secrets-manager/src/index.ts << 'EOF'
/**
 * Secrets Manager for Dulce Saigon
 */
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { DulceSecretManager } from './lib/gcp-secret-manager';
import { DULCE_SECRETS } from './lib/secrets-config';

// Environment variables
const PROJECT_ID = process.env['GOOGLE_CLOUD_PROJECT'] || '';
const ENVIRONMENT = process.env['NODE_ENV'] || 'development';

class SecretsManager {
  private secretManager: DulceSecretManager | null = null;
  private cachedSecrets: Record<string, string> = {};
  private initialized = false;

  /**
   * Initialize the secrets manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      if (!PROJECT_ID) {
        console.warn('GOOGLE_CLOUD_PROJECT environment variable not set');
      }
      
      if (this) {
        this.secretManager = new DulceSecretManager(PROJECT_ID);
      }
      
      // Load required secrets
      await this.loadRequiredSecrets();
      
      this.initialized = true;
      console.log('Secrets Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Secrets Manager:', error);
      throw error;
    }
  }

  /**
   * Load all required secrets
   */
  private async loadRequiredSecrets(): Promise<void> {
    if (!this.secretManager) {
      throw new Error('Secret Manager not initialized');
    }
    
    for (const secretConfig of DULCE_SECRETS) {
      const { name, required } = secretConfig;
      
      try {
        // Check if environment variable exists first
        const envValue = process.env[name];
        
        if (envValue) {
          this.cachedSecrets[name] = envValue;
          continue;
        }
        
        // Try to get from Secret Manager
        const secretValue = await this.secretManager.getSecret(
          `${name}_${ENVIRONMENT}`
        );
        
        this.cachedSecrets[name] = secretValue;
      } catch (error) {
        if (required) {
          console.error(`Failed to load required secret ${name}:`, error);
          throw error;
        } else {
          console.warn(`Non-required secret ${name} not found`);
        }
      }
    }
  }

  /**
   * Get a secret by name
   * @param name Secret name
   * @returns Secret value
   */
  getSecret(name: string): string {
    if (!this.initialized) {
      throw new Error('Secrets Manager not initialized');
    }
    
    const secretValue = this.cachedSecrets[name];
    
    if (!secretValue) {
      throw new Error(`Secret ${name} not found`);
    }
    
    return secretValue;
  }

  /**
   * Check if a secret exists
   * @param name Secret name
   * @returns True if the secret exists
   */
  hasSecret(name: string): boolean {
    return Boolean(this.cachedSecrets[name]);
  }
}

// Export singleton instance
export const secretsManager = new SecretsManager();

// Re-export types
export { DulceSecretManager };
EOF
fi

echo "✅ Second round of fixes completed!"
echo "Run 'npx tsc --noEmit --skipLibCheck' to check for remaining errors."
