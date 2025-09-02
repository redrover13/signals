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
import { MCPService } from '@nx-monorepo/agents/gemini-orchestrator';

async function main() {
  const mcpService = MCPService.getInstance();
  await mcpService.initialize();
  
  const result = await mcpService.orchestrateWithGemini(
    "What were our top-selling menu items last month?",
    {
      restaurantId: "dds-central",
      timePeriod: "last-month"
    }
  );
  
  console.log(result);
}
```

### Advanced Options

```typescript
const result = await mcpService.orchestrateWithGemini(
  "What were our top-selling menu items last month?",
  {
    restaurantId: "dds-central",
    timePeriod: "last-month"
  },
  {
    streaming: false,
    timeout: 60000,
    cacheResults: true,
    cache: {
      ttlSeconds: 3600,
      refreshOnRead: false
    }
  }
);
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

The following environment variables can be configured:

- `GEMINI_API_KEY`: Gemini API key (recommended to use Secret Manager)
- `GEMINI_MODEL`: Gemini model name (default: gemini-1.5-pro-latest)
- `GEMINI_MAX_TOKENS`: Maximum output tokens (default: 8192)
- `GEMINI_TEMPERATURE`: Temperature parameter (default: 0.7)
- `GEMINI_TOP_P`: Top-p parameter (default: 0.95)
- `GEMINI_TOP_K`: Top-k parameter (default: 40)
- `BIGQUERY_PROJECT_ID`: BigQuery project ID
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_COLLECTION`: Default Firebase collection (default: gemini-orchestrator)
- `GCP_PROJECT_ID`: Google Cloud project ID

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
