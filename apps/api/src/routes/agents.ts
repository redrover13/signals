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

export async function agentsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/start', async (req) => {
    const task = (req.body as any)?.task ?? 'default task';
    // TODO: Implement PubSub integration
    console.log('Agent task received:', task);
    const id = `task-${Date.now()}`;
    return { ok: true, id, task };
  });
}
>>>>>>> main
