/**
 * @fileoverview main module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains main agents application using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { runAgent } from '@dulce-de-saigon/agents-lib';
import { registerSecurity, loadAppConfig } from '@dulce-de-saigon/security';
import { VertexAIClient, VertexAIClientConfig } from '@dulce/adk';
import { WebAnalyticsTracker } from '@dulce/adk';
import { EventCategory } from '@dulce/adk';
import { createConfigFromEnv } from '@dulce/adk';
// (The import of `mcpService` from '@dulce/mcp' has been removed)
import {
  initializeOpenTelemetry,
  withSpan,
  logEvent,
  instrument,
  getTracer,
} from '@dulce/utils/monitoring';
import { SpanKind } from '@opentelemetry/api';

// Initialize OpenTelemetry before any other imports
initializeOpenTelemetry({
  serviceName: 'dulce-de-saigon-agents',
  serviceVersion: '1.0.0',
  gcpProjectId: process.env.GCP_PROJECT_ID,
  enableAutoInstrumentation: true,
  enableCustomExporter: true,
  enableBigQueryLogs: true,
}).catch(console.error);

// Initialize configuration from environment
const config = createConfigFromEnv({
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || '324928471234',
    location: process.env.GCP_LOCATION || 'us-central1',
  },
  agent: {
    model: 'gemini-1.5-pro',
  },
});

// Initialize the analytics tracker
const analyticsTracker = new WebAnalyticsTracker({
  projectId: config?.get('gcp.projectId'),
  datasetId: process.env.BQ_DATASET_ID || 'analytics',
  tableId: process.env.BQ_TABLE_ID || 'events',
});

// Create Fastify instance
const fastify = Fastify({
  logger: true,
});

// --- Vertex AI Integration ---
// Configuration should come from environment variables, not be hardcoded.
// Cấu hình nên được lấy từ biến môi trường.
const vertexAIConfig: VertexAIClientConfig = {
  project: config?.get('gcp.projectId'),
  location: config?.get('gcp.location'),
  endpointId: process.env.VERTEX_AI_ENDPOINT_ID || '839281723491823912',
};

// Initialize Vertex AI client
const vertexClient = new VertexAIClient(vertexAIConfig);

// Register security middleware
registerSecurity(fastify);

// Local route implementations for agents project
async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply) => {
    return withSpan(
      'health-check',
      async (span) => {
        span.setAttributes({
          'http.method': 'GET',
          'http.route': '/health',
          'service.component': 'agents',
        });

        await logEvent('health_check', { status: 'ok' });

        return { status: 'ok', timestamp: new Date().toISOString() };
      },
      { kind: SpanKind.SERVER },
    );
  });
}

async function agentsRoutes(fastify: FastifyInstance) {
  // Instrument the start endpoint
  fastify.post('/start', async (request: FastifyRequest, reply) => {
    // Track agent start event
    analyticsTracker.trackEvent({
      category: EventCategory.AGENT,
      action: 'start',
      label: 'agent_execution',
      value: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: request.headers['x-user-id'] || 'anonymous',
      },
    });

    try {
      const agentResult = await runAgent({
        prompt: request.body['prompt'] || 'Tell me about Vietnamese food',
        tools: [],
      });

      return { success: true, result: agentResult };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Failed to run agent',
      });
    }
  });

  // Example route demonstrating an inference call
  // Ví dụ về một route thực hiện lệnh gọi suy luận
  fastify.post('/api/v1/agent-predict', async (request, reply) => {
    try {
      const instancePayload = request.body; // Assume body contains the instance
      const predictions = await vertexClient.predict(instancePayload);

      // Log for compliance and analytics, respecting data privacy.
      // Ghi nhật ký để tuân thủ và phân tích, tôn trọng quyền riêng tư dữ liệu.
      fastify.log.info({
        message: 'Prediction successful',
        endpointId: vertexAIConfig.endpointId,
      });

      return { success: true, predictions };
    } catch (error) {
      fastify.log.error(error); // The ADK client already logged details
      reply.status(500).send({
        success: false,
        error: 'Failed to process prediction',
      });
    }
  });
}

// Register routes
fastify.register(agentsRoutes);
fastify.register(healthRoutes);

// Start the server
const start = async () => {
  try {
    // Load application configuration
    const config = await loadAppConfig();

    // Apply configuration
    fastify.log.info(`Starting server with environment: ${config?.environment}`);

    // Start listening
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Agent server is listening on port 3000');

    // Track server start
    analyticsTracker.trackEvent({
      category: EventCategory.SYSTEM,
      action: 'start',
      label: 'server_start',
      value: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        environment: config?.environment,
      },
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Start the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { fastify, start };
