# Gemini Orchestrator Module

The Gemini Orchestrator module is a powerful component of the Dulce de Saigon F&B Data Platform that leverages Google's Gemini AI to intelligently route and process requests across various services.

## Overview

The Gemini Orchestrator acts as a central hub for coordinating different data operations, including:

- BigQuery data retrieval and analytics
- Firebase document management
- Specialized tool execution
- Intelligent query routing

## Features

- **Smart Routing**: Automatically analyzes queries and routes them to the appropriate sub-agent
- **BigQuery Integration**: Generates and executes SQL queries based on natural language input
- **Firebase Operations**: Supports querying, retrieving, writing, and deleting documents
- **Tool Execution**: Integrates with specialized tools for specific operations
- **Caching**: Optional result caching with configurable TTL for improved performance
- **Error Handling**: Comprehensive error handling with detailed error categorization
- **Configuration Management**: Secure management of API keys and configuration values
- **MCP Integration**: Full compatibility with the Model Context Protocol

## Usage

### Basic Usage

```typescript
import { GeminiOrchestrator } from '@nx-monorepo/agents/gemini-orchestrator';

async function main() {
  const orchestrator = new GeminiOrchestrator();
  await orchestrator.initialize();
  
  const result = await orchestrator.orchestrate({
    query: "What were our top-selling menu items last month?",
    context: {
      restaurantId: "dds-central",
      timePeriod: "last-month"
    },
    options: {
      timeout: 30000,
      cacheResults: false
    }
  });
  
  console.log(result);
}
```

### Using with MCP Service

```typescript
import { MCPService } from '@nx-monorepo/agents/gemini-orchestrator';

async function main() {
  const mcpService = MCPService.getInstance();
  await mcpService.initialize();
  
  const result = await mcpService.orchestrateWithGemini(
    "What were our top-selling menu items last month?",
    {
      restaurantId: "dds-central",
      timePeriod: "last-month"
    },
    {
      streaming: false,
      timeout: 60000,
      cacheResults: true
    }
  );
  
  console.log(result);
}
```

### Advanced Options

```typescript
const result = await orchestrator.orchestrate({
  query: "Analyze sales data for the past quarter",
  context: {
    restaurantId: "dds-central",
    timePeriod: "Q1-2024",
    includeComparisons: true
  },
  options: {
    streaming: false,
    timeout: 60000,
    cacheResults: true
  }
});
```

### Query Routing Examples

The orchestrator automatically routes queries to appropriate sub-agents:

#### BigQuery Routing
```typescript
// These queries will be routed to BigQuery sub-agent
await orchestrator.orchestrate({
  query: "SELECT sales_amount FROM orders WHERE date > '2024-01-01'"
});

await orchestrator.orchestrate({
  query: "What are our analytics for menu performance?"
});
```

#### Firebase Routing
```typescript
// These queries will be routed to Firebase sub-agent
await orchestrator.orchestrate({
  query: "Get documents from the users collection"
});

await orchestrator.orchestrate({
  query: "Update customer profile in Firestore"
});
```

#### RAG Routing
```typescript
// These queries will be routed to RAG sub-agent
await orchestrator.orchestrate({
  query: "Search for information about Vietnamese coffee culture"
});

await orchestrator.orchestrate({
  query: "Find recipes for traditional pho"
});
```

### Health Monitoring

```typescript
// Check orchestrator health
const health = await orchestrator.healthCheck();
console.log('Health status:', health.status);

// Get current status
const status = orchestrator.getStatus();
console.log('Initialized:', status.initialized);
console.log('Has model:', status.hasModel);
```

## Architecture

The Gemini Orchestrator follows a modular architecture:

- **Orchestrator**: Core class that manages routing and execution
- **Sub-Agents**: Specialized handlers for different services (BigQuery, Firebase, Tools)
- **Clients**: Service-specific clients for external integrations
- **Schemas**: Zod schemas for strict input/output validation
- **Error Handling**: Standardized error handling across all components
- **Configuration**: Secure configuration management

## Key Components

- `gemini-orchestrator.ts`: Main orchestrator implementation
- `schemas.ts`: Type definitions and validation schemas
- `tools.ts`: Tool definitions and execution logic
- `mcp.service.ts`: MCP protocol integration
- `clients/`: Service-specific client implementations
- `utils/`: Utility functions and error handling
- `config/`: Configuration management

## Error Handling

The orchestrator implements comprehensive error handling with:

- Error categorization
- Vietnamese-friendly error messages
- Detailed error context
- Integration with monitoring systems

## Environment Variables

The Gemini Orchestrator requires the following environment variables:

### Required
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`: Google AI API key for Gemini access

### Optional
- `GCP_PROJECT_ID`: Google Cloud project ID for BigQuery and other GCP services
- `NODE_ENV`: Environment (development, staging, production)

## Features

### Smart Query Routing
The orchestrator analyzes incoming queries and automatically routes them to the appropriate sub-agent:

- **BigQuery**: SQL queries, analytics requests, data operations
- **Firebase**: Document operations, Firestore queries, collection management  
- **RAG**: Search queries, knowledge retrieval, information requests
- **Tools**: General tool execution and utility operations

### Supported Tools
- `bq.query`: Execute BigQuery SQL queries
- `bq.insert`: Insert data into BigQuery tables
- `storage.uploadString`: Upload content to Cloud Storage

### Error Handling
- Comprehensive error categorization
- Vietnamese-friendly error messages
- Automatic retry logic with exponential backoff
- Graceful degradation when services are unavailable

### Performance Features
- Automatic initialization management
- Health monitoring and status checks
- Processing time tracking
- Simulation mode for development without API keys

## Building

Run `nx build gemini-orchestrator` to build the library.

## Running unit tests

Run `nx test gemini-orchestrator` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

When contributing to the Gemini Orchestrator, please follow these guidelines:

1. Ensure proper TypeScript typing with Zod schemas
2. Implement comprehensive error handling
3. Maintain backward compatibility
4. Add tests for new functionality
5. Update documentation as needed

## License

MIT
