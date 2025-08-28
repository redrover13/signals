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

/**
 * @swagger
 * /health:
 *   get:
 *     description: Health check endpoint
 *     responses:
 *       200:
 *         description: Returns a status of "ok"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async function (_request: FastifyRequest, reply: FastifyReply) {
    // Add logging to validate health check functionality
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    fastify.log.info('Health check requested', {
      timestamp,
      uptime: `${uptime}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      },
      timezone: 'Asia/Ho_Chi_Minh'
    });

    return reply.send({
      status: 'ok',
      timestamp,
      uptime,
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
      },
      timezone: 'Asia/Ho_Chi_Minh',
    });
  });
}
