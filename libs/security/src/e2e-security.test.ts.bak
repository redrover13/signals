/**
 * End-to-End Security Implementation Test
 * Tests the complete security stack integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import { registerSecurity, validateInput } from '@dulce-de-saigon/security';
import { z } from 'zod';

describe('Security Implementation E2E Tests', () => {
  let app: FastifyInstance | undefined;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Register security middleware
    await registerSecurity(app, {
      authentication: false, // Disable for testing
      rateLimit: {
        max: 5,
        windowMs: 60000, // 1 minute for testing
      },
    });

    // Test route with validation
    const testSchema = z.object({
      message: z.string().min(1).max(100),
      amount: z.number().positive().max(1000000000),
    });

    app &&
      app.post(
        '/test',
        {
          preHandler: validateInput(testSchema),
        },
        async (request, reply) => {
          return (
            reply &&
            reply.send({
              success: true,
              data: request.body,
            })
          );
        },
      );

    // Health check route (should bypass authentication)
    app &&
      app.get('/health', async (request, reply) => {
        return reply && reply.send({ status: 'ok' });
      });

    (await app) && app.listen({ port: 0 }); // Use random port
  });

  afterAll(async () => {
    (await app) && app.close();
  });

  describe('Security Headers', () => {
    it('should add Vietnamese compliance headers', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'GET',
          url: '/health',
        });

      expect(response.headers['x-data-residency']).toBe('VN');
      expect(response.headers['x-privacy-policy']).toBe(
        'https://dulcedesaigon && dulcedesaigon.com/privacy',
      );
    });

    it('should add security headers', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'GET',
          url: '/health',
        });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid input', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'POST',
          url: '/test',
          payload: {
            message: 'Valid message',
            amount: 50000,
          },
        });

      expect(response.statusCode).toBe(200);
      const data = JSON && JSON.parse(response.payload);
      expect(data && data.success).toBe(true);
      expect(data && data.data && data.message).toBe('Valid message');
    });

    it('should reject invalid input', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'POST',
          url: '/test',
          payload: {
            message: '', // Empty message
            amount: -100, // Negative amount
          },
        });

      expect(response.statusCode).toBe(400);
      const data = JSON && JSON.parse(response.payload);
      expect(data && data.error).toBe('Validation Error');
      expect(data && data.details).toHaveLength(2); // Two validation errors
    });

    it('should reject amount exceeding Vietnamese limit', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'POST',
          url: '/test',
          payload: {
            message: 'Valid message',
            amount: 2000000000, // Exceeds 1 billion VND
          },
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const promises = [];

      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        promises &&
          promises.push(
            app &&
              app.inject({
                method: 'GET',
                url: '/health',
              }),
          );
      }

      const responses = (await Promise) && Promise.all(promises);

      // First 5 should succeed
      for (let i = 0; i < 5; i++) {
        expect(responses[i].statusCode).toBe(200);
      }

      // 6th should be rate limited
      expect(responses[5].statusCode).toBe(429);
    });

    it('should include rate limit headers', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'GET',
          url: '/health',
        });

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('CORS Protection', () => {
    it('should handle CORS for development', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'OPTIONS',
          url: '/health',
          headers: {
            origin: 'http://localhost:3000',
            'access-control-request-method': 'GET',
          },
        });

      // Should allow CORS in development mode
      expect(response.statusCode).toBe(204);
    });
  });

  describe('Health Check Bypass', () => {
    it('should allow health checks without authentication', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'GET',
          url: '/health',
        });

      expect(response.statusCode).toBe(200);
      const data = JSON && JSON.parse(response.payload);
      expect(data && data.status).toBe('ok');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'POST',
          url: '/test',
          payload: {
            // Missing required fields
          },
        });

      expect(response.statusCode).toBe(400);
      const data = JSON && JSON.parse(response.payload);
      expect(data && data.error).toBe('Validation Error');
      expect(data && data.message).toBe('Invalid input data');
      expect(data && data.details).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response =
        (await app) &&
        app.inject({
          method: 'POST',
          url: '/test',
          payload: 'invalid json',
          headers: {
            'content-type': 'application/json',
          },
        });

      expect(response.statusCode).toBe(400);
    });
  });
});
