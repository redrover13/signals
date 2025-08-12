import Fastify from "fastify";
import { runAgent } from "@dulce-de-saigon/agents-lib";
import { agentsRoutes } from "../../api/src/routes/agents";
import { healthRoutes } from "../../api/src/routes/health";
import { VertexAIClient, VertexAIClientConfig } from "adk/services/vertex";

const fastify = Fastify({
  logger: true,
});

// --- Vertex AI Integration ---
// Configuration should come from environment variables, not be hardcoded.
// Cấu hình nên được lấy từ biến môi trường.
const vertexAIConfig: VertexAIClientConfig = {
  project: process.env.GCP_PROJECT_ID || "324928471234",
  location: process.env.GCP_LOCATION || "us-central1",
  endpointId: process.env.VERTEX_AI_ENDPOINT_ID || "839281723491823912",
};

const vertexClient = new VertexAIClient(vertexAIConfig);

// Example route demonstrating an inference call
// Ví dụ về một route thực hiện lệnh gọi suy luận
fastify.post("/api/v1/agent-predict", async (request, reply) => {
  try {
    const instancePayload = request.body; // Assume body contains the instance
    const predictions = await vertexClient.predict(instancePayload);

    // Log for compliance and analytics, respecting data privacy.
    // Ghi nhật ký để tuân thủ và phân tích, tôn trọng quyền riêng tư dữ liệu.
    fastify.log.info({
      message: "Prediction successful",
      endpointId: vertexAIConfig.endpointId,
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
    await fastify.listen({ port: 3000 }); // Because you have "bind: '0.0.0.0'" in your ecosystem.config, Fastify will bind to all available network interfaces for your service. Note that in production, localhost (127.0.0.1) does not refer to the local machine for external network services like load balancers or Kubernetes services. They won't route to it.
  } catch (err) {
    fastify.log.error(err);
    process.exit(1); // Kết thúc tiến trình Node.js. 
  }
};
start();
