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

// Local route implementations for agents project
async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

async function agentsRoutes(fastify: FastifyInstance) {
  fastify.post('/start', async (request: FastifyRequest, reply) => {
    const task = (request.body as any)?.task ?? 'default task';
    return { ok: true, task, message: 'Agent task queued' };
  });

  fastify.post('/api/v1/agent-predict', async (request: FastifyRequest, reply) => {
    try {
      const instancePayload = request.body;
      const predictions = await vertexClient.predict(instancePayload);

      fastify.log.info({
        message: 'Prediction successful',
        endpointId: vertexAIConfig.endpointId,
      });

      return { success: true, predictions };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'An error occurred during prediction.',
        error: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  });
}

const fastify = Fastify({
  logger: true,
});

// --- Vertex AI Integration ---
const vertexAIConfig: VertexAIClientConfig = {
  project: process.env['GCP_PROJECT_ID'] || '324928471234',
  location: process.env['GCP_LOCATION'] || 'us-central1',
  endpointId: process.env['VERTEX_AI_ENDPOINT_ID'] || '839281723491823912',
};

const vertexClient = new VertexAIClient(vertexAIConfig);

// Initialize MCP service and start server
async function initializeApp() {
  try {
    console.log('Initializing MCP service...');
    await mcpService.initialize();
    console.log('✅ MCP service initialized successfully');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(agentsRoutes);

    const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;
    fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      fastify.log.info(`Agents server listening at ${address}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize MCP service:', error);
    process.exit(1);
  }
}

initializeApp().catch(console.error);
