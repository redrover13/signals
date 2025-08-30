/**
 * @fileoverview Tests for agents routes
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { agentsRoutes } from './agents';
import Fastify from 'fastify';

// Mock the GCP client to avoid actual GCP calls in tests
jest.mock('gcp-auth', () => ({
  getPubSub: jest.fn(() => ({
    topic: jest.fn(() => ({
      publishMessage: jest.fn(async (msg) => ({
        messageId: 'test-message-id-' + Date.now(),
        name: 'dulce.agents'
      }))
    }))
  }))
}));

describe('Agents Routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(agentsRoutes);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /start', () => {
    it('should publish agent task to Pub/Sub and return task details', async () => {
      const taskPayload = {
        task: 'test task',
        agentType: 'test-agent',
        priority: 'high'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/start',
        payload: taskPayload
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body).toMatchObject({
        ok: true,
        status: 'published'
      });
      expect(body.id).toMatch(/^task-\d+-[a-z0-9]+$/);
      expect(body.messageId).toMatch(/^test-message-id-\d+$/);
      expect(body.task).toBe(taskPayload.task);
    });

    it('should handle default values for missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/start',
        payload: {}
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body).toMatchObject({
        ok: true,
        task: 'default task',
        status: 'published'
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock a failing pub/sub call
      jest.mock('gcp-auth', () => ({
        getPubSub: jest.fn(() => ({
          topic: () => ({
            publishMessage: jest.fn().mockRejectedValue(new Error('Pub/Sub error'))
          })
        }))
      }));

      const response = await app.inject({
        method: 'POST',
        url: '/start',
        payload: { task: 'test task' }
      });

      expect(response.statusCode).toBe(500);
      
      const body = JSON.parse(response.payload);
      expect(body).toMatchObject({
        ok: false,
        error: 'Failed to publish task',
        message: 'Pub/Sub error'
      });
    });
  });
});