# Agent Task Publishing and Runner Service

This implementation provides a complete agent orchestration system using Google Cloud Pub/Sub as the "Agent Bus" for the Dulce de Saigon F&B Data Platform.

## Architecture Overview

```
Website → API (/agents/start) → Pub/Sub dulce.agents → Agent Runner → BigQuery (dulce.agent_runs)
```

## Components

### 1. Infrastructure (Terraform)

Location: `infra/terraform/dulce-core/`

- **Pub/Sub Topics**: `dulce.events` and `dulce.agents`
- **BigQuery Dataset**: `dulce` with tables `events` and `agent_runs`
- **Subscriptions**: `dulce-agents-sub` for agent runner
- **Service Accounts**: Proper IAM for agent runner service
- **Cloud Run**: Agent runner service deployment

### 2. API Endpoint Enhancement

Location: `apps/api/src/routes/agents.ts`

**Endpoint**: `POST /agents/start`

**Request Format**:
```json
{
  "task": "Analyze customer reviews",
  "agentType": "reviews-agent",
  "priority": "high"
}
```

**Response Format**:
```json
{
  "ok": true,
  "id": "task-1756434453143-dlegw7a",
  "messageId": "projects/saigon-signals/topics/dulce.agents/messages/123456",
  "task": "Analyze customer reviews",
  "status": "published"
}
```

### 3. Agent Runner Service

Location: `apps/agents/src/main.ts`

**Features**:
- Subscribes to `dulce.agents` topic
- Routes tasks to appropriate agent processors:
  - `gemini-orchestrator`
  - `bq-agent`
  - `content-agent`
  - `crm-agent`
  - `reviews-agent`
- Logs all runs to `dulce.agent_runs` table
- Handles errors and retries gracefully

### 4. GCP Integration Library

Location: `libs/utils/gcp-auth/src/index.ts`

**Enhanced with**:
- Real Pub/Sub client integration
- Topic creation and publishing
- Proper error handling

## Usage

### Publishing Agent Tasks

```typescript
// Via API endpoint
const response = await fetch('/agents/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: 'Analyze customer sentiment',
    agentType: 'reviews-agent',
    priority: 'high'
  })
});
```

### Programmatic Usage

```typescript
import { getPubSub } from 'gcp-auth';

const pubsub = getPubSub();
const result = await pubsub.topic('dulce.agents').publishMessage({
  id: 'task-123',
  task: 'Process data',
  agentType: 'bq-agent',
  priority: 'normal',
  timestamp: new Date().toISOString(),
  source: 'manual'
});
```

## Supported Agent Types

- **gemini-orchestrator**: AI-powered task orchestration
- **bq-agent**: BigQuery operations and analytics
- **content-agent**: Content processing and analysis
- **crm-agent**: Customer relationship management tasks
- **reviews-agent**: Review analysis and sentiment processing
- **default**: Fallback processor for unknown agent types

## Testing

### Unit Tests
```bash
pnpm nx test api  # Tests for API endpoint
```

### Integration Tests
```bash
pnpm nx run api:test --testPathPattern=agents-flow  # Full flow tests
```

### Demo
```bash
node demo/agent-task-flow.js  # Demonstrates complete workflow
```

## Deployment

### Infrastructure
```bash
cd infra/terraform/dulce-core
terraform init
terraform plan
terraform apply
```

### Services
```bash
# API Service
pnpm nx build api
docker build -t gcr.io/saigon-signals/api .
docker push gcr.io/saigon-signals/api

# Agent Runner
pnpm nx build agents  
docker build -t gcr.io/saigon-signals/agent-runner .
docker push gcr.io/saigon-signals/agent-runner
```

## Environment Variables

```bash
GCP_PROJECT_ID=saigon-signals
GCP_LOCATION=us-central1
AGENTS_TOPIC=dulce.agents
NODE_ENV=production
```

## Observability

All agent runs are logged to `dulce.agent_runs` BigQuery table with:
- Task ID and details
- Agent type and execution status
- Start/completion timestamps
- Results and error messages
- Performance metrics

## Error Handling

- **Pub/Sub failures**: Graceful degradation with proper error responses
- **Agent processing errors**: Logged to BigQuery with error details
- **Retry logic**: Built-in Pub/Sub retry with exponential backoff
- **Dead letter queues**: Can be configured for failed messages

## Security

- **Service Accounts**: Minimal required permissions
- **IAM**: Principle of least privilege
- **Network**: Private Google Cloud services
- **Audit**: All operations logged to Cloud Audit Logs

## Performance

- **Scaling**: Auto-scaling Cloud Run instances (1-10)
- **Memory**: 1GB RAM for agent processing
- **Timeout**: 5-minute message acknowledgment deadline
- **Retention**: 24-hour message retention for retry

This implementation provides a robust, scalable foundation for agent orchestration while maintaining the minimal change principle and building on existing infrastructure.