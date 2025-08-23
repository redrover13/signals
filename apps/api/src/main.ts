import Fastify from 'fastify';
import { healthRoutes } from './routes/health';
import { agentsRoutes } from './routes/agents';
import { searchRoutes } from './routes/search';
import { registerSecurity } from '@dulce-de-saigon/security';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const fastify = Fastify({ logger: true });

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

fastify.register(healthRoutes, { prefix: '/health' });
fastify.register(agentsRoutes, { prefix: '/agents' });
fastify.register(searchRoutes, { prefix: '/search' });

const start = async () => {
  try {
    // Initialize security first
    await initializeSecurity();
    
    // Start the server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`API server listening at port ${PORT} with security middleware enabled`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
