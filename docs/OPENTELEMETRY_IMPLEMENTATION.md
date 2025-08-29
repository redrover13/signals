# OpenTelemetry Instrumentation for Dulce de Saigon F&B Platform

This document describes the comprehensive OpenTelemetry instrumentation implementation for the Dulce de Saigon F&B Data Platform, including custom Cloud Trace exporters, BigQuery logging, and Looker Studio dashboards.

## Overview

The implementation provides:

- **OpenTelemetry Instrumentation**: Automatic and manual tracing for all agent operations
- **Custom Cloud Trace Exporter**: Stores large payloads in GCS and sends lightweight references to Cloud Trace
- **BigQuery Logging**: Structured logging for long-term analytics and compliance
- **Looker Studio Dashboards**: Pre-built monitoring dashboards with F&B specific metrics

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Agent Code    │───▶│  OpenTelemetry   │───▶│ Cloud Trace     │
│                 │    │  Instrumentation │    │ Exporter        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ BigQuery Logger  │    │ GCS Storage     │
                       │                  │    │ (Large Payloads)│
                       └──────────────────┘    └─────────────────┘
                                │                        
                                ▼                        
                       ┌──────────────────┐              
                       │ Looker Studio    │              
                       │ Dashboards       │              
                       └──────────────────┘              
```

## Features

### 1. OpenTelemetry Configuration

**Location**: `libs/utils/monitoring/src/lib/otel-config.ts`

- Automatic instrumentation of Node.js applications
- Custom span creation with error handling
- Structured event logging with trace context
- Function instrumentation decorators

**Key Functions**:
```typescript
// Initialize OpenTelemetry
await initializeOpenTelemetry({
  serviceName: 'dulce-de-saigon-agents',
  gcpProjectId: process.env.GCP_PROJECT_ID,
  enableAutoInstrumentation: true,
  enableCustomExporter: true,
  enableBigQueryLogs: true,
});

// Create spans with automatic error handling
await withSpan('operation-name', async (span) => {
  // Your operation code
}, { attributes: { 'operation.type': 'prediction' } });

// Log structured events
await logEvent('user_interaction', {
  userId: 'user-123',
  action: 'view_menu',
  restaurantId: 'restaurant-456'
});
```

### 2. Custom Cloud Trace Exporter

**Location**: `libs/utils/monitoring/src/lib/cloud-trace-exporter.ts`

- Handles large trace payloads by storing them in GCS
- Sends lightweight span references to Cloud Trace
- Supports compression for large payloads
- Vietnamese data compliance markers

**Features**:
- Automatic detection of large payloads (configurable threshold)
- GCS storage with structured file naming (`traces/YYYY-MM-DD/traceId/spanId-uuid.json`)
- Metadata tagging for compliance and searchability
- Compression support for storage optimization

### 3. BigQuery Logger

**Location**: `libs/utils/monitoring/src/lib/bigquery-logger.ts`

- Structured logging to BigQuery for analytics
- Buffered writes for performance
- F&B specific logging methods
- Compliance-aware data handling

**Schema**:
- `timestamp`: Event timestamp
- `trace_id`, `span_id`: Distributed tracing context
- `level`: Log level (debug, info, warn, error)
- `service`: Service name
- `event`: Event type
- `data`: JSON event data
- `user_id`, `session_id`: User context
- `region`: Processing region
- `compliance_marker`: Compliance status

**F&B Specific Methods**:
```typescript
// Log user interactions
await logger.logUserInteraction({
  userId: 'user-123',
  sessionId: 'session-456',
  action: 'view_menu',
  restaurantId: 'restaurant-789',
  menuItemId: 'item-101'
});

// Log performance metrics
await logger.logPerformanceMetrics({
  operation: 'vertex-ai-prediction',
  duration: 1500,
  success: true,
  errorCount: 0
});
```

### 4. Looker Studio Dashboards

**Location**: `apps/looker-dashboards/src/lib/dashboard-templates.ts`

Pre-built dashboard templates with:

#### Overview Dashboard
- Overall agent health score
- Request throughput over time
- Error rates and response times
- Real-time metrics

#### F&B Operations Dashboard
- Restaurant interaction patterns
- Menu item popularity
- User behavior analytics
- Peak hours analysis

#### Trace Analysis Dashboard
- Trace completion rates
- Longest running operations
- Span performance metrics
- Error distribution

#### Compliance & Security Dashboard
- Data processing by region
- GDPR/Vietnam data law compliance
- Data retention monitoring
- Security metrics

## Implementation Guide

### 1. Instrumenting Agent Code

Add OpenTelemetry initialization at the start of your application:

```typescript
import { initializeOpenTelemetry } from '@nx-monorepo/utils/monitoring';

// Initialize before any other imports
initializeOpenTelemetry({
  serviceName: 'your-service-name',
  gcpProjectId: process.env.GCP_PROJECT_ID,
}).catch(console.error);
```

### 2. Adding Spans to Operations

Wrap critical operations with spans:

```typescript
import { withSpan, instrument } from '@nx-monorepo/utils/monitoring';

// Manual span creation
await withSpan('vertex-ai-prediction', async (span) => {
  span.setAttributes({
    'vertex.endpoint_id': endpointId,
    'vertex.project': projectId,
  });
  
  const result = await vertexClient.predict(payload);
  return result;
}, { kind: SpanKind.CLIENT });

// Function instrumentation
const instrumentedFunction = instrument('database-query', originalFunction, {
  attributes: { 'db.operation': 'select' }
});
```

### 3. Structured Logging

Add structured logging throughout your application:

```typescript
import { logEvent } from '@nx-monorepo/utils/monitoring';

// Log business events
await logEvent('order_placed', {
  orderId: 'order-123',
  restaurantId: 'restaurant-456',
  totalAmount: 45.99,
  itemCount: 3
});

// Log performance events
await logEvent('cache_hit', {
  cacheKey: 'menu-items-restaurant-123',
  hitRate: 0.89
});
```

### 4. Deploying Dashboards

Use the dashboard templates to create Looker Studio dashboards:

```typescript
import { generateDashboardTemplate, exportDashboardTemplate } from '@nx-monorepo/apps/looker-dashboards';

// Generate customized dashboard
const template = generateDashboardTemplate({
  projectId: 'your-gcp-project',
  datasetId: 'agent_logs',
  tableId: 'trace_logs',
  dashboardName: 'Production Agent Monitoring'
});

// Export for Looker Studio
const jsonConfig = exportDashboardTemplate(template, 'json');
```

## Environment Configuration

Required environment variables:

```bash
# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=asia-southeast1

# BigQuery Configuration
BIGQUERY_LOGS_DATASET=agent_logs
BIGQUERY_LOGS_TABLE=trace_logs

# GCS Configuration
GCS_TRACES_BUCKET=your-project-agent-traces

# Optional: Disable specific features
OTEL_ENABLE_AUTO_INSTRUMENTATION=true
OTEL_ENABLE_CUSTOM_EXPORTER=true
OTEL_ENABLE_BIGQUERY_LOGS=true
```

## Compliance and Security

### Vietnamese Data Law Compliance

- All data processing includes region markers (`vietnam-southeast1`)
- Compliance markers (`GDPR-VIETNAM-COMPLIANT`) on all records
- Data retention policies enforced (90-day default)
- User consent tracking in log metadata

### Security Features

- Sensitive data filtering in traces
- Encrypted storage in GCS
- Access logging for all data operations
- Audit trails for compliance reporting

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Agent Health**
   - Error rate < 1%
   - Average response time < 1000ms
   - Trace completion rate > 99%

2. **Resource Usage**
   - BigQuery quota usage
   - GCS storage costs
   - Cloud Trace API limits

3. **Compliance**
   - Data retention compliance > 98%
   - Regional processing compliance = 100%
   - GDPR compliance score > 99%

### Alerting Thresholds

```sql
-- Error rate alert (> 5%)
SELECT 
  COUNT(*) FILTER (WHERE level = 'error') / COUNT(*) * 100 as error_rate
FROM `project.agent_logs.trace_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
HAVING error_rate > 5

-- Response time alert (> 5000ms)
SELECT 
  AVG(CAST(JSON_EXTRACT_SCALAR(data, '$.duration_ms') AS FLOAT64)) as avg_response_time
FROM `project.agent_logs.trace_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
HAVING avg_response_time > 5000
```

## Performance Considerations

### BigQuery Optimization

- Use partitioned tables by timestamp
- Cluster tables by service and event type
- Implement table expiration for cost control
- Use streaming inserts for real-time data

### GCS Optimization

- Use regional storage for cost efficiency
- Implement lifecycle policies for old traces
- Compress large payloads before storage
- Use batch operations for bulk uploads

### Trace Sampling

```typescript
// Configure sampling for high-volume services
initializeOpenTelemetry({
  serviceName: 'high-volume-service',
  samplingRate: 0.1, // Sample 10% of traces
});
```

## Troubleshooting

### Common Issues

1. **High BigQuery Costs**
   - Check buffer sizes and flush intervals
   - Implement sampling for high-volume events
   - Use table partitioning and clustering

2. **Large GCS Storage**
   - Verify compression is enabled
   - Implement lifecycle policies
   - Monitor payload size thresholds

3. **Missing Traces**
   - Check OpenTelemetry initialization order
   - Verify GCP credentials and permissions
   - Monitor exporter error logs

### Debug Mode

Enable debug logging:

```bash
export NODE_ENV=development
export OTEL_LOG_LEVEL=debug
```

## Future Enhancements

- **AI/ML Integration**: Anomaly detection on traces
- **Cost Optimization**: Smart sampling based on trace characteristics
- **Real-time Alerting**: Pub/Sub integration for immediate notifications
- **Multi-region**: Support for global F&B operations
- **Mobile SDKs**: Client-side instrumentation for mobile apps