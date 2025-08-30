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
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes: Record<string, any>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
  }>;
  status: 'unset' | 'ok' | 'error';
  parentSpanId?: string;
  spanId: string;
  traceId: string;
}

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private metrics: Map<string, any> = new Map();
  private spans: Map<string, Span> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private config: ConfigManager;
  private serviceName: string;
  private enabled: boolean;
  
  constructor(config: ConfigManager) {
    this.config = config;
    this.serviceName = config.get('serviceName', 'adkService');
    this.enabled = config.get('features.enableMetrics', true);
  }
  
  /**
   * Create a new counter metric
   */
  createCounter(name: string, description: string, unit?: string): void {
    if (!this.enabled) return;
    
    if (this.metrics.has(name)) {
      throw new ADKError({
        message: `Metric already exists: ${name}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    this.metrics.set(name, {
      type: MetricType.COUNTER,
      description,
      unit,
      value: 0,
    });
  }
  
  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value = 1, labels?: MetricLabels): void {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.COUNTER) {
      throw new ADKError({
        message: `Counter metric not found: ${name}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    metric.value += value;
    
    // In a real implementation, we would send this to a metrics service
    this.recordMetric(name, metric.value, MetricType.COUNTER, labels);
  }
  
  /**
   * Create a new gauge metric
   */
  createGauge(name: string, description: string, unit?: string): void {
    if (!this.enabled) return;
    
    if (this.metrics.has(name)) {
      throw new ADKError({
        message: `Metric already exists: ${name}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    this.metrics.set(name, {
      type: MetricType.GAUGE,
      description,
      unit,
      value: 0,
    });
  }
  
  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.GAUGE) {
      throw new ADKError({
        message: `Gauge metric not found: ${name}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    metric.value = value;
    
    // In a real implementation, we would send this to a metrics service
    this.recordMetric(name, metric.value, MetricType.GAUGE, labels);
  }
  
  /**
   * Create a new histogram metric
   */
  createHistogram(
    name: string, 
    description: string, 
    unit?: string, 
    buckets?: number[]
  ): void {
    if (!this.enabled) return;
    
    if (this.metrics.has(name)) {
      throw new ADKError({
        message: `Metric already exists: ${name}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    this.metrics.set(name, {
      type: MetricType.HISTOGRAM,
      description,
      unit,
      buckets: buckets || [0.1, 0.5, 1, 2, 5, 10],
      values: [],
    });
  }
  
  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.HISTOGRAM) {
      throw new ADKError({
        message: `Histogram metric not found: ${name}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    metric.values.push(value);
    
    // In a real implementation, we would send this to a metrics service
    this.recordMetric(name, value, MetricType.HISTOGRAM, labels);
  }
  
  /**
   * Start a performance timing span
   */
  startSpan(name: string, attributes: Record<string, any> = {}): string {
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
    
    this.activeSpans.set(spanId, span);
    return spanId;
  }
  
  /**
   * Add an event to an active span
   */
  addSpanEvent(
    spanId: string, 
    eventName: string, 
    attributes: Record<string, any> = {}
  ): void {
    if (!this.enabled || !spanId) return;
    
    const span = this.activeSpans.get(spanId);
    if (!span) {
      throw new ADKError({
        message: `Active span not found: ${spanId}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes,
    });
  }
  
  /**
   * Set attributes on an active span
   */
  setSpanAttributes(
    spanId: string, 
    attributes: Record<string, any>
  ): void {
    if (!this.enabled || !spanId) return;
    
    const span = this.activeSpans.get(spanId);
    if (!span) {
      throw new ADKError({
        message: `Active span not found: ${spanId}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    span.attributes = {
      ...span.attributes,
      ...attributes,
    };
  }
  
  /**
   * End a performance timing span
   */
  endSpan(spanId: string, status: 'ok' | 'error' = 'ok'): void {
    if (!this.enabled || !spanId) return;
    
    const span = this.activeSpans.get(spanId);
    if (!span) {
      throw new ADKError({
        message: `Active span not found: ${spanId}`,
        type: ADKErrorType.MONITORING,
      });
    }
    
    // Set end time and calculate duration
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    
    // Move from active to completed spans
    this.activeSpans.delete(spanId);
    this.spans.set(spanId, span);
    
    // Record span duration as a histogram
    this.recordHistogram(
      `${this.serviceName}.span.duration`,
      span.duration,
      { name: span.name, status }
    );
    
    // In a real implementation, we would send this to a tracing service
    this.recordSpan(span);
  }
  
  /**
   * Execute a function with timing
   */
  async measureExecution<T>(
    name: string,
    fn: () => Promise<T> | T,
    attributes: Record<string, any> = {}
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
    
    for (const [name, metric] of this.metrics.entries()) {
      result[name] = { ...metric };
    }
    
    return result;
  }
  
  /**
   * Get all completed spans
   */
  getSpans(): Span[] {
    return Array.from(this.spans.values());
  }
  
  /**
   * Private: Record a metric to a monitoring system
   */
  private recordMetric(
    name: string,
    value: number,
    type: MetricType,
    labels?: MetricLabels
  ): void {
    // In a real implementation, we would send metrics to Cloud Monitoring
    // or other metrics systems.
    
    // Debug log
    if (this.config.get('logging.level') === 'debug') {
      console.debug(`METRIC [${type}] ${name}: ${value}`, labels || {});
    }
  }
  
  /**
   * Private: Record a span to a tracing system
   */
  private recordSpan(span: Span): void {
    // In a real implementation, we would send spans to Cloud Trace
    // or other tracing systems.
    
    // Debug log
    if (this.config.get('logging.level') === 'debug') {
      console.debug(
        `SPAN ${span.name} completed in ${span.duration}ms`,
        { traceId: span.traceId, spanId: span.spanId }
      );
    }
  }
  
  /**
   * Generate a random ID for spans/traces
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
