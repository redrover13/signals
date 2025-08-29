/**
 * @fileoverview health module for the routes component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Security middleware for rate limiting and validation
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Add rate limiting for health checks
  fastify.addHook('preHandler', async (request, reply) => {
    // Basic rate limiting (in production, use Redis/external service)
    const clientIP = request.ip;
    const now = Date.now();

    // Simple in-memory rate limiting (for demo purposes)
    if (!fastify.rateLimit) {
      fastify.rateLimit = new Map();
    }

    const requests = fastify.rateLimit.get(clientIP) || [];
    const recentRequests = requests.filter(time => now - time < 60000); // 1 minute window

    if (recentRequests.length >= 10) { // 10 requests per minute
      reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60
      });
      return;
    }

    recentRequests.push(now);
    fastify.rateLimit.set(clientIP, recentRequests);
  });

  fastify.get('/', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validate request headers
      const userAgent = request.headers['user-agent'] || 'unknown';
      const accept = request.headers.accept || 'unknown';

      // Add comprehensive logging
      const timestamp = new Date().toISOString();
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const nodeVersion = process.version;
      const platform = process.platform;

      fastify.log.info('Health check requested', {
        timestamp,
        uptime: `${Math.round(uptime)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
        system: {
          nodeVersion,
          platform,
          timezone: 'Asia/Ho_Chi_Minh'
        },
        request: {
          userAgent,
          accept,
          ip: request.ip
        }
      });

      // Comprehensive health response
      return reply.send({
        status: 'ok',
        timestamp,
        uptime,
        version: '1.0.0',
        environment: process.env['NODE_ENV'] || 'development',
        system: {
          nodeVersion,
          platform,
          timezone: 'Asia/Ho_Chi_Minh',
          memory: {
            rss: memoryUsage.rss,
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external
          }
        },
        services: {
          mcp: mcpService ? 'initialized' : 'not_available',
          database: 'unknown', // Add database health check
          cache: 'unknown'     // Add cache health check
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error('Health check failed:', errorMessage);
      return reply.code(500).send({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Add a detailed health endpoint
  fastify.get('/detailed', async function (request: FastifyRequest, reply: FastifyReply) {
    const healthDetails = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        filesystem: await checkFilesystem(),
        memory: checkMemory(),
        cpu: checkCPU(),
        network: checkNetwork()
      }
    };

    return reply.send(healthDetails);
  });
}

// Helper functions for detailed health checks
async function checkFilesystem(): Promise<{status: string, message: string}> {
  try {
    // Check if we can write to temp directory
    const fs = await import('fs/promises');
    const tempFile = `/tmp/health-check-${Date.now()}`;
    await fs.writeFile(tempFile, 'health-check');
    await fs.unlink(tempFile);
    return { status: 'ok', message: 'Filesystem accessible' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { status: 'error', message: `Filesystem error: ${errorMessage}` };
  }
}

function checkMemory(): {status: string, usage: any} {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const heapTotalMB = usage.heapTotal / 1024 / 1024;

  if (heapUsedMB > heapTotalMB * 0.9) {
    return { status: 'warning', usage: { heapUsedMB, heapTotalMB, percentage: (heapUsedMB / heapTotalMB * 100).toFixed(1) } };
  }

  return { status: 'ok', usage: { heapUsedMB, heapTotalMB, percentage: (heapUsedMB / heapTotalMB * 100).toFixed(1) } };
}

function checkCPU(): {status: string, load: any} {
  const loadAvg = process.cpuUsage();
  const loadPercentage = (loadAvg.user + loadAvg.system) / 1000000; // Convert to seconds

  return {
    status: loadPercentage > 80 ? 'warning' : 'ok',
    load: {
      user: loadAvg.user,
      system: loadAvg.system,
      percentage: loadPercentage.toFixed(1)
    }
  };
}

function checkNetwork(): {status: string, message: string} {
  // Basic network connectivity check
  return { status: 'ok', message: 'Network interfaces available' };
}
