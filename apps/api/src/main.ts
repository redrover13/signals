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
<<<<<<< HEAD
import { 
  initializeOpenTelemetry, 
  withSpan, 
  logEvent, 
  instrument 
} from '@nx-monorepo/utils/monitoring';

// Initialize OpenTelemetry before any other imports
initializeOpenTelemetry({
  serviceName: 'dulce-de-saigon-api',
  serviceVersion: '1.0.0',
  gcpProjectId: process.env.GCP_PROJECT_ID,
  enableAutoInstrumentation: true,
  enableCustomExporter: true,
  enableBigQueryLogs: true,
}).catch(console.error);
=======
import { registerSecurity } from '@dulce-de-saigon/security';
>>>>>>> main

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

<<<<<<< HEAD
// Instrument the initialization function
const instrumentedInitialize = instrument('api-initialization', async () => {
  console.log('🚀 Starting API server initialization...');

  // Initialize MCP service dynamically
  try {
    const mcpModule = await import('../../../libs/mcp/src/index.js');
    mcpService = mcpModule.mcpService;

    console.log('🔧 Initializing MCP service...');
    await mcpService.initialize();
    console.log('✅ MCP service initialized successfully');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());

    await logEvent('mcp_service_initialized', {
      enabledServers: mcpService.getEnabledServers(),
    });
  } catch (mcpError) {
    console.warn('⚠️  MCP service initialization failed, continuing without MCP:', mcpError.message);
    console.log('📋 Server will start without MCP functionality');
    
    await logEvent('mcp_service_initialization_failed', {
      error: mcpError.message,
    }, 'warn');
  }

  fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      fastify.log.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    fastify.log.info(`🎉 API server listening at ${address}`);
    fastify.log.info(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}, {
  attributes: {
    'service.component': 'api',
    'service.initialization': true,
  }
});

=======
<<<<<<< HEAD
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
=======
>>>>>>> main
// Initialize MCP service with better error handling
async function initializeApp(): Promise<void> {
  try {
    await logEvent('app_startup', { 
      service: 'dulce-de-saigon-api',
      version: '1.0.0',
      port: PORT,
    });

    await instrumentedInitialize();
  } catch (error) {
    console.error('💥 Critical error during app initialization:', error);
    
    await logEvent('app_startup_error', { 
      service: 'dulce-de-saigon-api',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'error');
    
    process.exit(1);
  }
}

initializeApp().catch(console.error);
>>>>>>> main
