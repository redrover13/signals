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
import { VertexAIClient, VertexAIClientConfig, RootAgent, createRootAgent } from '@nx-monorepo/adk';
import { BigQueryAgent, createBqAgent } from '@nx-monorepo/bq-agent';
import { ContentAgent, createContentAgent } from '@nx-monorepo/content-agent';
import { CrmAgent, createCrmAgent } from '@nx-monorepo/crm-agent';
import { ReviewsAgent, createReviewsAgent } from '@nx-monorepo/reviews-agent';
import { mcpService } from '@nx-monorepo/mcp';
import {
  initializeOpenTelemetry,
  withSpan,
  logEvent,
  instrument,
  getTracer
} from '@nx-monorepo/utils/monitoring';
import { SpanKind } from '@opentelemetry/api';
import { getPubSubClient, insertRows } from 'gcp-auth';

// Import security and configuration
import { registerSecurity, loadAppConfig } from '@dulce-de-saigon/security';

// Global agent instances
let rootAgent: RootAgent;
let vertexClient: VertexAIClient;

// Load configuration
const config = loadAppConfig();

// Initialize OpenTelemetry monitoring
initializeOpenTelemetry({
  serviceName: 'dulce-de-saigon-agents',
  serviceVersion: '1.0.0',
  gcpProjectId: config.gcpProjectId,
  enableAutoInstrumentation: true,
  enableCustomExporter: true,
  enableBigQueryLogs: true,
}).catch(console.error);

// Initialize Vertex AI client
const vertexConfig: VertexAIClientConfig = {
  projectId: config.gcpProjectId,
  location: config.vertexLocation || 'us-central1',
  model: config.vertexModel || 'gemini-1.5-pro',
  temperature: config.temperature || 0.7,
  maxTokens: config.maxTokens || 2048,
  safetySettings: config.safetySettings,
};

vertexClient = new VertexAIClient(vertexConfig);

// Initialize Pub/Sub client
const pubSubClient = getPubSubClient({
  projectId: config.gcpProjectId,
  keyFilename: config.gcpKeyFile,
});

// Initialize specialized agents
const bigQueryAgent = createBqAgent({
  vertexClient,
  projectId: config.gcpProjectId,
  datasetId: config.bigQueryDataset,
  tableId: config.bigQueryTable,
});

const contentAgent = createContentAgent({
  vertexClient,
  pubSubClient,
  topicName: config.contentTopic,
});

const crmAgent = createCrmAgent({
  vertexClient,
  pubSubClient,
  topicName: config.crmTopic,
});

const reviewsAgent = createReviewsAgent({
  vertexClient,
  pubSubClient,
  topicName: config.reviewsTopic,
});

// Initialize root agent with all specialized agents
rootAgent = createRootAgent({
  vertexClient,
  agents: {
    bigQuery: bigQueryAgent,
    content: contentAgent,
    crm: crmAgent,
    reviews: reviewsAgent,
  },
  mcpService,
});

// Local route implementations for agents project
async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply) => {
    return withSpan('health-check', async (span) => {
      span.setAttributes({
        'http.method': 'GET',
        'http.route': '/health',
        'service.component': 'agents',
      });

      await logEvent('health_check', { status: 'ok' });

      return { status: 'ok', timestamp: new Date().toISOString() };
    }, { kind: SpanKind.SERVER });
  });

  fastify.get('/agents/status', async (request: FastifyRequest, reply) => {
    try {
      const status = await rootAgent.getStatus();
      return status;
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to get agent status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

async function agentsRoutes(fastify: FastifyInstance) {
  // Instrument the start endpoint
  fastify.post('/start', async (request: FastifyRequest, reply) => {
    return withSpan('agent-task-start', async (span) => {
      const task = (request.body as any)?.task ?? 'default task';
      const agent = (request.body as any)?.agent;
      const context = (request.body as any)?.context || {};

      span.setAttributes({
        'http.method': 'POST',
        'http.route': '/start',
        'agent.task': task,
        'agent.selected': agent || 'root',
        'service.component': 'agents',
      });

      await logEvent('agent_task_started', {
        task,
        agent: agent || 'root',
        requestId: request.id,
      });

      try {
        let result;

        if (agent && agent !== 'root') {
          const target = rootAgent.getSubAgent(agent);
          if (!target) {
            return reply.status(400).send({
              error: 'Invalid agent',
              availableAgents: rootAgent.getAvailableAgents(),
            });
          }
          // Invoke the selected sub-agent directly
          result = await target.invoke({
            messages: [{ role: 'user', content: task }],
            context,
          });
        } else {
          // Use root agent to determine routing
          result = await rootAgent.routeTask(task, context);
        }

        return {
          ok: true,
          task,
          agent: agent || 'root',
          result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        reply.status(500).send({
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, { kind: SpanKind.SERVER });
  });

  fastify.post('/workflow', async (request: FastifyRequest, reply) => {
    const { workflow } = request.body as any;

    try {
      if (!Array.isArray(workflow)) {
        return reply.status(400).send({
          error: 'Workflow must be an array of steps',
        });
      }

      const result = await rootAgent.executeWorkflow(workflow);
      return result;
    } catch (error) {
      reply.status(500).send({
        error: 'Workflow execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Instrument the prediction endpoint
  fastify.post('/api/v1/agent-predict', async (request: FastifyRequest, reply) => {
    return withSpan('vertex-ai-prediction', async (span) => {
      try {
        const instancePayload = request.body;

        span.setAttributes({
          'http.method': 'POST',
          'http.route': '/api/v1/agent-predict',
          'vertex.project': config.gcpProjectId,
          'service.component': 'agents',
        });

        await logEvent('prediction_request', {
          payloadSize: JSON.stringify(instancePayload).length,
        });

        const prediction = await vertexClient.predict(instancePayload);

        fastify.log.info({
          message: 'Prediction successful',
          config: vertexClient.getConfig(),
        });

        return prediction;
      } catch (error) {
        span.recordException(error as Error);
        reply.status(500).send({
          error: 'Prediction failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, { kind: SpanKind.SERVER });
  });

  fastify.post('/api/v1/generate-text', async (request: FastifyRequest, reply) => {
    try {
      const { prompt, options } = request.body as any;
      if (typeof prompt !== 'string' || !prompt.trim()) {
        return reply.status(400).send({ error: 'Prompt must be a non-empty string' });
      }

      const text = await vertexClient.generateText(prompt, options);

      return {
        success: true,
        text,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        message: 'Text generation failed.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// Create Fastify instance
const fastify = Fastify({
  logger: true,
});

// Register security middleware
registerSecurity(fastify, {
  authentication: process.env.NODE_ENV === 'production',
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  },
});

// Register routes
fastify.register(healthRoutes);
fastify.register(agentsRoutes);

/**
 * Run the server!
 */
const start = async () => {
  try {
    // Start the server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`Server listening on http://${host}:${port}`);
    fastify.log.info('Dulce de Saigon Agents service started successfully');

    // Log initialization status
    await logEvent('service_started', {
      port,
      host,
      environment: process.env.NODE_ENV || 'development',
      gcpProjectId: config.gcpProjectId,
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully...');

  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully...');

  await fastify.close();
  process.exit(0);
});

// Start the server
start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
  // Instrument the start endpoint
