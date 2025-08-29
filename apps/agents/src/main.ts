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
import { getPubSubClient, insertRows } from 'gcp-auth';

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
      reply.status(500).send({
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
  project: process.env.GCP_PROJECT_ID || '324928471234',
  location: process.env.GCP_LOCATION || 'us-central1',
  endpointId: process.env.VERTEX_AI_ENDPOINT_ID || '839281723491823912',
};

const vertexClient = new VertexAIClient(vertexAIConfig);

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

// Agent task processors
async function processGeminiTask(task: any): Promise<any> {
  // Placeholder for Gemini orchestrator logic
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

// Initialize MCP service and start server
async function initializeApp() {
  try {
    console.log('Initializing MCP service...');
    await mcpService.initialize();
    console.log('✅ MCP service initialized successfully');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());

    // Start agent runner subscription
    await startAgentRunner();

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
  } catch (error) {
    console.error('❌ Failed to initialize MCP service:', error);
    process.exit(1);
  }
}

initializeApp().catch(console.error);
