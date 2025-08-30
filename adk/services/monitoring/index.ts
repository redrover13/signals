/**
 * @fileoverview Agent Monitoring Service for Agent Developer Kit
 * 
 * This is a starter implementation for the Agent Monitoring service
 * proposed in the ADK Enhancement Proposal.
 */

import { Logger } from '../../utils/logger';

/**
 * Types of metrics that can be collected for agents
 */
export enum AgentMetricType {
  /** Number of requests processed by the agent */
  REQUESTS = 'requests',
  
  /** Time taken to process requests */
  LATENCY = 'latency',
  
  /** Number of errors encountered by the agent */
  ERRORS = 'errors',
  
  /** Memory usage of the agent */
  MEMORY = 'memory',
  
  /** CPU usage of the agent */
  CPU = 'cpu',
  
  /** Number of tokens processed by the agent */
  TOKENS = 'tokens',
  
  /** Success rate of agent operations */
  SUCCESS_RATE = 'success_rate',
  
  /** Custom metric defined by the agent */
  CUSTOM = 'custom'
}

/**
 * Configuration for agent monitoring
 */
export interface AgentMonitorConfig {
  /** Name of the agent being monitored */
  agentName: string;
  
  /** Types of metrics to collect */
  metrics?: AgentMetricType[];
  
  /** Whether to enable distributed tracing */
  tracing?: boolean;
  
  /** Configuration for health checks */
  healthChecks?: {
    /** Interval between health checks (e.g., '30s', '1m') */
    interval: string;
    
    /** Timeout for health checks */
    timeout: string;
  };
  
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * A monitoring service for agents
 * 
 * This service collects metrics, performs health checks, and provides
 * observability for agents running in the system.
 */
export class AgentMonitor {
  private config: Required<AgentMonitorConfig>;
  private logger: Logger;
  private metrics: Map<string, number> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  
  /**
   * Creates a new agent monitor
   * 
   * @param config - Configuration for the agent monitor
   */
  constructor(config: AgentMonitorConfig) {
    this.config = {
      agentName: config.agentName,
      metrics: config.metrics || [
        AgentMetricType.REQUESTS,
        AgentMetricType.LATENCY,
        AgentMetricType.ERRORS
      ],
      tracing: config.tracing || false,
      healthChecks: config.healthChecks || {
        interval: '60s',
        timeout: '5s'
      },
      debug: config.debug || false
    };
    
    this.logger = new Logger({
      service: `agent-monitor-${this.config.agentName}`,
      level: this.config.debug ? 'debug' : 'info'
    });
    
    this.logger.info('Agent monitor initialized', {
      agentName: this.config.agentName,
      metrics: this.config.metrics,
      tracing: this.config.tracing
    });
    
    // Initialize metrics
    for (const metric of this.config.metrics) {
      this.metrics.set(metric, 0);
    }
    
    // Start health checks if configured
    if (this.config.healthChecks) {
      this.startHealthChecks();
    }
  }
  
  /**
   * Creates a monitored agent
   * 
   * @param agentName - Name of the agent
   * @param config - Monitoring configuration
   * @returns A monitored agent
   */
  static createMonitoredAgent<T>(
    agentName: string,
    config: Omit<AgentMonitorConfig, 'agentName'>,
    agentFactory: (monitor: AgentMonitor) => T
  ): T {
    const monitor = new AgentMonitor({
      agentName,
      ...config
    });
    
    return agentFactory(monitor);
  }
  
  /**
   * Records a metric value
   * 
   * @param metric - The metric to record
   * @param value - The value to record
   * @param tags - Optional tags for the metric
   */
  recordMetric(metric: AgentMetricType | string, value: number, tags?: Record<string, string>): void {
    this.logger.debug('Recording metric', { metric, value, tags });
    
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, 0);
    }
    
    this.metrics.set(metric, this.metrics.get(metric)! + value);
    
    // TODO: Send metrics to a monitoring system
  }
  
  /**
   * Records the start of a request
   * 
   * @param requestId - ID of the request
   * @param tags - Optional tags for the request
   */
  startRequest(requestId: string, tags?: Record<string, string>): void {
    this.logger.debug('Starting request', { requestId, tags });
    
    this.recordMetric(AgentMetricType.REQUESTS, 1, tags);
    
    // Start tracing if enabled
    if (this.config.tracing) {
      // TODO: Start a trace
    }
  }
  
  /**
   * Records the end of a request
   * 
   * @param requestId - ID of the request
   * @param success - Whether the request was successful
   * @param latencyMs - Latency of the request in milliseconds
   * @param tags - Optional tags for the request
   */
  endRequest(
    requestId: string,
    success: boolean,
    latencyMs: number,
    tags?: Record<string, string>
  ): void {
    this.logger.debug('Ending request', { requestId, success, latencyMs, tags });
    
    this.recordMetric(AgentMetricType.LATENCY, latencyMs, tags);
    
    if (!success) {
      this.recordMetric(AgentMetricType.ERRORS, 1, tags);
    }
    
    // End tracing if enabled
    if (this.config.tracing) {
      // TODO: End the trace
    }
  }
  
  /**
   * Records an error
   * 
   * @param error - The error to record
   * @param tags - Optional tags for the error
   */
  recordError(error: Error, tags?: Record<string, string>): void {
    this.logger.error('Error in agent', { error, tags });
    
    this.recordMetric(AgentMetricType.ERRORS, 1, tags);
  }
  
  /**
   * Gets the current value of a metric
   * 
   * @param metric - The metric to get
   * @returns The current value of the metric
   */
  getMetric(metric: AgentMetricType | string): number {
    return this.metrics.get(metric) || 0;
  }
  
  /**
   * Gets all metrics
   * 
   * @returns All metrics
   */
  getAllMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    
    return result;
  }
  
  /**
   * Performs a health check
   * 
   * @returns Promise that resolves when the health check is complete
   */
  async performHealthCheck(): Promise<boolean> {
    this.logger.debug('Performing health check');
    
    // TODO: Implement actual health checks
    // This is a placeholder implementation
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryOk = heapUsedMB < 1024; // Assume 1GB limit
    
    // Check error rate
    const errorRate = this.getMetric(AgentMetricType.ERRORS) / Math.max(1, this.getMetric(AgentMetricType.REQUESTS));
    const errorsOk = errorRate < 0.1; // 10% error rate is the threshold
    
    // Overall health
    const healthy = memoryOk && errorsOk;
    
    this.logger.info('Health check completed', {
      healthy,
      metrics: {
        memoryUsed: `${heapUsedMB}MB`,
        errorRate: `${(errorRate * 100).toFixed(2)}%`
      }
    });
    
    return healthy;
  }
  
  /**
   * Starts periodic health checks
   */
  private startHealthChecks(): void {
    const intervalMs = parseInterval(this.config.healthChecks.interval);
    
    this.logger.info('Starting health checks', {
      interval: this.config.healthChecks.interval,
      timeout: this.config.healthChecks.timeout
    });
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const timeoutMs = parseInterval(this.config.healthChecks.timeout);
        
        // Create a promise that times out
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timed out')), timeoutMs);
        });
        
        // Run the health check with a timeout
        const healthy = await Promise.race([
          this.performHealthCheck(),
          timeoutPromise
        ]);
        
        if (!healthy) {
          this.logger.warn('Agent is unhealthy');
          // TODO: Trigger alerts or remediation
        }
      } catch (error) {
        this.logger.error('Error in health check', { error });
      }
    }, intervalMs);
  }
  
  /**
   * Stops health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.info('Health checks stopped');
    }
  }
  
  /**
   * Closes the monitor and releases resources
   */
  close(): void {
    this.stopHealthChecks();
    this.logger.info('Agent monitor closed');
  }
}

/**
 * Parses an interval string (e.g., '30s', '1m') to milliseconds
 * 
 * @param interval - The interval string
 * @returns The interval in milliseconds
 */
function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)([smh])$/);
  
  if (!match) {
    throw new Error(`Invalid interval: ${interval}. Expected format: <number><unit>, where unit is s, m, or h`);
  }
  
  const [, valueStr, unit] = match;
  const value = parseInt(valueStr, 10);
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}
