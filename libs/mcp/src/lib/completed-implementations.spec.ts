/**
 * Test file to verify completed implementations
 */

import { createMCPClient, withErrorHandler, ErrorCategory, ErrorSeverity } from '../src/index';
import { ensureTopic, getPubSub } from '../../gcp/src/index';

describe('Completed Implementations', () => {
  describe('Error Handling', () => {
    it('should handle errors with standardized error handler', async () => {
      const result = await withErrorHandler(
        async () => {
          throw new Error('Network connection failed');
        },
        {
          function: 'test',
          file: 'test.spec.ts'
        },
        {
          maxRetries: 1,
          retryDelay: 100,
          fallbackAction: async () => {
            return { fallback: true };
          }
        }
      );

      expect(result).toEqual({ fallback: true });
    });

    it('should categorize errors correctly', async () => {
      const { categorizeError } = await import('../src/lib/utils/error-handler');
      
      expect(categorizeError(new Error('network timeout'))).toBe(ErrorCategory.NETWORK);
      expect(categorizeError(new Error('unauthorized access'))).toBe(ErrorCategory.AUTHENTICATION);
      expect(categorizeError(new Error('validation failed'))).toBe(ErrorCategory.VALIDATION);
      expect(categorizeError(new Error('timeout occurred'))).toBe(ErrorCategory.TIMEOUT);
    });
  });

  describe('MCP Utils', () => {
    it('should create MCP client', async () => {
      const client = await createMCPClient();
      expect(client).toBeDefined();
      expect(typeof client.isReady).toBe('function');
    });
  });

  describe('GCP Utils', () => {
    it('should have working PubSub implementation', () => {
      const pubsub = getPubSub();
      expect(pubsub).toBeDefined();
      expect(pubsub.topic).toBeDefined();
      expect(typeof pubsub.topic).toBe('function');
      
      const topic = pubsub.topic('test-topic');
      expect(topic.publishMessage).toBeDefined();
      expect(typeof topic.publishMessage).toBe('function');
    });

    it('should validate ensureTopic function exists', () => {
      expect(ensureTopic).toBeDefined();
      expect(typeof ensureTopic).toBe('function');
    });
  });
});