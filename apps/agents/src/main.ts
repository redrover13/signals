<<<<<<< HEAD
import Fastify from "fastify";
import { runAgent } from "@dulce-de-saigon/agents-lib";
import { agentsRoutes } from "../../api/src/routes/agents";
import { healthRoutes } from "../../api/src/routes/health";
import { VertexAIClient, VertexAIClientConfig } from "adk/services/vertex";
import { registerSecurity, loadAppConfig } from "@dulce-de-saigon/security";
=======
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
import { mcpService } from '@nx-monorepo/mcp';

// Global agent instances
let rootAgent: RootAgent;
let vertexClient: VertexAIClient;

// Local route implementations for agents project
async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply) => {
    try {
      const agentStatus = await rootAgent.getStatus();
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        agents: agentStatus,
      };
    } catch (error) {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        warning: 'Agents not fully initialized',
      };
    }
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
  fastify.post('/start', async (request: FastifyRequest, reply) => {
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
          messages: [{ role: 'user', content: task || 'default task' }],
          context,
        });
      } else {
        // Use root agent to determine routing
        result = await rootAgent.routeTask(task || 'default task', context);
      }
      return { 
        ok: true, 
        task: task || 'default task', 
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

  fastify.post('/api/v1/agent-predict', async (request: FastifyRequest, reply) => {
    try {
      const instancePayload = request.body;
      const predictions = await vertexClient.predict(instancePayload);

      fastify.log.info({
        message: 'Prediction successful',
        config: vertexClient.getConfig(),
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
>>>>>>> main

const fastify = Fastify({
  logger: true,
});

<<<<<<< HEAD
// Load configuration asynchronously
let appConfig: Awaited<ReturnType<typeof loadAppConfig>>;

// --- Vertex AI Integration ---
// Configuration loaded securely from environment and Secret Manager
async function initializeVertexAI() {
  appConfig = await loadAppConfig();
  
  const vertexAIConfig: VertexAIClientConfig = {
    project: appConfig.gcpProjectId,
    location: appConfig.gcpLocation,
    endpointId: appConfig.vertexAiEndpointId,
  };

  return new VertexAIClient(vertexAIConfig);
}

// Initialize security middleware
async function initializeSecurity() {
  await registerSecurity(fastify, {
    authentication: process.env.NODE_ENV === 'production',
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    },
  });
}

// Example route demonstrating an inference call
// Ví dụ về một route thực hiện lệnh gọi suy luận
fastify.post("/api/v1/agent-predict", async (request, reply) => {
  try {
    const vertexClient = await initializeVertexAI();
    const instancePayload = request.body; // Assume body contains the instance
    const predictions = await vertexClient.predict(instancePayload);

    // Log for compliance and analytics, respecting data privacy.
    // Ghi nhật ký để tuân thủ và phân tích, tôn trọng quyền riêng tư dữ liệu.
    fastify.log.info({
      message: "Prediction successful",
      endpointId: appConfig.vertexAiEndpointId,
    });

    return { success: true, predictions };
  } catch (error) {
    fastify.log.error(error); // The ADK client already logged details
    reply.status(500).send({
      success: false,
      message: "An error occurred during prediction.",
      error: error instanceof Error ? error.name : 'UnknownError', // e.g., 'PredictionAPIError'
    });
  }
});

console.log("AGENT LIB", runAgent);

fastify.register(healthRoutes);
fastify.register(agentsRoutes);

/**
 * Run the server!
 */
const start = async () => {
  try {
    // Initialize security first
    await initializeSecurity();
    
    // Start the server
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info('Server started successfully with security middleware enabled');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1); // Kết thúc tiến trình Node.js. 
  }
};

start();
=======
// --- Vertex AI Integration ---
const vertexAIConfig: VertexAIClientConfig = {
  project: process.env.GCP_PROJECT_ID || '324928471234',
  location: process.env.GCP_LOCATION || 'us-central1',
  endpointId: process.env.VERTEX_AI_ENDPOINT_ID || '839281723491823912',
  model: process.env.VERTEX_AI_MODEL || 'gemini-1.5-pro',
  apiKey: process.env.GOOGLE_API_KEY,
};

// Initialize agents and services
async function initializeAgents(): Promise<{ rootAgent: RootAgent; bqAgent: BigQueryAgent; contentAgent: ReturnType<typeof createContentAgent>; vertexClient: VertexAIClient; }> {
  fastify.log.info('Initializing ADK-based agents...');
  
  // Create vertex client
  vertexClient = new VertexAIClient(vertexAIConfig);
  
  // Create root agent
  rootAgent = createRootAgent();
  
  // Create and register sub-agents
  const bqAgent = createBqAgent();
  const contentAgent = createContentAgent();
  
  rootAgent.registerSubAgent('bigquery', bqAgent);
  rootAgent.registerSubAgent('content', contentAgent);
  
  fastify.log.info('✅ ADK agents initialized successfully');
  fastify.log.info({ msg: '📊 Available agents', agents: rootAgent.getAvailableAgents() });
  
  return { rootAgent, bqAgent, contentAgent, vertexClient };
}

// Initialize MCP service and start server
async function initializeApp() {
  try {
    console.log('Initializing MCP service...');
    await mcpService.initialize();
    console.log('✅ MCP service initialized successfully');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());

    // Initialize ADK agents
    await initializeAgents();

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(agentsRoutes);

    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      fastify.log.info(`🚀 ADK-powered Agents server listening at ${address}`);
      fastify.log.info(`📱 Available endpoints:`);
      fastify.log.info(`   GET  ${address}/health - Health check with agent status`);
      fastify.log.info(`   GET  ${address}/agents/status - Detailed agent status`);
      fastify.log.info(`   POST ${address}/start - Execute agent tasks`);
      fastify.log.info(`   POST ${address}/workflow - Execute multi-step workflows`);
      fastify.log.info(`   POST ${address}/api/v1/agent-predict - Legacy Vertex AI predictions`);
      fastify.log.info(`   POST ${address}/api/v1/generate-text - Text generation`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

initializeApp().catch(console.error);
>>>>>>> main
