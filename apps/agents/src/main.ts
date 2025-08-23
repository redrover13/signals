import Fastify from "fastify";
import { runAgent } from "@dulce-de-saigon/agents-lib";
import { agentsRoutes } from "../../api/src/routes/agents";
import { healthRoutes } from "../../api/src/routes/health";
import { VertexAIClient, VertexAIClientConfig } from "adk/services/vertex";
import { registerSecurity, loadAppConfig } from "@dulce-de-saigon/security";

const fastify = Fastify({
  logger: true,
});

// Load configuration asynchronously
let appConfig: Awaited<ReturnType<typeof loadAppConfig>>;

// --- Vertex AI Integration ---
// Configuration loaded securely from environment and Secret Manager
async function initializeVertexAI() {
  appConfig = await loadAppConfig();
  
  const vertexAIConfig: VertexAIClientConfig = {
    project: appConfig.gcpProjectId,
    location: appConfig.gcpLocation,
    endpointId: appConfig.vertexAiEndpointId,
  };

  return new VertexAIClient(vertexAIConfig);
}

// Initialize security middleware
async function initializeSecurity() {
  await registerSecurity(fastify, {
    authentication: process.env.NODE_ENV === 'production',
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    },
  });
}

// Example route demonstrating an inference call
// Ví dụ về một route thực hiện lệnh gọi suy luận
fastify.post("/api/v1/agent-predict", async (request, reply) => {
  try {
    const vertexClient = await initializeVertexAI();
    const instancePayload = request.body; // Assume body contains the instance
    const predictions = await vertexClient.predict(instancePayload);

    // Log for compliance and analytics, respecting data privacy.
    // Ghi nhật ký để tuân thủ và phân tích, tôn trọng quyền riêng tư dữ liệu.
    fastify.log.info({
      message: "Prediction successful",
      endpointId: appConfig.vertexAiEndpointId,
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
    // Initialize security first
    await initializeSecurity();
    
    // Start the server
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info('Server started successfully with security middleware enabled');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1); // Kết thúc tiến trình Node.js. 
  }
};

start();
