import { FastifyInstance } from "fastify";
import { getPubSub } from "@/gcp";

export async function agentsRoutes(app: FastifyInstance) {
  app.post("/start", async (req) => {
    const topicName = process.env.AGENTS_TOPIC || "signals.agents";
    const topic = getPubSub().topic(topicName);
    const task = (req.body as any)?.task ?? "default task";
    const id = await topic.publishMessage({ data: Buffer.from(JSON.stringify({ task })) });
    return { ok: true, id };
  });
}
