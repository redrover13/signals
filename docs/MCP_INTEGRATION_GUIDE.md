# MCP Integration Guide for Signals Project

This guide provides comprehensive instructions for integrating and using the MCP (Model Context Protocol) system in the Signals project.

## 🎯 Overview

The MCP integration provides a unified interface to 27+ different services and tools, enabling seamless interaction with:

- **Development Tools**: GitHub, Git, Nx, Node.js
- **Data Services**: BigQuery, Vector databases, Analytics
- **Cloud Platforms**: Google Cloud, Firebase, Netlify
- **AI Services**: Search, Embeddings, Sequential thinking
- **Testing Tools**: Browser automation, API validation
- **Specialized Services**: Maps, Search engines, Content management

## 🚀 Getting Started

### 1. Environment Setup

```bash
# Copy environment template
cp .env.mcp.example .env.mcp

# Edit with your credentials
nano .env.mcp
```

### 2. Basic Integration

```typescript
// In your application (apps/api/src/main.ts)
import { mcpService } from '@nx-monorepo/mcp';

async function initializeApp() {
  // Initialize MCP service
  await mcpService.initialize();

  console.log('MCP Service initialized with servers:', mcpService.getEnabledServers());

  // Your app initialization code...
}

initializeApp().catch(console.error);
```

### 3. Using MCP in Services

```typescript
// apps/api/src/services/data.service.ts
import { mcpService } from '@nx-monorepo/mcp';

export class DataService {
  async getAnalyticsData(query: string) {
    try {
      const result = await mcpService.bigquery(query);
      return result.result;
    } catch (error) {
      console.error('Analytics query failed:', error);
      throw error;
    }
  }

  async searchContent(query: string) {
    const searchResult = await mcpService.search(query, { limit: 10 });
    return searchResult.result;
  }

  async storeUserPreference(userId: string, preferences: any) {
    await mcpService.memory('store', {
      key: `user-${userId}-prefs`,
      value: preferences,
    });
  }
}
```

## 🏗️ Integration Patterns

### 1. Service Layer Integration

```typescript
// libs/gcp/src/lib/bigquery.service.ts
import { mcpService } from '@nx-monorepo/mcp';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BigQueryService {
  async executeQuery(query: string, parameters?: any[]) {
    const response = await mcpService.bigquery(query, { parameters });

    if (response.error) {
      throw new Error(`BigQuery error: ${response.error.message}`);
    }

    return response.result;
  }

  async getTableSchema(dataset: string, table: string) {
    return mcpService.database('describe-table', { dataset, table });
  }

  async listDatasets() {
    return mcpService.database('list-datasets');
  }
}
```

### 2. Event Processing Integration

```typescript
// apps/event-parser/src/lib/event-processor.ts
import { mcpService } from '@nx-monorepo/mcp';

export class EventProcessor {
  async processEvent(event: any) {
    // Store event in memory for quick access
    await mcpService.memory('store', {
      key: `event-${event.id}`,
      value: event,
      ttl: 3600, // 1 hour
    });

    // Analyze event with sequential thinking
    const analysis = await mcpService.think(
      `Analyze this event for anomalies: ${JSON.stringify(event)}`,
    );

    // Store in BigQuery for long-term analytics
    await mcpService.bigquery(
      'INSERT INTO events.raw_events (id, data, timestamp, analysis) VALUES (?, ?, ?, ?)',
      [event.id, JSON.stringify(event), new Date(), analysis.result],
    );

    return analysis.result;
  }
}
```

### 3. Web Application Integration

```typescript
// apps/web/src/app/services/content.service.ts
import { mcpService } from '@nx-monorepo/mcp';

export class ContentService {
  async searchDocumentation(query: string) {
    // Use Exa for intelligent search
    const searchResults = await mcpService.search(query, {
      type: 'documentation',
      limit: 5,
    });

    // Enhance with vector similarity search
    const vectorResults = await mcpService.vector('search', {
      query,
      collection: 'documentation',
      limit: 3,
    });

    return {
      webResults: searchResults.result,
      similarContent: vectorResults.result,
    };
  }

  async generateContent(prompt: string) {
    // Use sequential thinking for content planning
    const plan = await mcpService.think(`Create a content plan for: ${prompt}`);

    // Store the plan for future reference
    await mcpService.memory('store', {
      key: `content-plan-${Date.now()}`,
      value: plan.result,
    });

    return plan.result;
  }
}
```

## 🔧 Advanced Usage Patterns

### 1. Multi-Server Orchestration

```typescript
// Complex workflow using multiple servers
export class DeploymentService {
  async deployApplication(appName: string) {
    try {
      // 1. Check Git status
      const gitStatus = await mcpService.git('status');
      if (gitStatus.result.hasChanges) {
        throw new Error('Uncommitted changes detected');
      }

      // 2. Build with Nx
      const buildResult = await mcpService.nx('run-target', {
        project: appName,
        target: 'build',
      });

      if (buildResult.error) {
        throw new Error(`Build failed: ${buildResult.error.message}`);
      }

      // 3. Deploy to Cloud Run
      const deployResult = await mcpService.cloudRun('deploy', {
        service: appName,
        image: `gcr.io/${process.env.GCP_PROJECT_ID}/${appName}:latest`,
        region: process.env.GCP_REGION,
      });

      // 4. Update deployment record
      await mcpService.bigquery(
        'INSERT INTO deployments.history (app_name, version, timestamp, status) VALUES (?, ?, ?, ?)',
        [appName, gitStatus.result.commit, new Date(), 'success'],
      );

      // 5. Store deployment info in memory
      await mcpService.memory('store', {
        key: `last-deployment-${appName}`,
        value: {
          timestamp: new Date(),
          version: gitStatus.result.commit,
          url: deployResult.result.url,
        },
      });

      return deployResult.result;
    } catch (error) {
      // Log deployment failure
      await mcpService.bigquery(
        'INSERT INTO deployments.history (app_name, timestamp, status, error) VALUES (?, ?, ?, ?)',
        [appName, new Date(), 'failed', error.message],
      );

      throw error;
    }
  }
}
```

### 2. Health Monitoring Integration

```typescript
// apps/api/src/health/mcp-health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { mcpService, getMCPHealthSummary } from '@nx-monorepo/mcp';

@Controller('health/mcp')
export class MCPHealthController {
  @Get()
  async getSystemHealth() {
    return getMCPHealthSummary(mcpService);
  }

  @Get('servers')
  async getServerHealth() {
    const allHealth = mcpService.getServerHealth() as Map<string, any>;
    return Object.fromEntries(allHealth);
  }

  @Get('check/:serverId')
  async checkServerHealth(@Param('serverId') serverId: string) {
    return mcpService.checkHealth(serverId);
  }

  @Get('connectivity')
  async testConnectivity() {
    const { testMCPConnectivity } = await import('@nx-monorepo/mcp');
    return testMCPConnectivity();
  }
}
```

### 3. Error Handling and Fallbacks

```typescript
import { withErrorHandler, ErrorCategory, ErrorSeverity } from '@nx-monorepo/mcp';

export class ResilientDataService {
  async getData(query: string) {
    return withErrorHandler(
      async () => {
        // Primary: Try BigQuery
        return await mcpService.bigquery(query);
      },
      {
        function: 'ResilientDataService.getData',
        file: 'data.service.ts',
        params: { query },
      },
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: true,
        fallbackAction: async () => {
          // Fallback 1: Try cached data from memory
          try {
            const cached = await mcpService.memory('retrieve', {
              key: `cache-${this.hashQuery(query)}`,
            });

            if (cached.result) {
              return cached;
            }
          } catch (memoryError) {
            console.warn('Memory fallback failed:', memoryError);
          }

          // Fallback 2: Try external search
          const searchResult = await mcpService.search(query);
          return { result: searchResult.result, source: 'search' };
        },
        onRetry: (attempt, error) => {
          console.warn(`Retrying getData, attempt ${attempt}:`, error.message);
        },
      },
    );
  }

  private hashQuery(query: string): string {
    // Simple hash function for caching
    return Buffer.from(query).toString('base64').slice(0, 16);
  }
}
```

### 4. Standardized Error Handling

The MCP library now includes standardized error handling with Vietnamese language support:

```typescript
import {
  createServiceErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  withErrorHandler,
} from '@nx-monorepo/mcp';

export class MyService {
  private errorHandler = createServiceErrorHandler('MyService', 'my-service.ts');

  async processData(data: unknown) {
    return this.errorHandler.withRetry(
      async () => {
        // Your business logic here
        const result = await mcpService.bigquery('SELECT * FROM my_table');
        return result;
      },
      'processData',
      { data },
      {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
      },
    );
  }

  async validateInput(input: string) {
    if (!input) {
      throw this.errorHandler.createError(
        'Input is required',
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        'validateInput',
        { input },
      );
    }
  }
}
```

## 🔒 Security Best Practices

### 1. Secret Management

```typescript
// Use Google Cloud Secret Manager for sensitive data
const secrets = {
  github: 'projects/PROJECT_ID/secrets/github-token/versions/latest',
  openai: 'projects/PROJECT_ID/secrets/openai-api-key/versions/latest',
  database: 'projects/PROJECT_ID/secrets/db-connection/versions/latest',
};

// Secrets are automatically retrieved by MCP servers
// No need to handle them directly in application code
```

### 2. Access Control

```typescript
// Implement role-based access to MCP services
export class SecureMCPService {
  constructor(private userRole: string) {}

  async executeQuery(query: string) {
    if (!this.canAccessDatabase()) {
      throw new Error('Insufficient permissions for database access');
    }

    return mcpService.bigquery(query);
  }

  async accessGitHub(operation: string) {
    if (!this.canAccessGitHub()) {
      throw new Error('Insufficient permissions for GitHub access');
    }

    return mcpService.github(operation);
  }

  private canAccessDatabase(): boolean {
    return ['admin', 'analyst', 'developer'].includes(this.userRole);
  }

  private canAccessGitHub(): boolean {
    return ['admin', 'developer'].includes(this.userRole);
  }
}
```

### 3. Data Privacy Compliance

```typescript
// Vietnamese data privacy compliance
export class PrivacyCompliantService {
  async processUserData(userData: any, userConsent: boolean) {
    if (!userConsent) {
      throw new Error('User consent required for data processing');
    }

    // Anonymize sensitive data before processing
    const anonymizedData = this.anonymizeData(userData);

    // Store with privacy metadata
    await mcpService.memory('store', {
      key: `user-data-${userData.id}`,
      value: {
        data: anonymizedData,
        consent: true,
        consentDate: new Date(),
        dataRetentionDays: 365,
        region: 'vietnam',
      },
    });

    return anonymizedData;
  }

  private anonymizeData(data: any) {
    // Implement data anonymization logic
    return {
      ...data,
      email: this.hashEmail(data.email),
      phone: this.maskPhone(data.phone),
      ip: this.anonymizeIP(data.ip),
    };
  }
}
```

## 📊 Monitoring and Observability

### 1. Performance Monitoring

```typescript
// apps/api/src/monitoring/mcp-metrics.service.ts
import { mcpService, getMCPPerformanceMetrics } from '@nx-monorepo/mcp';

export class MCPMetricsService {
  async collectMetrics() {
    const metrics = getMCPPerformanceMetrics(mcpService);

    // Send to Google Cloud Monitoring
    await mcpService.gcp('monitoring', 'write-metrics', {
      metrics: [
        {
          name: 'mcp/server_count',
          value: metrics.serverCount,
          timestamp: new Date(),
        },
        {
          name: 'mcp/healthy_servers',
          value: metrics.healthyServers,
          timestamp: new Date(),
        },
        {
          name: 'mcp/error_rate',
          value: metrics.errorRate,
          timestamp: new Date(),
        },
      ],
    });

    return metrics;
  }

  async createAlerts() {
    // Create alerting policies
    await mcpService.gcp('monitoring', 'create-alert-policy', {
      displayName: 'MCP Server Health Alert',
      conditions: [
        {
          displayName: 'Server health below threshold',
          conditionThreshold: {
            filter: 'metric.type="custom.googleapis.com/mcp/healthy_servers"',
            comparison: 'COMPARISON_LESS_THAN',
            thresholdValue: 0.8,
          },
        },
      ],
    });
  }
}
```

### 2. Logging Integration

```typescript
// Structured logging with MCP context
export class MCPLogger {
  static async logRequest(method: string, params: any, result: any, duration: number) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: 'mcp',
      method,
      params: JSON.stringify(params),
      success: !result.error,
      duration,
      serverId: result.serverId,
      environment: process.env.NODE_ENV,
    };

    // Store in BigQuery for analysis
    await mcpService.bigquery(
      'INSERT INTO logs.mcp_requests (timestamp, service, method, params, success, duration, server_id, environment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      Object.values(logEntry),
    );

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('MCP Request:', logEntry);
    }
  }
}
```

## 🧪 Testing Strategies

### 1. Unit Testing

```typescript
// libs/mcp/src/lib/mcp.service.spec.ts
import { MCPService } from './mcp.service';

describe('MCPService', () => {
  let service: MCPService;

  beforeEach(async () => {
    service = MCPService.getInstance();
    await service.initialize();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  it('should initialize successfully', () => {
    expect(service.isReady()).toBe(true);
  });

  it('should handle git operations', async () => {
    const result = await service.git('status');
    expect(result.error).toBeUndefined();
    expect(result.result).toBeDefined();
  });

  it('should route requests correctly', () => {
    const routing = service.testRouting('git.status');
    expect(routing.selectedServer).toBe('git');
  });
});
```

### 2. Integration Testing

```typescript
// apps/api/src/test/mcp-integration.spec.ts
import { testMCPConnectivity, validateMCPEnvironment } from '@nx-monorepo/mcp';

describe('MCP Integration', () => {
  it('should validate environment configuration', () => {
    const validation = validateMCPEnvironment('test');
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should connect to all enabled servers', async () => {
    const connectivity = await testMCPConnectivity();
    const failedConnections = connectivity.filter((c) => !c.connected);

    if (failedConnections.length > 0) {
      console.warn('Failed connections:', failedConnections);
    }

    // Allow some failures in test environment
    expect(failedConnections.length).toBeLessThan(connectivity.length * 0.5);
  });
});
```

### 3. End-to-End Testing

```typescript
// e2e/mcp-workflow.e2e-spec.ts
describe('MCP Workflow E2E', () => {
  it('should complete full data processing workflow', async () => {
    // 1. Store test data
    await mcpService.memory('store', { key: 'test-data', value: { test: true } });

    // 2. Query data
    const stored = await mcpService.memory('retrieve', { key: 'test-data' });
    expect(stored.result.test).toBe(true);

    // 3. Process with BigQuery
    const queryResult = await mcpService.bigquery('SELECT 1 as test_value');
    expect(queryResult.result).toBeDefined();

    // 4. Search for related content
    const searchResult = await mcpService.search('test query');
    expect(searchResult.result).toBeDefined();
  });
});
```

## 🚀 Deployment Considerations

### 1. Environment-Specific Configurations

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Production
  env:
    NODE_ENV: production
    MCP_ENVIRONMENT: production
    GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
    GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
  run: |
    npm run build
    npm run deploy
```

### 2. Health Checks in Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: api
          livenessProbe:
            httpGet:
              path: /health/mcp
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/mcp/connectivity
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### 3. Monitoring Dashboards

```typescript
// Create Grafana dashboard for MCP metrics
const dashboardConfig = {
  title: 'MCP System Health',
  panels: [
    {
      title: 'Server Health',
      type: 'stat',
      targets: [
        {
          expr: 'mcp_healthy_servers / mcp_total_servers * 100',
        },
      ],
    },
    {
      title: 'Request Rate',
      type: 'graph',
      targets: [
        {
          expr: 'rate(mcp_requests_total[5m])',
        },
      ],
    },
    {
      title: 'Error Rate',
      type: 'graph',
      targets: [
        {
          expr: 'rate(mcp_errors_total[5m])',
        },
      ],
    },
  ],
};
```

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

1. **Server Connection Timeouts**

   ```typescript
   // Increase timeout for slow servers
   const result = await mcpService.request('slow.operation', params, {
     timeout: 60000, // 60 seconds
   });
   ```

2. **Authentication Failures**

   ```bash
   # Check secret access
   gcloud secrets versions access latest --secret="github-token"

   # Verify service account permissions
   gcloud projects get-iam-policy PROJECT_ID
   ```

3. **Memory Issues**

   ```typescript
   // Clear memory cache periodically
   await mcpService.memory('clear', { pattern: 'cache-*' });
   ```

4. **Rate Limiting**
   ```typescript
   // Implement exponential backoff
   const result = await mcpService.request('api.call', params, {
     retries: 5,
     timeout: 30000,
   });
   ```

## 📈 Performance Optimization

### 1. Caching Strategies

```typescript
export class CachedMCPService {
  private cache = new Map<string, { data: any; expires: number }>();

  async cachedRequest(method: string, params: any, ttl = 300000) {
    const key = `${method}-${JSON.stringify(params)}`;
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const result = await mcpService.request(method, params);
    this.cache.set(key, {
      data: result,
      expires: Date.now() + ttl,
    });

    return result;
  }
}
```

### 2. Connection Pooling

```typescript
// Configure connection pooling for high-throughput scenarios
const mcpConfig = {
  connectionPool: {
    maxConnections: 10,
    idleTimeout: 30000,
    acquireTimeout: 10000,
  },
};
```

### 3. Load Balancing

```typescript
// Use multiple server instances for load distribution
const loadBalancedService = {
  async distributedRequest(method: string, params: any) {
    const availableServers = mcpService.testRouting(method).availableServers;
    const selectedServer = this.selectLeastLoadedServer(availableServers);

    return mcpService.request(method, params, { serverId: selectedServer });
  },
};
```

This comprehensive guide should help you effectively integrate and use the MCP system in your Signals project. Remember to follow security best practices, monitor system health, and test thoroughly in all environments.
