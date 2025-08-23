/**
 * Unit tests for MCP Utility Functions
 * Tests helper functions for MCP configuration, validation, and health monitoring
 */

import * as fs from 'fs';
import { 
  createMCPClient,
  getMCPConfig,
  validateMCPEnvironment,
  testMCPConnectivity,
  getMCPHealthSummary,
  exportMCPConfig,
  importMCPConfig,
  getMCPMetrics
} from './mcp-utils';
import { MCPService } from '../mcp.service';
import * as environmentConfig from '../config/environment-config';

// Mock dependencies
jest.mock('fs');
jest.mock('../mcp.service');
jest.mock('../config/environment-config');

describe('MCP Utils', () => {
  let mockMCPService: jest.Mocked<MCPService>;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock MCP Service
    mockMCPService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      isReady: jest.fn().mockReturnValue(true),
      getEnabledServers: jest.fn().mockReturnValue(['git', 'memory', 'filesystem']),
      checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
      getSystemHealth: jest.fn().mockReturnValue({
        totalServers: 3,
        healthyServers: 3,
        unhealthyServers: 0,
        criticalServers: 0,
        averageUptime: 99.9
      }),
      getRoutingStats: jest.fn().mockReturnValue({
        loadStats: new Map([
          ['git', 10],
          ['memory', 15],
          ['filesystem', 5]
        ])
      })
    } as any;

    (MCPService.getInstance as jest.Mock).mockReturnValue(mockMCPService);
  });

  describe('createMCPClient', () => {
    it('should create and initialize MCP client', async () => {
      const client = await createMCPClient();

      expect(MCPService.getInstance).toHaveBeenCalled();
      expect(mockMCPService.initialize).toHaveBeenCalled();
      expect(client).toBe(mockMCPService);
    });

    it('should handle initialization errors', async () => {
      mockMCPService.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(createMCPClient()).rejects.toThrow('Init failed');
    });
  });

  describe('getMCPConfig', () => {
    it('should return current configuration', () => {
      const mockConfig = { 
        environment: 'test' as const,
        servers: [],
        security: { enabled: true }
      };
      (environmentConfig.getCurrentConfig as jest.Mock).mockReturnValue(mockConfig);

      const config = getMCPConfig();

      expect(environmentConfig.getCurrentConfig).toHaveBeenCalled();
      expect(config).toBe(mockConfig);
    });
  });

  describe('validateMCPEnvironment', () => {
    beforeEach(() => {
      (environmentConfig.getCurrentEnvironment as jest.Mock).mockReturnValue('test');
      (environmentConfig.getCurrentConfig as jest.Mock).mockReturnValue({
        servers: [
          { 
            id: 'git', 
            enabled: true, 
            category: 'core',
            auth: { type: 'none' }
          },
          { 
            id: 'memory', 
            enabled: true, 
            category: 'core',
            auth: { 
              type: 'token',
              credentials: { envVar: 'MEMORY_TOKEN' }
            }
          },
          { 
            id: 'test-server', 
            enabled: true, 
            category: 'testing',
            auth: { type: 'none' }
          }
        ]
      });
      (environmentConfig.validateConfig as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
    });

    it('should validate environment configuration successfully', () => {
      const result = validateMCPEnvironment('test');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(environmentConfig.validateConfig).toHaveBeenCalled();
    });

    it('should detect missing authentication', () => {
      delete process.env.MEMORY_TOKEN;
      
      const result = validateMCPEnvironment('test');

      expect(result.warnings).toContain('Missing authentication for servers: memory');
    });

    it('should warn about testing servers in production', () => {
      const result = validateMCPEnvironment('production');

      expect(result.warnings).toContain('Testing servers enabled in production: test-server');
    });

    it('should warn when no servers are enabled', () => {
      (environmentConfig.getCurrentConfig as jest.Mock).mockReturnValue({
        servers: [
          { id: 'git', enabled: false, category: 'core' }
        ]
      });

      const result = validateMCPEnvironment('test');

      expect(result.warnings).toContain('No servers are enabled');
    });

    it('should return validation errors', () => {
      (environmentConfig.validateConfig as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Invalid server configuration']
      });

      const result = validateMCPEnvironment('test');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid server configuration');
    });

    it('should use current environment if none provided', () => {
      validateMCPEnvironment();

      expect(environmentConfig.getCurrentEnvironment).toHaveBeenCalled();
    });
  });

  describe('testMCPConnectivity', () => {
    beforeEach(() => {
      mockMCPService.getEnabledServers.mockReturnValue(['git', 'memory', 'filesystem']);
    });

    it('should test connectivity to all enabled servers', async () => {
      mockMCPService.checkHealth.mockResolvedValue({ healthy: true });

      const results = await testMCPConnectivity();

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(
        expect.objectContaining({
          serverId: 'git',
          connected: true,
          responseTime: expect.any(Number)
        })
      );
      expect(mockMCPService.checkHealth).toHaveBeenCalledTimes(3);
    });

    it('should test connectivity to specific server', async () => {
      mockMCPService.checkHealth.mockResolvedValue({ healthy: true });

      const results = await testMCPConnectivity('git');

      expect(results).toHaveLength(1);
      expect(results[0].serverId).toBe('git');
      expect(mockMCPService.checkHealth).toHaveBeenCalledWith('git');
    });

    it('should handle server connection failures', async () => {
      mockMCPService.checkHealth.mockRejectedValue(new Error('Connection failed'));

      const results = await testMCPConnectivity('git');

      expect(results[0]).toEqual({
        serverId: 'git',
        connected: false,
        error: 'Connection failed'
      });
    });

    it('should handle array health results', async () => {
      mockMCPService.checkHealth.mockResolvedValue([
        { healthy: true },
        { healthy: false }
      ]);

      const results = await testMCPConnectivity('git');

      expect(results[0].connected).toBe(true);
    });

    it('should initialize service if not ready', async () => {
      mockMCPService.isReady.mockReturnValue(false);
      mockMCPService.checkHealth.mockResolvedValue({ healthy: true });

      await testMCPConnectivity();

      expect(mockMCPService.initialize).toHaveBeenCalled();
    });
  });

  describe('getMCPHealthSummary', () => {
    it('should return healthy status when all servers are healthy', () => {
      const summary = getMCPHealthSummary(mockMCPService);

      expect(summary.status).toBe('healthy');
      expect(summary.summary).toBe('All servers operating normally');
      expect(summary.details).toEqual({
        totalServers: 3,
        healthyServers: 3,
        unhealthyServers: 0,
        criticalServers: 0,
        uptime: 99.9
      });
    });

    it('should return degraded status when some servers are unhealthy', () => {
      mockMCPService.getSystemHealth.mockReturnValue({
        totalServers: 3,
        healthyServers: 2,
        unhealthyServers: 1,
        criticalServers: 0,
        averageUptime: 95.0
      });

      const summary = getMCPHealthSummary(mockMCPService);

      expect(summary.status).toBe('degraded');
      expect(summary.summary).toBe('1 server(s) experiencing issues');
    });

    it('should return critical status when critical servers exist', () => {
      mockMCPService.getSystemHealth.mockReturnValue({
        totalServers: 3,
        healthyServers: 1,
        unhealthyServers: 1,
        criticalServers: 1,
        averageUptime: 80.0
      });

      const summary = getMCPHealthSummary(mockMCPService);

      expect(summary.status).toBe('critical');
      expect(summary.summary).toBe('1 critical server(s) detected');
    });
  });

  describe('getMCPMetrics', () => {
    it('should calculate system metrics correctly', () => {
      const metrics = getMCPMetrics(mockMCPService);

      expect(metrics).toEqual({
        serverCount: 3,
        healthyServers: 3,
        averageResponseTime: 0, // Not tracked in current implementation
        totalRequests: 30, // 10 + 15 + 5
        errorRate: 0 // No critical servers
      });
    });

    it('should calculate error rate correctly', () => {
      mockMCPService.getSystemHealth.mockReturnValue({
        totalServers: 4,
        healthyServers: 3,
        unhealthyServers: 0,
        criticalServers: 1,
        averageUptime: 90.0
      });

      const metrics = getMCPMetrics(mockMCPService);

      expect(metrics.errorRate).toBe(25); // 1/4 * 100
    });

    it('should handle zero servers gracefully', () => {
      mockMCPService.getSystemHealth.mockReturnValue({
        totalServers: 0,
        healthyServers: 0,
        unhealthyServers: 0,
        criticalServers: 0,
        averageUptime: 0
      });
      mockMCPService.getRoutingStats.mockReturnValue({
        loadStats: new Map()
      });

      const metrics = getMCPMetrics(mockMCPService);

      expect(metrics.errorRate).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('exportMCPConfig', () => {
    const mockConfig = { 
      environment: 'test' as const,
      servers: [],
      security: { enabled: true }
    };

    beforeEach(() => {
      (environmentConfig.getCurrentConfig as jest.Mock).mockReturnValue(mockConfig);
    });

    it('should export configuration to file successfully', () => {
      const filePath = '/test/config.json';
      
      exportMCPConfig(filePath);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(mockConfig, null, 2)
      );
    });

    it('should handle export errors', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => exportMCPConfig('/test/config.json')).toThrow('Write failed');
    });
  });

  describe('importMCPConfig', () => {
    beforeEach(() => {
      (environmentConfig.validateConfig as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
    });

    it('should import configuration from file successfully', () => {
      const mockConfig = { 
        environment: 'test' as const,
        servers: [],
        security: { enabled: true }
      };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = importMCPConfig('/test/config.json');

      expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/config.json', 'utf8');
      expect(result).toEqual(mockConfig);
    });

    it('should validate imported configuration', () => {
      const mockConfig = { invalid: 'config' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      (environmentConfig.validateConfig as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Invalid configuration']
      });

      expect(() => importMCPConfig('/test/config.json'))
        .toThrow('Invalid configuration: Invalid configuration');
    });

    it('should handle file read errors', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => importMCPConfig('/test/config.json')).toThrow('File not found');
    });

    it('should handle JSON parse errors', () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      expect(() => importMCPConfig('/test/config.json')).toThrow();
    });
  });
});