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

import Fastify from 'fastify';
import Fastify from 'fastify';
import { agentsRoutes } from '../../api/src/routes/agents';
import { healthRoutes } from '../../api/src/routes/health';
import { VertexAIClient, VertexAIClientConfig } from 'adk/services/vertex';
import { mcpService } from '@nx-monorepo/mcp';

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

// Initialize MCP service and start server
async function initializeApp() {
  try {
    console.log('Initializing MCP service...');
    await mcpService.initialize();
    console.log('✅ MCP service initialized successfully');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());

    fastify.post('/api/v1/agent-predict', async (request, reply) => {
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
        reply.status(500).send({
          success: false,
          message: 'An error occurred during prediction.',
          error: error instanceof Error ? error.name : 'UnknownError',
        });
      }
    });

    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
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

fastify.register(healthRoutes);
fastify.register(agentsRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
