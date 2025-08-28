/**
 * @fileoverview agents module for the routes component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { FastifyInstance } from 'fastify';

export async function agentsRoutes(app: FastifyInstance) {
  app.post('/start', async (req) => {
    const task = (req.body as any)?.task ?? 'default task';
    // TODO: Implement PubSub integration
    console.log('Agent task received:', task);
    const id = `task-${Date.now()}`;
    return { ok: true, id, task };
  });
}
