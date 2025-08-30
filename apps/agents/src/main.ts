/**
 * @fileoverview main module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { VertexAIClient, VertexAIClientConfig } from '@nx-monorepo/adk/services/vertex';
import { mcpService } from '@nx-monorepo/mcp';
import { 
  initializeOpenTelemetry, 
  withSpan, 
  logEvent, 
  instrument,
  getTracer 
} from '@nx-monorepo/utils/monitoring';
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
}

async function agentsRoutes(fastify: FastifyInstance) {
  // Instrument the start endpoint
  fastify.post('/start', async (request: FastifyRequest, reply) => {
    return withSpan('agent-task-start', async (span) => {
      const task = (request.body as any)?.task ?? 'default task';
      
      span.setAttributes({
        'http.method': 'POST',
        'http.route': '/start',
        'agent.task': task,
        'service.component': 'agents',
      });

      await logEvent('agent_task_started', { 
        task,
        requestId: request.id,
      });

      return { ok: true, task, message: 'Agent task queued' };
    }, { kind: SpanKind.SERVER });
  });

  // Instrument the prediction endpoint
  fastify.post('/api/v1/agent-predict', async (request: FastifyRequest, reply) => {
    return withSpan('vertex-ai-prediction', async (span) => {
      try {
        const instancePayload = request.body;
        
        span.setAttributes({
          'http.method': 'POST',
          'http.route': '/api/v1/agent-predict',
          'vertex.endpoint_id': vertexAIConfig.endpointId,
          'vertex.project': vertexAIConfig.project,
          'service.component': 'agents',
        });

        await logEvent('prediction_request', { 
          endpointId: vertexAIConfig.endpointId,
          payloadSize: JSON.stringify(instancePayload).length,
        });

        const predictions = await vertexClient.predict(instancePayload);

        span.setAttributes({
          'vertex.prediction_success': true,
          'vertex.predictions_count': Array.isArray(predictions) ? predictions.length : 1,
        });

        fastify.log.info({
          message: 'Prediction successful',
          endpointId: vertexAIConfig.endpointId,
        });

        await logEvent('prediction_success', { 
          endpointId: vertexAIConfig.endpointId,
          predictionsCount: Array.isArray(predictions) ? predictions.length : 1,
        });

        return { success: true, predictions };
      } catch (error) {
        span.setAttributes({
          'vertex.prediction_success': false,
          'error.type': error instanceof Error ? error.constructor.name : 'Unknown',
          'error.message': error instanceof Error ? error.message : 'Unknown error',
        });

        fastify.log.error(error);
        
        await logEvent('prediction_error', { 
          endpointId: vertexAIConfig.endpointId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'error');

        reply.status(500).send({
          success: false,
          message: 'An error occurred during prediction.',
          error: error instanceof Error ? error.name : 'UnknownError',
        });
      }
    }, { kind: SpanKind.SERVER });
  });
}

const fastify = Fastify({
  logger: true,
});

// --- Vertex AI Integration ---
const vertexAIConfig: VertexAIClientConfig = {
  project: process.env.GCP_PROJECT_ID || '324928471234',
  location: process.env.GCP_LOCATION || 'us-central1',
  endpointId: process.env.VERTEX_AI_ENDPOINT_ID || '839281723491823912',
};

const vertexClient = new VertexAIClient(vertexAIConfig);

// Instrument the initialization function
const instrumentedInitialize = instrument('app-initialization', async () => {
  console.log('Initializing MCP service...');
  await mcpService.initialize();
  console.log('✅ MCP service initialized successfully');
  console.log('📊 Enabled servers:', mcpService.getEnabledServers());

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(agentsRoutes);

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Agents server listening at ${address}`);
  });
}, {
  attributes: {
    'service.component': 'agents',
    'service.initialization': true,
  }
});

// Initialize MCP service and start server
async function initializeApp() {
  try {
    await logEvent('app_startup', { 
      service: 'dulce-de-saigon-agents',
      version: '1.0.0',
    });

    await instrumentedInitialize();
  } catch (error) {
    console.error('❌ Failed to initialize MCP service:', error);
    
    await logEvent('app_startup_error', { 
      service: 'dulce-de-saigon-agents',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'error');
    
    process.exit(1);
  }
}

initializeApp().catch(console.error);
