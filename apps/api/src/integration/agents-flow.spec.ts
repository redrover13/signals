/**
 * @fileoverview Integration tests for agent task flow
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { agentsRoutes } from '../routes/agents';
import Fastify from 'fastify';

// Mock the entire flow to avoid actual GCP calls in tests
const mockPubSubMessages: any[] = [];
const mockBigQueryRows: any[] = [];

jest.mock('gcp-auth', () => ({
  getPubSub: jest.fn(() => ({
    topic: jest.fn(() => ({
      publishMessage: jest.fn(async (msg) => {
        mockPubSubMessages.push(msg);
        return {
          messageId: 'test-message-id-' + Date.now(),
          name: 'dulce.agents'
        };
      })
    }))
  })),
  getPubSubClient: jest.fn(() => ({
    subscription: jest.fn(() => ({
      on: jest.fn(),
    }))
  })),
  insertRows: jest.fn(async (table, rows) => {
    mockBigQueryRows.push(...rows);
    return Promise.resolve();
  })
}));

describe('Agent Task Flow Integration', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(agentsRoutes);
    // Clear mock data
    mockPubSubMessages.length = 0;
    mockBigQueryRows.length = 0;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('End-to-End Agent Task Processing', () => {
    it('should publish task to Pub/Sub with correct structure', async () => {
      const taskPayload = {
        task: 'analyze customer reviews',
        agentType: 'reviews-agent',
        priority: 'high'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/start',
        payload: taskPayload
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.ok).toBe(true);
      expect(body.status).toBe('published');

      // Verify the message was published to Pub/Sub
      expect(mockPubSubMessages).toHaveLength(1);
      const publishedMessage = mockPubSubMessages[0];
      
      expect(publishedMessage).toMatchObject({
        task: 'analyze customer reviews',
        agentType: 'reviews-agent',
        priority: 'high',
        source: 'api'
      });
      expect(publishedMessage.id).toMatch(/^task-\d+-[a-z0-9]+$/);
      expect(publishedMessage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle different agent types correctly', async () => {
      const agentTypes = [
        'gemini-orchestrator',
        'bq-agent', 
        'content-agent',
        'crm-agent',
        'reviews-agent'
      ];

      for (const agentType of agentTypes) {
        const response = await app.inject({
          method: 'POST',
          url: '/start',
          payload: {
            task: `test task for ${agentType}`,
            agentType,
            priority: 'normal'
          }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.ok).toBe(true);
      }

      // Verify all agent types were published
      expect(mockPubSubMessages).toHaveLength(agentTypes.length);
      agentTypes.forEach((agentType, index) => {
        expect(mockPubSubMessages[index].agentType).toBe(agentType);
      });
    });

    it('should publish with default values when fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/start',
        payload: { task: 'minimal task' }
      });

      expect(response.statusCode).toBe(200);
      
      // Verify default values were applied
      expect(mockPubSubMessages).toHaveLength(1);
      const publishedMessage = mockPubSubMessages[0];
      
      expect(publishedMessage).toMatchObject({
        task: 'minimal task',
        agentType: 'default',
        priority: 'normal',
        source: 'api'
      });
    });

    it('should handle completely empty payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/start',
        payload: {}
      });

      expect(response.statusCode).toBe(200);
      
      // Verify default values were applied
      expect(mockPubSubMessages).toHaveLength(1);
      const publishedMessage = mockPubSubMessages[0];
      
      expect(publishedMessage).toMatchObject({
        task: 'default task',
        agentType: 'default', 
        priority: 'normal',
        source: 'api'
      });
    });
  });

  describe('Error Handling', () => {
    it('should return proper error response when Pub/Sub fails', async () => {
      // Mock a failing pub/sub call
      const { getPubSub } = require('gcp-auth');
      getPubSub.mockImplementation(() => ({
        topic: () => ({
          publishMessage: jest.fn().mockRejectedValue(new Error('Connection timeout'))
        })
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
        message: 'Connection timeout'
      });
    });
  });
});