# ADK (Agent Development Kit) Adapter Layer

This library serves as an adapter layer between the external vendor ADK (@waldzellai/adk-typescript) and the Dulce de Saigon F&B platform agents.

## Architecture Overview

The ADK adapter provides three distinct layers:

```
Product Agents (apps/agents, etc.)
       ↓
   @nx-monorepo/adk (this adapter)
       ↓ 
@waldzellai/adk-typescript (vendor ADK)
```

### Layer 1: Vendor ADK (@waldzellai/adk-typescript)
- Raw vendor ADK functionality
- Core agent classes (BaseAgent, LlmAgent, etc.)
- Direct ADK API access

### Layer 2: Adapter (libs/adk - this package)
- Wraps vendor ADK with platform-specific extensions
- Provides DulceLlmAgent and DulceBaseAgent classes
- Includes GCP-specific tools and configurations
- Handles environment-specific setup
- Exports stable API for product code

### Layer 3: Product Agents
- Business logic agents (apps/agents/src/main.ts)
- Import only from @nx-monorepo/adk
- No direct vendor ADK dependencies

## Import Guidelines

### ✅ Correct Usage

**In Product Code (apps/*, tests, etc.):**
```typescript
// Only import from the adapter
import { RootAgent, VertexAIClient, createConfigFromEnv } from '@nx-monorepo/adk';
```

**In Adapter Code (libs/adk/src/*):**
```typescript
// Import from vendor ADK is allowed here
import { LlmAgent, BaseAgent } from '@waldzellai/adk-typescript';
// Re-export through adapter for product consumption
export { LlmAgent, BaseAgent } from '@waldzellai/adk-typescript';
```

### ❌ Incorrect Usage

**In Product Code:**
```typescript
// DON'T import vendor ADK directly
import { LlmAgent } from '@waldzellai/adk-typescript'; // ❌

// DON'T import specific adapter paths
import { VertexAIClient } from '@nx-monorepo/adk/services/vertex'; // ❌
```

## Environment Requirements

The adapter expects the following environment variables:

### Required
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `GCP_LOCATION`: Google Cloud region (e.g., 'us-central1')
- `GOOGLE_API_KEY`: API key for Gemini models

### Optional
- `VERTEX_AI_ENDPOINT_ID`: Custom Vertex AI endpoint
- `ADK_*`: Any ADK-prefixed vars are auto-loaded into ConfigManager

### Configuration Manager Usage

```typescript
import { createConfigFromEnv } from '@nx-monorepo/adk';

// Auto-loads from environment
const config = createConfigFromEnv({
  // Override defaults if needed
  agent: {
    model: 'gemini-1.5-pro'
  }
});

// Access configuration
const projectId = config.get('gcp.projectId');
const apiKey = config.get('agent.apiKey');
```

## Available Tools

The adapter provides GCP-specific tools:

- `bigquery_query`: Execute BigQuery SQL queries
- `bigquery_insert`: Insert data into BigQuery tables  
- `gcs_upload`: Upload files to Google Cloud Storage
- `http_request`: Make HTTP requests to external APIs

## Agent Classes

### DulceLlmAgent
Extended LlmAgent with platform-specific functionality:

```typescript
import { DulceLlmAgent } from '@nx-monorepo/adk';

class MyAgent extends DulceLlmAgent {
  constructor() {
    super({
      name: 'My Agent',
      description: 'Does amazing things',
      llm: new GeminiLlm({ model: 'gemini-1.5-pro' }),
      tools: GCP_TOOLS
    });
  }
}
```

### RootAgent
Orchestrator agent for coordinating multiple sub-agents:

```typescript
import { createRootAgent } from '@nx-monorepo/adk';

const rootAgent = createRootAgent();
rootAgent.registerSubAgent('my-agent', myAgent);
const result = await rootAgent.routeTask('Analyze sales data');
```

## Development Notes

- This adapter isolates vendor changes from product code
- Keep vendor imports inside libs/adk only
- Ensure re-exports in libs/adk/src/index.ts remain stable
- Add new platform-specific functionality as needed
- Follow Vietnamese F&B data privacy regulations
