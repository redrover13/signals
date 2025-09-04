# Agent ADK Integration

This document provides guidelines for integrating the Agent Developer Kit (ADK) with agent applications.

## Overview

The Agent Developer Kit (ADK) provides a comprehensive set of tools and services for building intelligent agents. This document outlines how to integrate the ADK with agent applications in the `apps/agents` directory.

## Getting Started

### Installing Dependencies

Make sure you have the ADK dependencies installed:

```bash
pnpm install
```

### Basic Integration

The main entry point for agent applications should initialize the ADK and use its components:

```typescript
import { initializeADK, VertexAIClient, WebAnalyticsTracker, FirestoreService } from 'adk';

async function main() {
  // Initialize the ADK
  const { logger, config } = initializeADK({
    projectId: 'my-project',
    serviceName: 'MyAgent',
    environment: process.env.NODE_ENV || 'development',
  });

  // Create a Vertex AI client
  const vertexClient = new VertexAIClient({
    project: config.get('gcp.projectId'),
    location: config.get('gcp.location'),
    endpointId: config.get('vertexai.endpointId'),
  });

  // Set up analytics tracking
  const tracker = new WebAnalyticsTracker({
    projectId: config.get('gcp.projectId'),
    datasetId: 'analytics',
    tableId: 'events',
  });

  // Initialize Firestore
  const firestore = new FirestoreService({
    projectId: config.get('gcp.projectId'),
  });

  // Your agent logic here
  logger.info('Agent started');
}

main().catch((error) => {
  console.error('Agent failed:', error);
  process.exit(1);
});
```

## Best Practices

1. **Initialization**: Always initialize the ADK at the start of your application.
2. **Configuration**: Use the ConfigManager to load and access configuration values.
3. **Logging**: Use the Logger utility for consistent logging across all agents.
4. **Analytics**: Track important events for better insights.
5. **Error Handling**: Always handle errors from ADK services properly.

## Services

### Vertex AI Integration

```typescript
import { VertexAIClient } from 'adk';

// Create client
const vertexClient = new VertexAIClient({
  project: 'my-project',
  location: 'us-central1',
  endpointId: 'my-endpoint',
});

// Make predictions
const predictions = await vertexClient.predict({
  instances: [{ content: 'Your content here' }],
});
```

### Analytics Tracking

```typescript
import { WebAnalyticsTracker, EventCategory } from 'adk';

// Create tracker
const tracker = new WebAnalyticsTracker({
  projectId: 'my-project',
  datasetId: 'analytics',
  tableId: 'events',
});

// Track events
tracker.trackEvent({
  category: EventCategory.USER,
  action: 'query',
  label: 'agent_interaction',
  value: 1,
});
```

### Database Services

```typescript
import { FirestoreService } from 'adk';

// Create service
const firestore = new FirestoreService({
  projectId: 'my-project',
});

// CRUD operations
const data = await firestore.get('users', 'user123');
```

## Mobile Integration

For agents that need to integrate with mobile platforms:

```typescript
import { MobileAgentService } from 'adk';

// Create mobile service
const mobileService = new MobileAgentService({
  platform: 'ios', // or 'android'
  projectId: 'my-project',
});

// Use mobile-specific features
mobileService.sendNotification({
  userId: 'user123',
  message: 'New recommendation available',
});
```

## Testing

For testing agents that use the ADK, mock the ADK components in your tests:

```typescript
// Mock ADK components
jest.mock('adk', () => ({
  VertexAIClient: jest.fn().mockImplementation(() => ({
    predict: jest.fn().mockResolvedValue({
      predictions: ['Mock prediction'],
    }),
  })),
  // Mock other components as needed
}));
```

## Troubleshooting

- **Configuration Issues**: Ensure your configuration files are properly set up in the expected locations.
- **Authentication Issues**: Check that your Google Cloud credentials are properly configured.
- **Missing Dependencies**: Ensure all ADK dependencies are installed.

## Learn More

For more details about the ADK, see the [ADK README](/adk/README.md).
