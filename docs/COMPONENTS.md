# Dulce de Saigon Components Documentation

## 1. API Service (apps/api)

The API service is the primary backend for the Dulce de Saigon platform, built with Fastify.

### Key Features

- RESTful API endpoints for web and mobile clients
- Event publishing to Google Pub/Sub
- Authentication and authorization
- Business logic processing

### API Endpoints

#### Health Check
```
GET /health
```
Returns the health status of the service.

#### Events
```
POST /events
```
Publishes events to the Pub/Sub topic for ingestion.

#### Agents
```
POST /agents/start
```
Starts an agent task by publishing to the agents Pub/Sub topic.

### Configuration

The API service requires the following environment variables:

- `PORT` - Port to listen on (default: 3000)
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `BQ_DATASET` - BigQuery dataset name
- `PUBSUB_TOPIC` - Pub/Sub topic name for events
- `AGENTS_TOPIC` - Pub/Sub topic name for agents (default: dulce.agents)

### Development

To run the API service in development:

```bash
nx serve api
```

To build the API service:

```bash
nx build api
```

## 2. Agents Service (apps/agents)

The agents service processes complex tasks using Vertex AI and other tools.

### Key Features

- AI-powered business intelligence
- Scheduled analytics jobs
- Business insights and recommendations
- Inventory optimization

### Architecture

The agents service consists of:

1. **Agent Runner** - Executes agent tasks
2. **Tool Library** - Collection of reusable tools
3. **Vertex AI Integration** - For natural language processing

### Agent Configuration

Agents are configured with:

- **Tools** - Available tools for the agent to use
- **Complete Function** - Function to generate responses
- **Max Steps** - Maximum number of steps for the agent

### Tools

The agents library provides several built-in tools:

#### BigQuery Query Tool
```typescript
{
  name: "bq.query",
  description: "Run a BigQuery SQL query",
  run: async (input: { sql: string, params?: object }) => {
    const rows = await bqQuery(input.sql, input.params);
    return { rows };
  }
}
```

#### BigQuery Insert Tool
```typescript
{
  name: "bq.insert",
  description: "Insert rows into a BigQuery table",
  run: async (input: { table: string, rows: any[] }) => {
    await insertRows(input.table, input.rows);
    return { ok: true };
  }
}
```

#### Cloud Storage Upload Tool
```typescript
{
  name: "storage.uploadString",
  description: "Upload a string to Cloud Storage",
  run: async (input: { path: string, contents: string, contentType?: string }) => {
    const uri = await uploadString(input.path, input.contents, input.contentType);
    return { uri };
  }
}
```

### Development

To run the agents service in development:

```bash
nx serve agents
```

To build the agents service:

```bash
nx build agents
```

## 3. GCP Library (libs/gcp)

The GCP library provides shared functionality for Google Cloud Platform services.

### Key Features

- Pub/Sub message handling
- BigQuery data access
- Cloud Storage operations
- Secret Manager access

### Pub/Sub Integration

The library provides functions for working with Pub/Sub:

```typescript
import { getPubSub } from "@dulce/gcp";

const pubsub = getPubSub();
const topic = pubsub.topic("dulce.events");
const messageId = await topic.publishMessage({ data: Buffer.from(JSON.stringify(payload)) });
```

### BigQuery Integration

The library provides functions for working with BigQuery:

```typescript
import { query, insertRows } from "@dulce/gcp";

// Query data
const rows = await query("SELECT * FROM `project.dataset.table` WHERE id = @id", { id: "123" });

// Insert rows
await insertRows("table_name", [
  { id: "123", name: "Example", timestamp: new Date() }
]);
```

### Cloud Storage Integration

The library provides functions for working with Cloud Storage:

```typescript
import { uploadString } from "@dulce/gcp";

const uri = await uploadString("path/to/file.txt", "File contents", "text/plain");
```

### Secret Manager Integration

The library provides functions for working with Secret Manager:

```typescript
import { getSecret } from "@dulce/gcp";

const secretValue = await getSecret("SECRET_NAME");
```

## 4. Agents Library (libs/agents)

The agents library provides the framework for building AI-powered agents.

### Key Concepts

- **Agent** - A configurable AI entity that can perform tasks
- **Tool** - A reusable function that an agent can use
- **Complete Function** - A function that generates responses using AI

### Agent Definition

```typescript
type AgentConfig = {
  tools: Record<string, Tool>;
  complete: (
    prompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => Promise<string>;
  maxSteps?: number;
};
```

### Tool Definition

```typescript
type Tool = {
  name: string;
  description: string;
  run: (input: any) => Promise<any>;
};
```

### Running an Agent

```typescript
import { runAgent } from "@dulce-de-saigon/agents-lib";

const result = await runAgent("Plan a content calendar for Dulce de Saigon", agentConfig);
```

## 5. Web Application (apps/web)

The web application is the customer-facing interface built with Next.js.

### Key Features

- Menu browsing and online ordering
- Customer account management
- Real-time order tracking
- Loyalty program integration
- Vietnamese language support

### Architecture

The web application follows a component-based architecture with:

- **Pages** - Top-level routes
- **Components** - Reusable UI elements
- **Services** - API integration layer

### Tracking Component

The tracking component sends events to the API:

```tsx
// apps/web/site/components/Track.tsx
"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function Track() {
  const path = usePathname();
  const q = useSearchParams();
  useEffect(() => {
    const payload = { type: "site.view", page: path || "/", utm: Object.fromEntries(q.entries()) };
    fetch(process.env.NEXT_PUBLIC_API_BASE + "/events", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload)
    }).catch(() => {});
  }, [path, q]);
  return null;
}
```

### Development

To run the web application in development:

```bash
nx serve web
```

To build the web application:

```bash
nx build web