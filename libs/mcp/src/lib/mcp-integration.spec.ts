/**
 * Integration tests for MCP data pipeline
 * Tests end-to-end data flow, connectivity, and server integration
 */

import { MCPService } from '../mcp.service';
import { testMCPConnectivity, validateMCPEnvironment } from '../utils/mcp-utils';

describe('MCP Integration Tests', () => {
  let mcpService: MCPService;

  beforeAll(async () => {
    // Use a real MCP service instance for integration tests
    mcpService = MCPService.getInstance();
    
    // Mock external dependencies but allow internal MCP logic to run
    jest.setTimeout(60000); // Increase timeout for integration tests
  });

  afterAll(async () => {
    if (mcpService && mcpService.isReady()) {
      await mcpService.shutdown();
    }
  });

  describe('Environment Configuration', () => {
    it('should validate test environment configuration', () => {
      const validation = validateMCPEnvironment('test');
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      
      // In test environment, we should have some basic configuration
      if (!validation.valid) {
        console.warn('Configuration errors:', validation.errors);
        console.warn('Configuration warnings:', validation.warnings);
      }
    });

    it('should have required environment variables for test mode', () => {
      // Check for test-specific environment variables
      const testEnvVars = [
        'NODE_ENV',
        'MCP_ENVIRONMENT'
      ];

      testEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined();
      });
    });
  });

  describe('Server Connectivity', () => {
    it('should test MCP server connectivity', async () => {
      // Mock the client service for this test
      const mockClientService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        sendRequest: jest.fn().mockResolvedValue({ result: 'test' }),
      };

      const mockHealthService = {
        checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
      };

      // Replace the service internals for this test
      const originalClientService = (mcpService as any).clientService;
      const originalHealthService = (mcpService as any).healthService;
      
      (mcpService as any).clientService = mockClientService;
      (mcpService as any).healthService = mockHealthService;
      (mcpService as any).isInitialized = true;
      
      // Mock getEnabledServers
      jest.spyOn(mcpService, 'getEnabledServers').mockReturnValue(['memory', 'filesystem']);

      try {
        const connectivity = await testMCPConnectivity();
        
        expect(Array.isArray(connectivity)).toBe(true);
        
        if (connectivity.length > 0) {
          connectivity.forEach(result => {
            expect(result).toHaveProperty('serverId');
            expect(result).toHaveProperty('connected');
            expect(typeof result.connected).toBe('boolean');
            
            if (result.connected) {
              expect(result.responseTime).toBeGreaterThan(0);
            } else {
              expect(result.error).toBeDefined();
            }
          });
        }
      } finally {
        // Restore original services
        (mcpService as any).clientService = originalClientService;
        (mcpService as any).healthService = originalHealthService;
        (mcpService as any).isInitialized = false;
      }
    });

    it('should handle server connection failures gracefully', async () => {
      // Mock failing connectivity
      const mockClientService = {
        initialize: jest.fn().mockResolvedValue(undefined),
      };

      const mockHealthService = {
        checkHealth: jest.fn().mockRejectedValue(new Error('Connection timeout')),
      };

      (mcpService as any).clientService = mockClientService;
      (mcpService as any).healthService = mockHealthService;
      (mcpService as any).isInitialized = true;
      
      jest.spyOn(mcpService, 'getEnabledServers').mockReturnValue(['failing-server']);

      const connectivity = await testMCPConnectivity('failing-server');
      
      expect(connectivity).toHaveLength(1);
      expect(connectivity[0]).toEqual({
        serverId: 'failing-server',
        connected: false,
        error: 'Connection timeout'
      });
    });
  });

  describe('Data Pipeline Workflow', () => {
    let mockClientService: any;
    let mockHealthService: any;

    beforeEach(() => {
      // Setup mocks for data pipeline tests
      mockClientService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        sendRequest: jest.fn(),
        shutdown: jest.fn().mockResolvedValue(undefined),
      };

      mockHealthService = {
        checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
      };

      (mcpService as any).clientService = mockClientService;
      (mcpService as any).healthService = mockHealthService;
      (mcpService as any).isInitialized = true;
    });

    it('should complete memory storage workflow', async () => {
      // Mock successful memory operations
      mockClientService.sendRequest
        .mockResolvedValueOnce({ result: { stored: true } }) // store
        .mockResolvedValueOnce({ result: { key: 'test-data', value: { test: true } } }); // retrieve

      // 1. Store test data
      const storeResult = await mcpService.memory('store', { 
        key: 'test-data', 
        value: { test: true } 
      });
      
      expect(storeResult.result).toEqual({ stored: true });
      expect(mockClientService.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'memory.store',
          params: { key: 'test-data', value: { test: true } },
          serverId: 'memory'
        })
      );

      // 2. Retrieve stored data
      const retrieveResult = await mcpService.memory('retrieve', { key: 'test-data' });
      
      expect(retrieveResult.result.value.test).toBe(true);
      expect(mockClientService.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'memory.retrieve',
          params: { key: 'test-data' },
          serverId: 'memory'
        })
      );
    });

    it('should handle file system operations', async () => {
      // Mock file system operations
      mockClientService.sendRequest
        .mockResolvedValueOnce({ result: { written: true } }) // write
        .mockResolvedValueOnce({ result: { content: 'test content' } }); // read

      // 1. Write file
      const writeResult = await mcpService.fs('write', {
        path: '/tmp/test.txt',
        content: 'test content'
      });

      expect(writeResult.result).toEqual({ written: true });

      // 2. Read file
      const readResult = await mcpService.fs('read', {
        path: '/tmp/test.txt'
      });

      expect(readResult.result.content).toBe('test content');
    });

    it('should handle git operations workflow', async () => {
      // Mock git operations
      mockClientService.sendRequest
        .mockResolvedValueOnce({ result: { status: 'clean', branch: 'main' } }) // status
        .mockResolvedValueOnce({ result: { added: ['file.txt'] } }); // add

      // 1. Check git status
      const statusResult = await mcpService.git('status');
      
      expect(statusResult.result.status).toBe('clean');
      expect(statusResult.result.branch).toBe('main');

      // 2. Add files
      const addResult = await mcpService.git('add', { files: ['file.txt'] });
      
      expect(addResult.result.added).toContain('file.txt');
    });

    it('should handle multi-server data processing workflow', async () => {
      // Mock responses for different servers
      mockClientService.sendRequest
        .mockImplementation((request) => {
          switch (request.serverId) {
            case 'memory':
              return Promise.resolve({ result: { stored: true } });
            case 'filesystem':
              return Promise.resolve({ result: { written: true } });
            case 'git':
              return Promise.resolve({ result: { committed: true } });
            default:
              return Promise.resolve({ result: { success: true } });
          }
        });

      // Execute multi-server workflow
      const results = await Promise.all([
        mcpService.memory('store', { key: 'workflow-data', value: { step: 1 } }),
        mcpService.fs('write', { path: '/tmp/workflow.log', content: 'Step 1 complete' }),
        mcpService.git('add', { files: ['/tmp/workflow.log'] })
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].result.stored).toBe(true);
      expect(results[1].result.written).toBe(true);
      expect(results[2].result.committed).toBe(true);
    });
  });

  describe('Error Handling Scenarios', () => {
    let mockClientService: any;

    beforeEach(() => {
      mockClientService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        sendRequest: jest.fn(),
        shutdown: jest.fn().mockResolvedValue(undefined),
      };

      (mcpService as any).clientService = mockClientService;
      (mcpService as any).isInitialized = true;
    });

    it('should handle server timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockClientService.sendRequest.mockRejectedValue(timeoutError);

      await expect(mcpService.memory('retrieve', { key: 'test' }))
        .rejects.toThrow('Request timeout');
    });

    it('should handle server unavailable errors', async () => {
      const serverError = new Error('Server unavailable');
      serverError.name = 'ServerError';
      mockClientService.sendRequest.mockRejectedValue(serverError);

      await expect(mcpService.fs('read', { path: '/test' }))
        .rejects.toThrow('Server unavailable');
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('ECONNREFUSED');
      networkError.name = 'NetworkError';
      mockClientService.sendRequest.mockRejectedValue(networkError);

      await expect(mcpService.git('status'))
        .rejects.toThrow('ECONNREFUSED');
    });

    it('should handle invalid parameter errors', async () => {
      const paramError = new Error('Invalid parameters');
      paramError.name = 'ValidationError';
      mockClientService.sendRequest.mockRejectedValue(paramError);

      await expect(mcpService.memory('store', { invalidParam: true }))
        .rejects.toThrow('Invalid parameters');
    });

    it('should handle service initialization failures', async () => {
      (mcpService as any).isInitialized = false;
      mockClientService.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(mcpService.git('status'))
        .rejects.toThrow('Init failed');
    });
  });

  describe('Resilience and Fallback Scenarios', () => {
    let mockClientService: any;

    beforeEach(() => {
      mockClientService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        sendRequest: jest.fn(),
        shutdown: jest.fn().mockResolvedValue(undefined),
      };

      (mcpService as any).clientService = mockClientService;
      (mcpService as any).isInitialized = true;
    });

    it('should demonstrate resilient data retrieval pattern', async () => {
      // Simulate the resilient pattern from the documentation
      
      // First attempt fails (primary source)
      mockClientService.sendRequest
        .mockRejectedValueOnce(new Error('Primary source failed'))
        // Fallback 1 succeeds (cached data)
        .mockResolvedValueOnce({ result: { value: 'cached-data', source: 'cache' } });

      // Try primary source, then fallback to cache
      let result;
      try {
        result = await mcpService.memory('retrieve', { key: 'important-data' });
      } catch (error) {
        // Fallback to cache
        result = await mcpService.memory('retrieve', { key: 'cache-important-data' });
      }

      expect(result.result.value).toBe('cached-data');
      expect(result.result.source).toBe('cache');
    });

    it('should handle gradual degradation', async () => {
      // Simulate some servers working, others failing
      mockClientService.sendRequest.mockImplementation((request) => {
        if (request.serverId === 'failing-server') {
          return Promise.reject(new Error('Server down'));
        }
        return Promise.resolve({ result: { success: true } });
      });

      // Working server should succeed
      const workingResult = await mcpService.memory('store', { key: 'test', value: 'data' });
      expect(workingResult.result.success).toBe(true);

      // Failing server should throw
      await expect(
        mcpService.request('test.operation', {}, { serverId: 'failing-server' })
      ).rejects.toThrow('Server down');
    });
  });
});