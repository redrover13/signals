import { FastifyInstance } from "fastify";
import { ensureTopic, getPubSub } from "@dulce/gcp";

export async function agentsRoutes(app: FastifyInstance) {
  app.post("/start", async (req) => {
    const topicName = process.env.AGENTS_TOPIC || "dulce.agents";
    await ensureTopic();
    const topic = getPubSub().topic(topicName);
    const task = (req.body as any)?.task ?? "Plan a content calendar for Dulce de Saigon";
    const id = await topic.publishMessage({ data: Buffer.from(JSON.stringify({ task })) });
    return { ok: true, id };
  });
}
