# Agent Developer Kit (ADK)

This directory contains all the services, tools, and resources for the Agent Developer Kit for the `saigon-signals` project.

## Overview

The Agent Developer Kit (ADK) is a comprehensive toolkit for developing and deploying intelligent agents in the Dulce de Saigon F&B Data Platform. It provides a unified interface for interacting with various Google Cloud Platform services, tracking analytics, and managing data.

## Directory Structure

```
adk/
├── services/                # Service integrations
│   ├── analytics/           # Analytics event taxonomy and tracking
│   │   └── tracking/        # Cross-platform event tracking (web, iOS, Android)
│   ├── database/            # Database services (Firestore, BigQuery)
│   ├── mcp/                 # Model Context Protocol (MCP) integration
│   │   ├── adapters/        # Protocol adapters for different MCP servers
│   │   └── schema/          # Schema definitions for MCP interactions
│   ├── mobile/              # Mobile integrations for agent services
│   ├── monitoring/          # Agent monitoring and observability
│   └── vertex/              # Vertex AI integration
├── utils/                   # Utility functions
│   ├── logger.ts            # Structured logging utility
│   └── config-manager.ts    # Configuration management
└── index.ts                 # Main entry point
```

## Features

- **Vertex AI Integration**: Connect to Google's Vertex AI for machine learning capabilities
- **Analytics Tracking**: Cross-platform analytics tracking for web, iOS, and Android
- **Database Services**: Firestore and BigQuery integrations
- **Mobile Support**: Native integration with mobile platforms
- **MCP Integration**: Universal client for Model Context Protocol servers (Codacy, NX, etc.)
- **Agent Monitoring**: Metrics collection, health checks, and observability for agents
- **Utility Functions**: Logging and configuration management

## Getting Started

### Installation

```bash
# Install ADK dependencies
pnpm install
```

### Basic Usage

```typescript
import { 
  VertexAIClient, 
  WebAnalyticsTracker, 
  FirestoreService,
  MCPClient,
  MCPServerType,
  AgentMonitor,
  Logger,
  ConfigManager 
} from 'adk';

// Initialize a logger
const logger = new Logger({
  minLevel: LogLevel.INFO,
  serviceName: 'MyService'
});

// Load configuration
const config = new ConfigManager().load();

// Create a Vertex AI client
const vertexClient = new VertexAIClient({
  project: config.get('gcp.projectId'),
  location: config.get('gcp.location'),
  endpointId: config.get('vertexai.endpointId')
});

// Set up analytics tracking
const tracker = new WebAnalyticsTracker({
  projectId: config.get('gcp.projectId'),
  datasetId: 'analytics',
  tableId: 'events'
});

// Initialize Firestore
const firestore = new FirestoreService({
  projectId: config.get('gcp.projectId')
});

// Create an MCP client for Codacy
const mcpClient = new MCPClient({
  serverType: MCPServerType.CODACY,
  credentials: config.get('codacy.token')
});

// Set up agent monitoring
const monitor = new AgentMonitor({
  agentName: 'content-agent',
  metrics: ['requests', 'latency', 'errors'],
  healthChecks: {
    interval: '30s',
    timeout: '5s'
  }
});
```

## Service Modules

### Vertex AI

The Vertex AI module provides a client for interacting with Google's Vertex AI machine learning platform.

### Analytics Tracking

The analytics tracking module provides cross-platform support for event tracking across web, iOS, and Android platforms.

### Database Services

The database services module provides integrations with Firestore and BigQuery for data storage and analysis.

### Mobile Services

Mobile services facilitate agent integration with native mobile applications on iOS and Android.

### MCP Integration

The MCP integration module provides a universal client for interacting with Model Context Protocol (MCP) servers such as Codacy, NX, and others.

```typescript
// Analyze code with Codacy
const results = await mcpClient.analyzeCodacy('src/main.ts', {
  tool: 'eslint',
  rules: ['security', 'performance']
});

// Run an NX command
const nxClient = new MCPClient({
  serverType: MCPServerType.NX
});
await nxClient.runNxCommand('my-project', 'build', { production: true });
```

### Agent Monitoring

The agent monitoring module provides tools for metrics collection, health checks, and observability for agents.

```typescript
// Record custom metrics
monitor.recordMetric('custom_event', 1, { category: 'user_action' });

// Track request lifecycle
monitor.startRequest('req-123');
try {
  // Process request...
  monitor.endRequest('req-123', true, 150); // 150ms latency
} catch (error) {
  monitor.recordError(error);
  monitor.endRequest('req-123', false, 150);
}

// Get metrics
const metrics = monitor.getAllMetrics();
console.log(`Processed ${metrics.requests} requests with ${metrics.errors} errors`);

// Perform a health check
const isHealthy = await monitor.performHealthCheck();
```

## Utilities

### Logger

The logger utility provides structured logging capabilities with multiple log levels.

### ConfigManager

The configuration manager provides a way to load and access configuration values across environments.

## Best Practices

1. **Error Handling**: Always handle errors from ADK services
2. **Configuration**: Use ConfigManager to centralize configuration
3. **Logging**: Use the Logger utility for consistent logging
4. **Analytics**: Track important events for better insights
5. **Dependency Injection**: Pass initialized services as dependencies

## Next Steps

- Expand unit testing coverage for all ADK components
- Create detailed API documentation
- Integrate with CI/CD pipeline
- Implement remaining enhancement proposals:
  - Agent Testing Framework
  - Agent Development CLI
  - Enhanced Localization for Vietnamese Market
  - Agent Marketplace & Plugin System

---
*Update this README as the ADK evolves or new services are added.*
