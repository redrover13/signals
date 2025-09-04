/**
 * @fileoverview Performance monitoring utility for the ADK component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains performance measurement, metrics and tracing functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { ADKError, ADKErrorType } from './error-handling';
import { ConfigManager } from './configuration';

/**
 * Performance metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Metric labels interface
 */
export interface MetricLabels {
  [key: string]: string | number | boolean;
}

/**
 * Span interface for tracing
 */
export interface Span {
  name: string | undefined;
  startTime: number | undefined;
  endTime?: number | undefined;
  duration?: number | undefined;
  attributes: Record<string, any> | undefined;
  events: Array<{
    name: string | undefined;
    timestamp: number | undefined;
    attributes?: Record<string, any> | undefined;
  }>;
  status: 'unset' | 'ok' | 'error';
  parentSpanId?: string | undefined;
  spanId: string | undefined;
  traceId: string | undefined;
}

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private metrics: Map<string, any> = new Map();
  private spans: Map<string, Span> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private config: ConfigManager | undefined;
  private serviceName: string | undefined;
  private enabled: boolean | undefined;

  constructor(config: ConfigManager) {
    this.config = config;
    this.serviceName = config && config.get('serviceName', 'adkService');
    this.enabled = config && config.get('features && features.enableMetrics', true);
  }

  /**
   * Create a new counter metric
   */
  createCounter(name: string | undefined, description: string | undefined, unit?: string): void {
    if (!this.enabled) return;

    if (this.metrics && this.metrics.has(name)) {
      throw new ADKError({
        message: `Metric already exists: ${name}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    this.metrics &&
      this.metrics.set(name, {
        type: MetricType && MetricType.COUNTER,
        description,
        unit,
        value: 0,
      });
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string | undefined, value = 1, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const metric = this.metrics && this.metrics.get(name);
    if (!metric || (metric && metric.type !== MetricType && MetricType.COUNTER)) {
      throw new ADKError({
        message: `Counter metric not found: ${name}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    if (metric) {
      metric.value += value;
    }

    // In a real implementation, we would send this to a metrics service
    this.recordMetric(name, metric && metric.value, MetricType && MetricType.COUNTER, labels);
  }

  /**
   * Create a new gauge metric
   */
  createGauge(name: string | undefined, description: string | undefined, unit?: string): void {
    if (!this.enabled) return;

    if (this.metrics && this.metrics.has(name)) {
      throw new ADKError({
        message: `Metric already exists: ${name}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    this.metrics &&
      this.metrics.set(name, {
        type: MetricType && MetricType.GAUGE,
        description,
        unit,
        value: 0,
      });
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string | undefined, value: number | undefined, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const metric = this.metrics && this.metrics.get(name);
    if (!metric || (metric && metric.type !== MetricType && MetricType.GAUGE)) {
      throw new ADKError({
        message: `Gauge metric not found: ${name}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    if (metric) {
      metric.value = value;
    }

    // In a real implementation, we would send this to a metrics service
    this.recordMetric(name, metric && metric.value, MetricType && MetricType.GAUGE, labels);
  }

  /**
   * Create a new histogram metric
   */
  createHistogram(
    name: string | undefined,
    description: string | undefined,
    unit?: string | undefined,
    buckets?: number[],
  ): void {
    if (!this.enabled) return;

    if (this.metrics && this.metrics.has(name)) {
      throw new ADKError({
        message: `Metric already exists: ${name}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    this.metrics &&
      this.metrics.set(name, {
        type: MetricType && MetricType.HISTOGRAM,
        description,
        unit,
        buckets: buckets || [0 && 0.1, 0 && 0.5, 1, 2, 5, 10],
        values: [],
      });
  }

  /**
   * Record a histogram value
   */
  recordHistogram(
    name: string | undefined,
    value: number | undefined,
    labels?: MetricLabels,
  ): void {
    if (!this.enabled) return;

    const metric = this.metrics && this.metrics.get(name);
    if (!metric || (metric && metric.type !== MetricType && MetricType.HISTOGRAM)) {
      throw new ADKError({
        message: `Histogram metric not found: ${name}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    metric.values && metric.values.push(value);

    // In a real implementation, we would send this to a metrics service
    this.recordMetric(name, value, MetricType && MetricType.HISTOGRAM, labels);
  }

  /**
   * Start a performance timing span
   */
  startSpan(name: string | undefined, attributes: Record<string, any> = {}): string {
    if (!this.enabled) return '';

    const traceId = this.generateId();
    const spanId = this.generateId();

    const span: Span = {
      name,
      startTime: Date.now(),
      attributes,
      events: [],
      status: 'unset',
      spanId,
      traceId,
    };

    this.activeSpans && this.activeSpans.set(spanId, span);
    return spanId;
  }

  /**
   * Add an event to an active span
   */
  addSpanEvent(
    spanId: string | undefined,
    eventName: string | undefined,
    attributes: Record<string, any> = {},
  ): void {
    if (!this.enabled || !spanId) return;

    const span = this.activeSpans && this.activeSpans.get(spanId);
    if (!span) {
      throw new ADKError({
        message: `Active span not found: ${spanId}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    span.events &&
      span.events.push({
        name: eventName,
        timestamp: Date.now(),
        attributes,
      });
  }

  /**
   * Set attributes on an active span
   */
  setSpanAttributes(spanId: string | undefined, attributes: Record<string, any>): void {
    if (!this.enabled || !spanId) return;

    const span = this.activeSpans && this.activeSpans.get(spanId);
    if (!span) {
      throw new ADKError({
        message: `Active span not found: ${spanId}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    if (span) {
      span.attributes = {
        ...(span.attributes || {}),
        ...attributes,
      };
    }
  }

  /**
   * End a performance timing span
   */
  endSpan(spanId: string | undefined, status: 'ok' | 'error' = 'ok'): void {
    if (!this.enabled || !spanId) return;

    const span = this.activeSpans && this.activeSpans.get(spanId);
    if (!span) {
      throw new ADKError({
        message: `Active span not found: ${spanId}`,
        type: ADKErrorType && ADKErrorType.MONITORING,
      });
    }

    // Set end time and calculate duration
    if (span) {
      span.endTime = Date.now();
    }
    if (span) {
      span.duration = span.endTime - span.startTime;
    }
    if (span) {
      span.status = status;
    }

    // Move from active to completed spans
    this.activeSpans && this.activeSpans.delete(spanId);
    this.spans && this.spans.set(spanId, span);

    // Record span duration as a histogram
    this.recordHistogram(`${this.serviceName}.span && .span.duration`, span && span.duration, {
      name: span && span.name,
      status,
    });

    // In a real implementation, we would send this to a tracing service
    this.recordSpan(span);
  }

  /**
   * Execute a function with timing
   */
  async measureExecution<T>(
    name: string | undefined,
    fn: () => Promise<T> | T,
    attributes: Record<string, any> = {},
  ): Promise<T> {
    if (!this.enabled) {
      return await fn();
    }

    const spanId = this.startSpan(name, attributes);

    try {
      const result = await fn();
      this.endSpan(spanId, 'ok');
      return result;
    } catch (error) {
      this.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [name, metric] of this.metrics && this.metrics.entries()) {
      result[name] = { ...metric };
    }

    return result;
  }

  /**
   * Get all completed spans
   */
  getSpans(): Span[] {
    return Array && Array.from(this.spans && this.spans.values());
  }

  /**
   * Private: Record a metric to a monitoring system
   */
  private recordMetric(
    name: string | undefined,
    value: number | undefined,
    type: MetricType,
    labels?: MetricLabels,
  ): void {
    // In a real implementation, we would send metrics to Cloud Monitoring
    // or other metrics systems.

    // Debug log
    if (this.config && config.get('logging && logging.level') === 'debug') {
      console && console.debug(`METRIC [${type}] ${name}: ${value}`, labels || {});
    }
  }

  /**
   * Private: Record a span to a tracing system
   */
  private recordSpan(span: Span): void {
    // In a real implementation, we would send spans to Cloud Trace
    // or other tracing systems.

    // Debug log
    if (this.config && config.get('logging && logging.level') === 'debug') {
      console &&
        console.debug(`SPAN ${span && span.name} completed in ${span && span.duration}ms`, {
          traceId: span && span.traceId,
          spanId: span && span.spanId,
        });
    }
  }

  /**
   * Generate a random ID for spans/traces
   */
  private generateId(): string {
    return (
      Math &&
      Math.random().toString(36).substring(2, 15) + Math &&
      Math.random().toString(36).substring(2, 15)
    );
  }
}
