import Fastify from "fastify";
import { runAgent } from "@dulce-de-saigon/agents-lib";
import { agentsRoutes } from "../../api/src/routes/agents";
import health from "../../api/src/routes/health";

const fastify = Fastify({
  logger: true,
});

console.log('AGENT LIB', runAgent);

fastify.register(health);
fastify.register(agentsRoutes);

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
