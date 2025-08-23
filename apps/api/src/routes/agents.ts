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
