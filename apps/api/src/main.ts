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
import { registerSecurity } from '@dulce-de-saigon/security';

// Dynamic import to avoid circular dependencies
let mcpService: any = null;

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

// Initialize MCP service with better error handling
async function initializeApp(): Promise<void> {
  try {
    console.log('🚀 Starting API server initialization...');

    // Initialize MCP service dynamically
    try {
      const mcpModule = await import('../../../libs/mcp/src/index.js');
      mcpService = mcpModule.mcpService;

      console.log('🔧 Initializing MCP service...');
      await mcpService.initialize();
      console.log('✅ MCP service initialized successfully');
      console.log('📊 Enabled servers:', mcpService.getEnabledServers());
    } catch (mcpError) {
      console.warn('⚠️  MCP service initialization failed, continuing without MCP:', mcpError.message);
      console.log('📋 Server will start without MCP functionality');
    }

    fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        fastify.log.error('❌ Failed to start server:', err);
        process.exit(1);
      }
      fastify.log.info(`🎉 API server listening at ${address}`);
      fastify.log.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('💥 Critical error during app initialization:', error);
    process.exit(1);
  }
}

initializeApp().catch(console.error);
