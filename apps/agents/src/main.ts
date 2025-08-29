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
<<<<<<< HEAD
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
=======
import { getPubSubClient, insertRows } from 'gcp-auth';

// Global agent instances
let rootAgent: RootAgent;
let vertexClient: VertexAIClient;
>>>>>>> main

// Local route implementations for agents project
async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply) => {
<<<<<<< HEAD
    return withSpan('health-check', async (span) => {
      span.setAttributes({
        'http.method': 'GET',
        'http.route': '/health',
        'service.component': 'agents',
      });

      await logEvent('health_check', { status: 'ok' });
      
      return { status: 'ok', timestamp: new Date().toISOString() };
    }, { kind: SpanKind.SERVER });
=======
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
>>>>>>> main
  });
}

async function agentsRoutes(fastify: FastifyInstance) {
  // Instrument the start endpoint
  fastify.post('/start', async (request: FastifyRequest, reply) => {
<<<<<<< HEAD
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
=======
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
>>>>>>> main
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

<<<<<<< HEAD
        await logEvent('prediction_request', { 
          endpointId: vertexAIConfig.endpointId,
          payloadSize: JSON.stringify(instancePayload).length,
        });
=======
      fastify.log.info({
        message: 'Prediction successful',
        config: vertexClient.getConfig(),
      });
>>>>>>> main

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

// --- Agent Runner Service ---
// Define task/result types for each agent
type GeminiTask = { prompt: string; context?: any };
type GeminiResult = { response: string; metadata?: any };

type BigQueryTask = { query: string; params?: any[] };
type BigQueryResult = { rows: any[]; schema?: any };

type ContentTask = { contentId: string; action: string; data?: any };
type ContentResult = { success: boolean; details?: any };

type CRMTask = { customerId: string; operation: string; payload?: any };
type CRMResult = { status: string; data?: any };

type ReviewsTask = { reviewId: string; action: string; payload?: any };
type ReviewsResult = { updated: boolean; review?: any };

type DefaultTask = any;
type DefaultResult = any;

// Union types for all agent tasks/results
type AgentTaskPayload =
  | GeminiTask
  | BigQueryTask
  | ContentTask
  | CRMTask
  | ReviewsTask
  | DefaultTask;

type AgentResultPayload =
  | GeminiResult
  | BigQueryResult
  | ContentResult
  | CRMResult
  | ReviewsResult
  | DefaultResult;

interface AgentTask<TTask = AgentTaskPayload> {
  id: string;
  task: TTask;
  agentType: string;
  priority: string;
  timestamp: string;
  source: string;
}

interface AgentRun<TTask = AgentTaskPayload, TResult = AgentResultPayload> {
  id: string;
  agent_type: string;
  task: TTask;
  status: 'started' | 'completed' | 'failed';
  result?: TResult;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

async function processAgentTask<TTask = AgentTaskPayload, TResult = AgentResultPayload>(taskMessage: AgentTask<TTask>): Promise<AgentRun<TTask, TResult>> {
  const run: AgentRun<TTask, TResult> = {
    id: taskMessage.id,
    agent_type: taskMessage.agentType,
    task: taskMessage.task,
    status: 'started',
    started_at: new Date().toISOString()
  };

  try {
    console.log(`Processing agent task: ${taskMessage.id} (${taskMessage.agentType})`);
    
    // Route to appropriate agent based on agent type
    let result;
    switch (taskMessage.agentType) {
      case 'gemini-orchestrator':
        result = await processGeminiTask(taskMessage.task);
        break;
      case 'bq-agent':
        result = await processBigQueryTask(taskMessage.task);
        break;
      case 'content-agent':
        result = await processContentTask(taskMessage.task);
        break;
      case 'crm-agent':
        result = await processCRMTask(taskMessage.task);
        break;
      case 'reviews-agent':
        result = await processReviewsTask(taskMessage.task);
        break;
      default:
        result = await processDefaultTask(taskMessage.task);
    }

    run.status = 'completed';
    run.result = result;
    run.completed_at = new Date().toISOString();

    console.log(`Agent task completed: ${taskMessage.id}`);
  } catch (error) {
    run.status = 'failed';
    run.error_message = error instanceof Error ? error.message : 'Unknown error';
    run.completed_at = new Date().toISOString();
    
    console.error(`Agent task failed: ${taskMessage.id}`, error);
  }

  // Log to BigQuery for observability
  try {
    await insertRows('dulce.agent_runs', [run]);
  } catch (error) {
    console.error('Failed to log agent run to BigQuery:', error);
  }

  return run;
}
const subscriptionName = process.env.AGENTS_SUBSCRIPTION || 'dulce-agents-sub';
const subscription = pubsub.subscription(subscriptionName);

console.log(`Starting agent runner subscription: ${subscriptionName}...`);

  return { type: 'gemini', result: `Processed Gemini task: ${JSON.stringify(task)}` };
    try {
      const raw = message.data?.toString();
      if (!raw) {
        console.error('Received message with no data');
        message.ack();
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.id || !parsed?.agentType) {
        console.error('Invalid task message structure:', parsed);
        message.ack();
        return;
      }
      const taskMessage: AgentTask = parsed;
      await processAgentTask(taskMessage);
  // Placeholder for BigQuery agent logic
  return { type: 'bigquery', result: `Processed BigQuery task: ${JSON.stringify(task)}` };
}

async function processContentTask(task: any): Promise<any> {
  // Placeholder for content agent logic
  return { type: 'content', result: `Processed content task: ${JSON.stringify(task)}` };
}

async function processCRMTask(task: any): Promise<any> {
  // Placeholder for CRM agent logic
  return { type: 'crm', result: `Processed CRM task: ${JSON.stringify(task)}` };
}

async function processReviewsTask(task: any): Promise<any> {
  // Placeholder for reviews agent logic
  return { type: 'reviews', result: `Processed reviews task: ${JSON.stringify(task)}` };
}

async function processDefaultTask(task: any): Promise<any> {
  // Default task processor
  return { type: 'default', result: `Processed default task: ${JSON.stringify(task)}` };
}

// Agent Runner Subscription
async function startAgentRunner() {
  try {
    const pubsub = getPubSubClient();
    const subscription = pubsub.subscription('dulce-agents-sub');
    
    console.log('Starting agent runner subscription...');
    
    subscription.on('message', async (message) => {
      try {
        const taskMessage: AgentTask = JSON.parse(message.data.toString());
        await processAgentTask(taskMessage);
        message.ack();
      } catch (error) {
        console.error('Error processing message:', error);
        message.nack();
      }
    });

    subscription.on('error', (error) => {
      console.error('Subscription error:', error);
    });

    console.log('✅ Agent runner subscription started');
  } catch (error) {
    console.error('❌ Failed to start agent runner:', error);
  }
}

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
<<<<<<< HEAD
    await logEvent('app_startup', { 
      service: 'dulce-de-saigon-agents',
      version: '1.0.0',
=======
    console.log('Initializing MCP service...');
    await mcpService.initialize();
    console.log('✅ MCP service initialized successfully');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());

<<<<<<< HEAD
    // Start agent runner subscription
    await startAgentRunner();
=======
    // Initialize ADK agents
    await initializeAgents();
>>>>>>> main

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
>>>>>>> main
    });

    await instrumentedInitialize();
  } catch (error) {
<<<<<<< HEAD
    console.error('❌ Failed to initialize MCP service:', error);
    
    await logEvent('app_startup_error', { 
      service: 'dulce-de-saigon-agents',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'error');
    
=======
    console.error('❌ Failed to initialize application:', error);
>>>>>>> main
    process.exit(1);
  }
}

initializeApp().catch(console.error);
>>>>>>> main
