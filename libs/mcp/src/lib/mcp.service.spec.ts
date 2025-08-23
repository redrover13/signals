/**
 * Unit tests for MCPService
 * Tests core MCP functionality including operations, error handling, and integration points
 */

import { MCPService } from './mcp.service';
import { MCPClientService } from './clients/mcp-client.service';
import { ServerHealthService } from './clients/server-health.service';
import { RequestRouter } from './clients/request-router.service';

// Mock the dependencies
jest.mock('./clients/mcp-client.service');
jest.mock('./clients/server-health.service');
jest.mock('./clients/request-router.service');
jest.mock('./config/environment-config');

describe('MCPService', () => {
  let service: MCPService;
  let mockClientService: jest.Mocked<MCPClientService>;
  let mockHealthService: jest.Mocked<ServerHealthService>;
  let mockRequestRouter: jest.Mocked<RequestRouter>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset singleton instance
    (MCPService as any).instance = undefined;
    
    // Create mocked instances
    mockClientService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      sendRequest: jest.fn().mockResolvedValue({ result: 'mocked-result' }),
      shutdown: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockHealthService = {
      getServerHealthStats: jest.fn().mockReturnValue({ healthy: true }),
      getAllHealthStats: jest.fn().mockReturnValue(new Map()),
      checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
    } as any;

    mockRequestRouter = {
      route: jest.fn(),
    } as any;

    // Mock constructors
    (MCPClientService as jest.MockedClass<typeof MCPClientService>).mockImplementation(() => mockClientService);
    (ServerHealthService as jest.MockedClass<typeof ServerHealthService>).mockImplementation(() => mockHealthService);
    (RequestRouter as jest.MockedClass<typeof RequestRouter>).mockImplementation(() => mockRequestRouter);

    service = MCPService.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = MCPService.getInstance();
      const instance2 = MCPService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = MCPService.getInstance();
      (MCPService as any).instance = undefined;
      const instance2 = MCPService.getInstance();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      
      expect(mockClientService.initialize).toHaveBeenCalledTimes(1);
      expect(service.isReady()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await service.initialize();
      await service.initialize();
      
      expect(mockClientService.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockClientService.initialize.mockRejectedValue(error);
      
      await expect(service.initialize()).rejects.toThrow('Initialization failed');
      expect(service.isReady()).toBe(false);
    });
  });

  describe('Core Operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    describe('Git Operations', () => {
      it('should handle git status operation', async () => {
        const mockResponse = { result: { status: 'clean' } };
        mockClientService.sendRequest.mockResolvedValue(mockResponse);

        const result = await service.git('status');

        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'git.status',
            serverId: 'git',
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should handle git operations with parameters', async () => {
        const params = { branch: 'main' };
        await service.git('checkout', params);

        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'git.checkout',
            params,
            serverId: 'git',
          })
        );
      });
    });

    describe('Memory Operations', () => {
      it('should handle memory store operation', async () => {
        const params = { key: 'test-key', value: 'test-value' };
        await service.memory('store', params);

        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'memory.store',
            params,
            serverId: 'memory',
          })
        );
      });

      it('should handle memory retrieve operation', async () => {
        const params = { key: 'test-key' };
        const mockResponse = { result: { value: 'test-value' } };
        mockClientService.sendRequest.mockResolvedValue(mockResponse);

        const result = await service.memory('retrieve', params);

        expect(result).toEqual(mockResponse);
        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'memory.retrieve',
            params,
            serverId: 'memory',
          })
        );
      });
    });

    describe('File System Operations', () => {
      it('should handle fs read operation', async () => {
        const params = { path: '/test/file.txt' };
        await service.fs('read', params);

        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'fs.read',
            params,
            serverId: 'filesystem',
          })
        );
      });

      it('should handle fs write operation', async () => {
        const params = { path: '/test/file.txt', content: 'test content' };
        await service.fs('write', params);

        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'fs.write',
            params,
            serverId: 'filesystem',
          })
        );
      });
    });

    describe('Sequential Thinking Operations', () => {
      it('should handle think operation with prompt', async () => {
        const prompt = 'Test thinking prompt';
        await service.think(prompt);

        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'think.analyze',
            params: { prompt },
            serverId: 'sequentialthinking',
          })
        );
      });

      it('should handle think operation with options', async () => {
        const prompt = 'Test thinking prompt';
        const options = { maxThoughts: 5 };
        await service.think(prompt, options);

        expect(mockClientService.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'think.analyze',
            params: { prompt, maxThoughts: 5 },
            serverId: 'sequentialthinking',
          })
        );
      });
    });
  });

  describe('Request Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should generate unique request IDs', async () => {
      const calls: any[] = [];
      mockClientService.sendRequest.mockImplementation((request) => {
        calls.push(request);
        return Promise.resolve({ result: 'test' });
      });

      await service.request('test.method');
      await service.request('test.method');

      expect(calls).toHaveLength(2);
      expect(calls[0].id).not.toEqual(calls[1].id);
      expect(calls[0].id).toMatch(/^req-\d+-[a-z0-9]+$/);
    });

    it('should handle request options', async () => {
      const options = {
        serverId: 'custom-server',
        timeout: 5000,
        retries: 3,
      };

      await service.request('test.method', { param: 'value' }, options);

      expect(mockClientService.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'test.method',
          params: { param: 'value' },
          serverId: 'custom-server',
          timeout: 5000,
          retries: 3,
        })
      );
    });

    it('should auto-initialize if not ready', async () => {
      const newService = MCPService.getInstance();
      (newService as any).isInitialized = false;

      await newService.request('test.method');

      expect(mockClientService.initialize).toHaveBeenCalled();
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get server health for specific server', () => {
      const mockHealth = { healthy: true, responseTime: 100 };
      mockHealthService.getServerHealthStats.mockReturnValue(mockHealth);

      const health = service.getServerHealth('test-server');

      expect(mockHealthService.getServerHealthStats).toHaveBeenCalledWith('test-server');
      expect(health).toEqual(mockHealth);
    });

    it('should get all server health when no server specified', () => {
      const mockHealthMap = new Map([['server1', { healthy: true }]]);
      mockHealthService.getAllHealthStats.mockReturnValue(mockHealthMap);

      const health = service.getServerHealth();

      expect(mockHealthService.getAllHealthStats).toHaveBeenCalled();
      expect(health).toEqual(mockHealthMap);
    });

    it('should check server health', async () => {
      const mockHealthResult = { healthy: true, error: null };
      mockHealthService.checkHealth.mockResolvedValue(mockHealthResult);

      const result = await service.checkHealth('test-server');

      expect(mockHealthService.checkHealth).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockHealthResult);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should propagate client service errors', async () => {
      const error = new Error('Network error');
      mockClientService.sendRequest.mockRejectedValue(error);

      await expect(service.git('status')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockClientService.sendRequest.mockRejectedValue(timeoutError);

      await expect(service.memory('retrieve', { key: 'test' })).rejects.toThrow('Request timeout');
    });

    it('should handle server unavailable errors', async () => {
      const serverError = new Error('Server unavailable');
      serverError.name = 'ServerError';
      mockClientService.sendRequest.mockRejectedValue(serverError);

      await expect(service.fs('read', { path: '/test' })).rejects.toThrow('Server unavailable');
    });
  });

  describe('Utility Methods', () => {
    it('should check if service is ready', async () => {
      expect(service.isReady()).toBe(false);
      
      await service.initialize();
      
      expect(service.isReady()).toBe(true);
    });

    it('should shutdown properly', async () => {
      await service.initialize();
      await service.shutdown();

      expect(mockClientService.shutdown).toHaveBeenCalled();
      expect(service.isReady()).toBe(false);
    });
  });
});