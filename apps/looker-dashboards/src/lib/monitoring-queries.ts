/**
 * @fileoverview Monitoring queries for BigQuery analytics
 *
 * This file contains pre-built SQL queries for monitoring agent performance,
 * analyzing traces, and generating insights for the F&B data platform.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Common query parameters interface
 */
export interface QueryParams {
  projectId: string;
  datasetId: string;
  tableId: string;
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  service?: string;
}

/**
 * Performance monitoring queries
 */
export const PERFORMANCE_QUERIES = {
  /**
   * Overall agent health score
   */
  healthScore: (params: QueryParams) => `
    WITH metrics AS (
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE level = 'error') as error_count,
        AVG(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as avg_response_time,
        STDDEV(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as response_time_stddev,
        COUNT(DISTINCT trace_id) as unique_traces
      FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '1h'})
        ${params.service ? `AND service = '${params.service}'` : ''}
    )
    SELECT 
      total_requests,
      error_count,
      ROUND(error_count / total_requests * 100, 2) as error_rate_percent,
      ROUND(avg_response_time, 2) as avg_response_time_ms,
      ROUND(response_time_stddev, 2) as response_time_stddev_ms,
      unique_traces,
      CASE 
        WHEN error_count / total_requests < 0.01 AND avg_response_time < 1000 THEN 95
        WHEN error_count / total_requests < 0.05 AND avg_response_time < 2000 THEN 85
        WHEN error_count / total_requests < 0.1 AND avg_response_time < 5000 THEN 70
        ELSE 50
      END as health_score
    FROM metrics
  `,

  /**
   * Request throughput over time
   */
  requestThroughput: (params: QueryParams) => `
    SELECT 
      TIMESTAMP_TRUNC(timestamp, MINUTE) as time_bucket,
      COUNT(*) as requests_per_minute,
      COUNT(DISTINCT trace_id) as unique_traces_per_minute,
      AVG(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as avg_duration_ms
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '24h'})
      ${params.service ? `AND service = '${params.service}'` : ''}
      AND event IN ('agent_task_started', 'prediction_request', 'user_interaction')
    GROUP BY time_bucket
    ORDER BY time_bucket
  `,

  /**
   * Error analysis
   */
  errorAnalysis: (params: QueryParams) => `
    SELECT 
      JSON_EXTRACT_SCALAR(data, '$.error_message') as error_message,
      JSON_EXTRACT_SCALAR(data, '$.span_name') as span_name,
      event,
      COUNT(*) as occurrence_count,
      MIN(timestamp) as first_occurred,
      MAX(timestamp) as last_occurred,
      COUNT(DISTINCT trace_id) as affected_traces
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '24h'})
      AND level = 'error'
      ${params.service ? `AND service = '${params.service}'` : ''}
    GROUP BY error_message, span_name, event
    ORDER BY occurrence_count DESC
  `,

  /**
   * Response time percentiles
   */
  responseTimePercentiles: (params: QueryParams) => `
    SELECT 
      APPROX_QUANTILES(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64), 100)[OFFSET(50)] as p50_ms,
      APPROX_QUANTILES(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64), 100)[OFFSET(90)] as p90_ms,
      APPROX_QUANTILES(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64), 100)[OFFSET(95)] as p95_ms,
      APPROX_QUANTILES(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64), 100)[OFFSET(99)] as p99_ms,
      MAX(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as max_ms,
      MIN(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as min_ms
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '1h'})
      AND JSON_EXTRACT_SCALAR(data, '$.duration_ms') IS NOT NULL
      ${params.service ? `AND service = '${params.service}'` : ''}
  `,
};

/**
 * F&B specific analytics queries
 */
export const FNB_ANALYTICS_QUERIES = {
  /**
   * Restaurant interaction patterns
   */
  restaurantInteractions: (params: QueryParams) => `
    SELECT 
      JSON_EXTRACT_SCALAR(data, '$.restaurant_id') as restaurant_id,
      JSON_EXTRACT_SCALAR(data, '$.action') as interaction_type,
      COUNT(*) as interaction_count,
      COUNT(DISTINCT user_id) as unique_users,
      AVG(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as avg_response_time_ms
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '24h'})
      AND event = 'user_interaction'
      AND JSON_EXTRACT_SCALAR(data, '$.restaurant_id') IS NOT NULL
    GROUP BY restaurant_id, interaction_type
    ORDER BY interaction_count DESC
  `,

  /**
   * Menu item popularity
   */
  menuItemPopularity: (params: QueryParams) => `
    SELECT 
      JSON_EXTRACT_SCALAR(data, '$.menu_item_id') as menu_item_id,
      JSON_EXTRACT_SCALAR(data, '$.restaurant_id') as restaurant_id,
      COUNT(*) as request_count,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as unique_sessions,
      MIN(timestamp) as first_requested,
      MAX(timestamp) as last_requested
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '7d'})
      AND event = 'user_interaction'
      AND JSON_EXTRACT_SCALAR(data, '$.menu_item_id') IS NOT NULL
    GROUP BY menu_item_id, restaurant_id
    ORDER BY request_count DESC
    LIMIT 50
  `,

  /**
   * User behavior patterns
   */
  userBehaviorPatterns: (params: QueryParams) => `
    WITH user_sessions AS (
      SELECT 
        user_id,
        session_id,
        COUNT(*) as actions_per_session,
        TIMESTAMP_DIFF(MAX(timestamp), MIN(timestamp), SECOND) as session_duration_seconds,
        ARRAY_AGG(JSON_EXTRACT_SCALAR(data, '$.action') ORDER BY timestamp) as action_sequence
      FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '7d'})
        AND event = 'user_interaction'
        AND user_id IS NOT NULL
        AND session_id IS NOT NULL
      GROUP BY user_id, session_id
    )
    SELECT 
      ROUND(AVG(actions_per_session), 2) as avg_actions_per_session,
      ROUND(AVG(session_duration_seconds), 2) as avg_session_duration_seconds,
      COUNT(*) as total_sessions,
      COUNT(DISTINCT user_id) as unique_users,
      APPROX_TOP_COUNT(action_sequence[SAFE_OFFSET(0)], 10) as top_first_actions
    FROM user_sessions
  `,

  /**
   * Peak hours analysis
   */
  peakHoursAnalysis: (params: QueryParams) => `
    SELECT 
      EXTRACT(HOUR FROM timestamp) as hour_of_day,
      EXTRACT(DAYOFWEEK FROM timestamp) as day_of_week,
      COUNT(*) as interaction_count,
      COUNT(DISTINCT user_id) as unique_users,
      AVG(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as avg_response_time_ms
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '7d'})
      AND event = 'user_interaction'
    GROUP BY hour_of_day, day_of_week
    ORDER BY interaction_count DESC
  `,
};

/**
 * Trace analysis queries
 */
export const TRACE_ANALYSIS_QUERIES = {
  /**
   * Trace completion rates
   */
  traceCompletionRates: (params: QueryParams) => `
    WITH trace_stats AS (
      SELECT 
        trace_id,
        COUNT(*) as span_count,
        COUNT(*) FILTER (WHERE level = 'error') as error_span_count,
        MIN(timestamp) as trace_start,
        MAX(timestamp) as trace_end,
        TIMESTAMP_DIFF(MAX(timestamp), MIN(timestamp), MILLISECOND) as trace_duration_ms
      FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '1h'})
        AND trace_id IS NOT NULL
        ${params.service ? `AND service = '${params.service}'` : ''}
      GROUP BY trace_id
    )
    SELECT 
      COUNT(*) as total_traces,
      COUNT(*) FILTER (WHERE error_span_count = 0) as successful_traces,
      COUNT(*) FILTER (WHERE error_span_count > 0) as failed_traces,
      ROUND(COUNT(*) FILTER (WHERE error_span_count = 0) / COUNT(*) * 100, 2) as success_rate_percent,
      ROUND(AVG(span_count), 2) as avg_spans_per_trace,
      ROUND(AVG(trace_duration_ms), 2) as avg_trace_duration_ms,
      APPROX_QUANTILES(trace_duration_ms, 100)[OFFSET(95)] as p95_trace_duration_ms
    FROM trace_stats
  `,

  /**
   * Longest running traces
   */
  longestRunningTraces: (params: QueryParams) => `
    WITH trace_durations AS (
      SELECT 
        trace_id,
        MIN(timestamp) as trace_start,
        MAX(timestamp) as trace_end,
        TIMESTAMP_DIFF(MAX(timestamp), MIN(timestamp), MILLISECOND) as trace_duration_ms,
        COUNT(*) as span_count,
        COUNT(*) FILTER (WHERE level = 'error') as error_count,
        STRING_AGG(DISTINCT event ORDER BY event) as operations
      FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '1h'})
        AND trace_id IS NOT NULL
        ${params.service ? `AND service = '${params.service}'` : ''}
      GROUP BY trace_id
    )
    SELECT 
      trace_id,
      trace_start,
      trace_end,
      trace_duration_ms,
      span_count,
      error_count,
      operations
    FROM trace_durations
    ORDER BY trace_duration_ms DESC
    LIMIT 20
  `,

  /**
   * Span operation performance
   */
  spanOperationPerformance: (params: QueryParams) => `
    SELECT 
      event as operation_name,
      COUNT(*) as execution_count,
      AVG(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as avg_duration_ms,
      APPROX_QUANTILES(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64), 100)[OFFSET(95)] as p95_duration_ms,
      COUNT(*) FILTER (WHERE level = 'error') as error_count,
      ROUND(COUNT(*) FILTER (WHERE level = 'error') / COUNT(*) * 100, 2) as error_rate_percent
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '1h'})
      AND JSON_EXTRACT_SCALAR(data, '$.duration_ms') IS NOT NULL
      ${params.service ? `AND service = '${params.service}'` : ''}
    GROUP BY operation_name
    ORDER BY execution_count DESC
  `,
};

/**
 * Compliance and security queries
 */
export const COMPLIANCE_QUERIES = {
  /**
   * Data processing compliance check
   */
  dataProcessingCompliance: (params: QueryParams) => `
    SELECT 
      region,
      compliance_marker,
      COUNT(*) as processing_count,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT trace_id) as unique_traces,
      MIN(timestamp) as earliest_processing,
      MAX(timestamp) as latest_processing
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '24h'})
    GROUP BY region, compliance_marker
    ORDER BY processing_count DESC
  `,

  /**
   * Data retention compliance
   */
  dataRetentionCompliance: (params: QueryParams) => `
    SELECT 
      DATE(timestamp) as processing_date,
      COUNT(*) as total_records,
      COUNT(*) FILTER (WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)) as within_retention_period,
      COUNT(*) FILTER (WHERE timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)) as beyond_retention_period,
      ROUND(COUNT(*) FILTER (WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)) / COUNT(*) * 100, 2) as retention_compliance_percent
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 180 DAY)
    GROUP BY processing_date
    ORDER BY processing_date DESC
  `,

  /**
   * GDPR compliance audit
   */
  gdprComplianceAudit: (params: QueryParams) => `
    SELECT 
      DATE(timestamp) as audit_date,
      COUNT(*) as total_operations,
      COUNT(*) FILTER (WHERE compliance_marker = 'GDPR-VIETNAM-COMPLIANT') as compliant_operations,
      COUNT(*) FILTER (WHERE region = 'vietnam-southeast1') as vietnam_processed,
      COUNT(DISTINCT user_id) as unique_users_processed,
      ROUND(COUNT(*) FILTER (WHERE compliance_marker = 'GDPR-VIETNAM-COMPLIANT') / COUNT(*) * 100, 2) as gdpr_compliance_percent
    FROM \`${params.projectId}.${params.datasetId}.${params.tableId}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${params.timeRange || '30d'})
    GROUP BY audit_date
    ORDER BY audit_date DESC
  `,
};

/**
 * Generate a monitoring query with parameters
 */
export function generateMonitoringQuery(
  queryType: keyof typeof PERFORMANCE_QUERIES | keyof typeof FNB_ANALYTICS_QUERIES | keyof typeof TRACE_ANALYSIS_QUERIES | keyof typeof COMPLIANCE_QUERIES,
  params: QueryParams
): string {
  const allQueries = {
    ...PERFORMANCE_QUERIES,
    ...FNB_ANALYTICS_QUERIES,
    ...TRACE_ANALYSIS_QUERIES,
    ...COMPLIANCE_QUERIES,
  };

  const queryFunction = allQueries[queryType];
  if (!queryFunction) {
    throw new Error(`Unknown query type: ${queryType}`);
  }

  return queryFunction(params);
}

/**
 * Predefined monitoring query sets for different use cases
 */
export const MONITORING_QUERY_SETS = {
  agentHealth: ['healthScore', 'requestThroughput', 'errorAnalysis', 'responseTimePercentiles'],
  fmbAnalytics: ['restaurantInteractions', 'menuItemPopularity', 'userBehaviorPatterns', 'peakHoursAnalysis'],
  traceAnalysis: ['traceCompletionRates', 'longestRunningTraces', 'spanOperationPerformance'],
  compliance: ['dataProcessingCompliance', 'dataRetentionCompliance', 'gdprComplianceAudit'],
};