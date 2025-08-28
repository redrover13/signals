/**
 * @fileoverview main module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import Fastify from 'fastify';
import { healthRoutes } from './routes/health';
import { agentsRoutes } from './routes/agents';
import { searchRoutes } from './routes/search';
import { mcpService } from '@nx-monorepo/mcp';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const fastify = Fastify({ logger: true });

fastify.register(healthRoutes, { prefix: '/health' });
fastify.register(agentsRoutes, { prefix: '/agents' });
fastify.register(searchRoutes, { prefix: '/search' });

// Initialize MCP service
async function initializeApp() {
  try {
    console.log('Initializing MCP service...');
    await mcpService.initialize();
    console.log('✅ MCP service initialized successfully');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());

    fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      fastify.log.info(`API server listening at ${address}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize MCP service:', error);
    process.exit(1);
  }
}

initializeApp().catch(console.error);
