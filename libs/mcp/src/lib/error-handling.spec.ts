/**
 * Error handling and edge case tests for MCP functionality
 * Tests various failure scenarios, boundary conditions, and recovery mechanisms
 */

import { MCPService } from '../mcp.service';
import { testMCPConnectivity, validateMCPEnvironment } from '../utils/mcp-utils';

describe('MCP Error Handling Tests', () => {
  let mcpService: MCPService;
  let mockClientService: any;

  beforeEach(() => {
    // Reset singleton and create fresh mocks
    (MCPService as any).instance = undefined;
    mcpService = MCPService.getInstance();

    mockClientService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      sendRequest: jest.fn(),
      shutdown: jest.fn().mockResolvedValue(undefined),
    };

    (mcpService as any).clientService = mockClientService;
    (mcpService as any).isInitialized = true;
  });

  describe('Service Initialization Errors', () => {
    beforeEach(() => {
      (mcpService as any).isInitialized = false;
    });

    it('should handle missing configuration', async () => {
      mockClientService.initialize.mockRejectedValue(
        new Error('MCP configuration not found')
      );

      await expect(mcpService.initialize()).rejects.toThrow('MCP configuration not found');
      expect(mcpService.isReady()).toBe(false);
    });

    it('should handle invalid server configuration', async () => {
      mockClientService.initialize.mockRejectedValue(
        new Error('Invalid server endpoint: undefined')
      );

      await expect(mcpService.initialize()).rejects.toThrow('Invalid server endpoint');
    });

    it('should handle network connectivity issues during initialization', async () => {
      mockClientService.initialize.mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );

      await expect(mcpService.initialize()).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle authentication failures', async () => {
      mockClientService.initialize.mockRejectedValue(
        new Error('Authentication failed: Invalid credentials')
      );

      await expect(mcpService.initialize()).rejects.toThrow('Authentication failed');
    });

    it('should handle timeout during initialization', async () => {
      mockClientService.initialize.mockRejectedValue(
        new Error('Initialization timeout after 30000ms')
      );

      await expect(mcpService.initialize()).rejects.toThrow('Initialization timeout');
    });
  });

  describe('Request Handling Errors', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle malformed request parameters', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Invalid request: Missing required parameter "key"')
      );

      await expect(mcpService.memory('retrieve', {}))
        .rejects.toThrow('Missing required parameter');
    });

    it('should handle server-side validation errors', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Validation failed: Path must be absolute')
      );

      await expect(mcpService.fs('read', { path: 'relative/path.txt' }))
        .rejects.toThrow('Validation failed');
    });

    it('should handle permission denied errors', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('EACCES: Permission denied')
      );

      await expect(mcpService.fs('write', { path: '/root/file.txt', content: 'test' }))
        .rejects.toThrow('Permission denied');
    });

    it('should handle file not found errors', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('ENOENT: No such file or directory')
      );

      await expect(mcpService.fs('read', { path: '/nonexistent/file.txt' }))
        .rejects.toThrow('No such file or directory');
    });

    it('should handle disk space errors', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('ENOSPC: No space left on device')
      );

      await expect(mcpService.fs('write', { path: '/tmp/large-file.txt', content: 'x'.repeat(1000000) }))
        .rejects.toThrow('No space left on device');
    });
  });

  describe('Network and Connectivity Errors', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle connection timeout', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('ETIMEDOUT: Operation timed out')
      );

      await expect(mcpService.git('clone', { url: 'https://slow-server.com/repo.git' }))
        .rejects.toThrow('Operation timed out');
    });

    it('should handle connection refused', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );

      await expect(mcpService.memory('store', { key: 'test', value: 'data' }))
        .rejects.toThrow('Connection refused');
    });

    it('should handle DNS resolution failures', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('ENOTFOUND: getaddrinfo ENOTFOUND invalid-host')
      );

      await expect(mcpService.request('custom.operation', {}, { serverId: 'invalid-host' }))
        .rejects.toThrow('ENOTFOUND');
    });

    it('should handle network unreachable', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('ENETUNREACH: Network is unreachable')
      );

      await expect(mcpService.github('repos', { owner: 'test', repo: 'test' }))
        .rejects.toThrow('Network is unreachable');
    });

    it('should handle SSL/TLS certificate errors', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('CERT_UNTRUSTED: Certificate is not trusted')
      );

      await expect(mcpService.request('secure.operation'))
        .rejects.toThrow('Certificate is not trusted');
    });
  });

  describe('Server Response Errors', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle 400 Bad Request', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('HTTP 400: Bad Request - Invalid parameters')
      );

      await expect(mcpService.memory('retrieve', { invalidParam: 'test' }))
        .rejects.toThrow('Bad Request');
    });

    it('should handle 401 Unauthorized', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('HTTP 401: Unauthorized - Invalid API key')
      );

      await expect(mcpService.github('user'))
        .rejects.toThrow('Unauthorized');
    });

    it('should handle 403 Forbidden', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('HTTP 403: Forbidden - Access denied')
      );

      await expect(mcpService.github('repos', { owner: 'private', repo: 'secret' }))
        .rejects.toThrow('Forbidden');
    });

    it('should handle 404 Not Found', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('HTTP 404: Not Found - Resource does not exist')
      );

      await expect(mcpService.github('repos', { owner: 'nonexistent', repo: 'repo' }))
        .rejects.toThrow('Not Found');
    });

    it('should handle 429 Rate Limit', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('HTTP 429: Too Many Requests - Rate limit exceeded')
      );

      await expect(mcpService.github('search', { q: 'test' }))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should handle 500 Internal Server Error', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('HTTP 500: Internal Server Error - Server encountered an error')
      );

      await expect(mcpService.memory('store', { key: 'test', value: 'data' }))
        .rejects.toThrow('Internal Server Error');
    });

    it('should handle 503 Service Unavailable', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('HTTP 503: Service Unavailable - Server is temporarily unavailable')
      );

      await expect(mcpService.fs('read', { path: '/tmp/test.txt' }))
        .rejects.toThrow('Service Unavailable');
    });
  });

  describe('Data Validation Errors', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle invalid JSON responses', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('JSON Parse Error: Unexpected token in JSON at position 0')
      );

      await expect(mcpService.memory('retrieve', { key: 'test' }))
        .rejects.toThrow('JSON Parse Error');
    });

    it('should handle oversized responses', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Response too large: Exceeds maximum size of 10MB')
      );

      await expect(mcpService.fs('read', { path: '/tmp/huge-file.bin' }))
        .rejects.toThrow('Response too large');
    });

    it('should handle corrupted data', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Data corruption detected: Checksum mismatch')
      );

      await expect(mcpService.memory('retrieve', { key: 'corrupted-data' }))
        .rejects.toThrow('Data corruption detected');
    });

    it('should handle encoding errors', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Encoding error: Invalid UTF-8 sequence')
      );

      await expect(mcpService.fs('read', { path: '/tmp/binary-file.exe' }))
        .rejects.toThrow('Encoding error');
    });
  });

  describe('Resource Exhaustion Errors', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle memory exhaustion', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('ENOMEM: Cannot allocate memory')
      );

      await expect(mcpService.memory('store', { 
        key: 'large-data', 
        value: 'x'.repeat(1000000000) 
      })).rejects.toThrow('Cannot allocate memory');
    });

    it('should handle too many open files', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('EMFILE: Too many open files')
      );

      await expect(mcpService.fs('read', { path: '/tmp/test.txt' }))
        .rejects.toThrow('Too many open files');
    });

    it('should handle process limit exceeded', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('EAGAIN: Resource temporarily unavailable')
      );

      await expect(mcpService.node('spawn', { command: 'heavy-process' }))
        .rejects.toThrow('Resource temporarily unavailable');
    });

    it('should handle quota exceeded', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('EDQUOT: Disk quota exceeded')
      );

      await expect(mcpService.fs('write', { path: '/tmp/large-file.txt', content: 'data' }))
        .rejects.toThrow('Disk quota exceeded');
    });
  });

  describe('Concurrent Access Errors', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle file locking conflicts', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('EBUSY: Resource busy or locked')
      );

      await expect(mcpService.fs('write', { path: '/tmp/locked-file.txt', content: 'data' }))
        .rejects.toThrow('Resource busy or locked');
    });

    it('should handle database lock timeout', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Lock wait timeout exceeded; try restarting transaction')
      );

      await expect(mcpService.memory('store', { key: 'contested-key', value: 'data' }))
        .rejects.toThrow('Lock wait timeout exceeded');
    });

    it('should handle race condition in git operations', async () => {
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Another git process seems to be running in this repository')
      );

      await expect(mcpService.git('commit', { message: 'test commit' }))
        .rejects.toThrow('Another git process seems to be running');
    });
  });

  describe('Edge Case Boundary Testing', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle empty parameters', async () => {
      mockClientService.sendRequest.mockResolvedValue({ result: null });

      const result = await mcpService.memory('retrieve', {});
      expect(result.result).toBeNull();
    });

    it('should handle null values', async () => {
      mockClientService.sendRequest.mockResolvedValue({ result: null });

      const result = await mcpService.memory('store', { key: 'test', value: null });
      expect(result.result).toBeNull();
    });

    it('should handle very long string parameters', async () => {
      const longString = 'x'.repeat(1000000);
      mockClientService.sendRequest.mockRejectedValue(
        new Error('Parameter too long: Maximum length is 65536 characters')
      );

      await expect(mcpService.fs('write', { path: '/tmp/test.txt', content: longString }))
        .rejects.toThrow('Parameter too long');
    });

    it('should handle special characters in parameters', async () => {
      const specialChars = '!@#$%^&*()[]{}|\\:";\'<>?,./`~àáảãạăắằẳẵặâấầẩẫậ';
      mockClientService.sendRequest.mockResolvedValue({ result: { stored: true } });

      const result = await mcpService.memory('store', { 
        key: 'special-chars', 
        value: specialChars 
      });
      
      expect(result.result.stored).toBe(true);
    });

    it('should handle Unicode and emoji characters', async () => {
      const unicodeString = '🚀 Vietnamese: Chào bạn! 👋 Emoji: 😀🎉🎊';
      mockClientService.sendRequest.mockResolvedValue({ result: { stored: true } });

      const result = await mcpService.memory('store', { 
        key: 'unicode-test', 
        value: unicodeString 
      });
      
      expect(result.result.stored).toBe(true);
    });

    it('should handle deeply nested object parameters', async () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value'
              }
            }
          }
        }
      };
      
      mockClientService.sendRequest.mockResolvedValue({ result: { stored: true } });

      const result = await mcpService.memory('store', { 
        key: 'deep-object', 
        value: deepObject 
      });
      
      expect(result.result.stored).toBe(true);
    });

    it('should handle circular references in parameters', async () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Create circular reference

      mockClientService.sendRequest.mockRejectedValue(
        new Error('JSON serialization failed: Converting circular structure to JSON')
      );

      await expect(mcpService.memory('store', { key: 'circular', value: obj }))
        .rejects.toThrow('Converting circular structure to JSON');
    });
  });

  describe('Recovery and Fallback Mechanisms', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should demonstrate retry logic for transient errors', async () => {
      let attempts = 0;
      mockClientService.sendRequest.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary network error'));
        }
        return Promise.resolve({ result: { success: true } });
      });

      // Simulate retry logic (would need to be implemented in actual service)
      let result;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          result = await mcpService.memory('retrieve', { key: 'test' });
          break;
        } catch (error) {
          retries++;
          if (retries >= maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 100 * retries)); // Exponential backoff
        }
      }

      expect(result?.result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should handle graceful degradation when servers are unavailable', async () => {
      // Primary server fails
      mockClientService.sendRequest.mockImplementation((request) => {
        if (request.serverId === 'primary-memory') {
          return Promise.reject(new Error('Primary server unavailable'));
        }
        // Fallback server succeeds
        return Promise.resolve({ result: { value: 'fallback-data', source: 'fallback' } });
      });

      // Try primary, fall back to secondary
      let result;
      try {
        result = await mcpService.request('memory.retrieve', { key: 'test' }, { serverId: 'primary-memory' });
      } catch (error) {
        result = await mcpService.request('memory.retrieve', { key: 'test' }, { serverId: 'fallback-memory' });
      }

      expect(result.result.source).toBe('fallback');
    });
  });
});