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
