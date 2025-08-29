<<<<<<< HEAD
import { FastifyInstance } from "fastify";
import { ensureTopic, getPubSub } from "@dulce/gcp";
import { validateInput } from "@dulce-de-saigon/security";
import { z } from "zod";

// Input validation schema for agent tasks
const agentTaskSchema = z.object({
  task: z.string()
    .min(1, "Task description is required")
    .max(1000, "Task description too long")
    .regex(/^[^<>]*$/, "Task cannot contain HTML tags"),
});

export async function agentsRoutes(app: FastifyInstance) {
  app.post(
    "/start",
    {
      preHandler: validateInput(agentTaskSchema),
    },
    async (req) => {
      const topicName = process.env.AGENTS_TOPIC || "dulce.agents";
      await ensureTopic();
      const topic = getPubSub().topic(topicName);
      const { task } = req.body as { task: string };
      const id = await topic.publishMessage({ 
        data: Buffer.from(JSON.stringify({ task })) 
      });
      return { ok: true, id, task };
    }
  );
}
=======
/**
 * @fileoverview agents module for the routes component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { FastifyInstance } from 'fastify';
import { getPubSub } from 'gcp-auth';

export async function agentsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/start', async (req, reply) => {
    try {
      const body = req.body as any;
      const task = body?.task ?? 'default task';
      const agentType = body?.agentType ?? 'default';
      const priority = body?.priority ?? 'normal';

      // Create task message
      const taskMessage = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        task,
        agentType,
        priority,
        timestamp: new Date().toISOString(),
        source: 'api'
      };

      // Publish to dulce.agents topic
      const pubsub = getPubSub();
      const result = await pubsub.topic('dulce.agents').publishMessage(taskMessage);

      console.log('Agent task published:', {
        taskId: taskMessage.id,
        messageId: result.messageId,
        task: taskMessage.task
      });

      return {
        ok: true,
        id: taskMessage.id,
        messageId: result.messageId,
        task: taskMessage.task,
        status: 'published'
      };
    } catch (error) {
      console.error('Failed to publish agent task:', error);
      reply.status(500);
      return {
        ok: false,
        error: 'Failed to publish task',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}
>>>>>>> main
