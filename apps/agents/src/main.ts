/**
 * Agents worker — Cloud Run service.
 * Subscribes to dulce.agents Pub/Sub topic.
 * Not deployed or enabled until you're ready.
 */

import { runAgent } from "@dulce/agents";

async function handleMessage(message: any) {
  console.log("Received agent task:", message);
  // Example: call runAgent with dummy config
  const output = await runAgent(message.task || "default task", {
    tools: {},
    complete: async (prompt) => `Echo: ${prompt}`
  });
  console.log("Agent output:", output);
}

export async function start() {
  console.log("Agents service starting (placeholder)");
  // Here you'd wire Pub/Sub subscription logic
}

if (require.main === module) {
  start().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
