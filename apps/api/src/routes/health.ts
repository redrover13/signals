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
    return reply.send({ status: 'ok' });
  });
}
