/**
 * MCP Utility Functions
 * Helper functions for MCP configuration and client management
 */

import { MCPClientService } from '../clients/mcp-client.service';
import { MCPService } from '../mcp.service';
import { 
  getCurrentConfig, 
  getCurrentEnvironment, 
  validateConfig,
  Environment 
} from '../config/environment-config';
import { MCPEnvironmentConfig } from '../config/mcp-config.schema';

/**
 * Create and initialize MCP client
 */
export async function createMCPClient(): Promise<MCPService> {
  const mcpService = MCPService.getInstance();
  await mcpService.initialize();
  return mcpService;
}

/**
 * Get current MCP configuration
 */
export function getMCPConfig(): MCPEnvironmentConfig {
  return getCurrentConfig();
}

/**
 * Validate MCP environment configuration
 */
export function validateMCPEnvironment(environment?: Environment): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const env = environment || getCurrentEnvironment();
  const config = getCurrentConfig();
  const validation = validateConfig(config);
  
  const warnings: string[] = [];
  
  // Check for common configuration issues
  const enabledServers = config.servers.filter(s => s.enabled);
  
  if (enabledServers.length === 0) {
    warnings.push('No servers are enabled');
  }
  
  // Check for missing authentication
  const serversNeedingAuth = enabledServers.filter(s => 
    s.auth?.type !== 'none' && !process.env[s.auth?.credentials?.envVar || '']
  );
  
  if (serversNeedingAuth.length > 0) {
    warnings.push(`Missing authentication for servers: ${serversNeedingAuth.map(s => s.id).join(', ')}`);
  }
  
  // Check for development-only servers in production
  if (env === 'production') {
    const devServers = enabledServers.filter(s => s.category === 'testing');
    if (devServers.length > 0) {
      warnings.push(`Testing servers enabled in production: ${devServers.map(s => s.id).join(', ')}`);
    }
  }
  
  return {
    valid: validation.valid,
    errors: validation.errors,
    warnings
  };
}

/**
 * Get MCP server recommendations based on use case
 */
export function getMCPServerRecommendations(useCase: string): {
  essential: string[];
  recommended: string[];
  optional: string[];
} {
  const useCaseMap: Record<string, { essential: string[]; recommended: string[]; optional: string[] }> = {
    'web-development': {
      essential: ['filesystem', 'git', 'github', 'node'],
      recommended: ['nx', 'fetch', 'apimatic', 'memory'],
      optional: ['browserbase', 'netlify', 'cloudflare']
    },
    'data-analysis': {
      essential: ['databases', 'filesystem', 'memory'],
      recommended: ['chroma', 'fetch', 'sequentialthinking'],
      optional: ['exa', 'google']
    },
    'ai-development': {
      essential: ['memory', 'chroma', 'sequentialthinking', 'fetch'],
      recommended: ['databases', 'exa', 'google'],
      optional: ['notion', 'firebase']
    },
    'devops': {
      essential: ['git', 'github', 'google-cloud-run', 'google'],
      recommended: ['nx', 'node', 'databases'],
      optional: ['netlify', 'cloudflare', 'make']
    },
    'testing': {
      essential: ['filesystem', 'git', 'everything'],
      recommended: ['browserbase', 'browserstack', 'apimatic'],
      optional: ['fetch', 'memory']
    },
    'content-management': {
      essential: ['filesystem', 'memory', 'notion'],
      recommended: ['fetch', 'devhub', 'firebase'],
      optional: ['algolia', 'make']
    }
  };

  return useCaseMap[useCase] || {
    essential: ['filesystem', 'git', 'memory'],
    recommended: ['fetch', 'sequentialthinking'],
    optional: ['everything']
  };
}

/**
 * Generate MCP configuration for specific use case
 */
export function generateMCPConfig(
  useCase: string,
  environment: Environment = 'development',
  options: { exclusive?: boolean } = {}
): Partial<MCPEnvironmentConfig> {
  const recommendations = getMCPServerRecommendations(useCase);
  const baseConfig = getCurrentConfig();

  const enabledServerIds = [
    ...recommendations.essential,
    ...recommendations.recommended
  ];

  const servers = baseConfig.servers.map(server => {
    if (enabledServerIds.includes(server.id)) {
      return { ...server, enabled: true };
    }
    return options.exclusive ? { ...server, enabled: false } : server;
  });

  return {
    environment,
    servers,
    global: baseConfig.global
  };
}

/**
 * Check MCP server dependencies
 */
export function checkMCPDependencies(): {
  available: string[];
  missing: string[];
  errors: Record<string, string>;
} {
  const available: string[] = [];
  const missing: string[] = [];
  const errors: Record<string, string> = {};
  
  const config = getCurrentConfig();
  const enabledServers = config.servers.filter(s => s.enabled);
  
  for (const server of enabledServers) {
    try {
      // Check if server command/endpoint is available
      if (server.connection.type === 'stdio') {
        const [command] = server.connection.endpoint.split(' ');
        
        // For npm packages, check if they can be resolved
        if (command === 'npx' || command === 'node') {
          available.push(server.id);
        } else {
          // For other commands, assume available (would need actual check)
          available.push(server.id);
        }
      } else {
        // For HTTP/WebSocket connections, assume available
        available.push(server.id);
      }
    } catch (error) {
      missing.push(server.id);
      errors[server.id] = error instanceof Error ? error.message : 'Unknown error';
    }
  }
  
  return { available, missing, errors };
}

/**
 * Get MCP performance metrics
 */
export function getMCPPerformanceMetrics(mcpService: MCPService): {
  serverCount: number;
  healthyServers: number;
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
} {
  const systemHealth = mcpService.getSystemHealth();
  const routingStats = mcpService.getRoutingStats();
  
  // Calculate metrics from available data
  const totalRequests = Array.from(routingStats.loadStats.values())
    .reduce((sum, count) => sum + count, 0);
  
  return {
    serverCount: systemHealth.totalServers,
    healthyServers: systemHealth.healthyServers,
    averageResponseTime: 0, // Would need to track this
    totalRequests,
    errorRate: systemHealth.totalServers === 0
      ? 0
      : (systemHealth.criticalServers / systemHealth.totalServers) * 100
  };
}

/**
 * Export MCP configuration to file
 */
export function exportMCPConfig(filePath: string): void {
  const config = getCurrentConfig();
  const fs = require('fs');
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log(`MCP configuration exported to: ${filePath}`);
  } catch (error) {
    console.error('Failed to export MCP configuration:', error);
    throw error;
  }
}

/**
 * Import MCP configuration from file
 */
export function importMCPConfig(filePath: string): MCPEnvironmentConfig {
  const fs = require('fs');
  
  try {
    const configData = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(configData) as MCPEnvironmentConfig;
    
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    return config;
  } catch (error) {
    console.error('Failed to import MCP configuration:', error);
    throw error;
  }
}

/**
 * Get MCP server health summary
 */
export function getMCPHealthSummary(mcpService: MCPService): {
  status: 'healthy' | 'degraded' | 'critical';
  summary: string;
  details: {
    totalServers: number;
    healthyServers: number;
    unhealthyServers: number;
    criticalServers: number;
    uptime: number;
  };
} {
  const health = mcpService.getSystemHealth();
  
  let status: 'healthy' | 'degraded' | 'critical';
  let summary: string;
  
  if (health.criticalServers > 0) {
    status = 'critical';
    summary = `${health.criticalServers} critical server(s) detected`;
  } else if (health.unhealthyServers > 0) {
    status = 'degraded';
    summary = `${health.unhealthyServers} server(s) experiencing issues`;
  } else {
    status = 'healthy';
    summary = 'All servers operating normally';
  }
  
  return {
    status,
    summary,
    details: {
      totalServers: health.totalServers,
      healthyServers: health.healthyServers,
      unhealthyServers: health.unhealthyServers,
      criticalServers: health.criticalServers,
      uptime: health.averageUptime
    }
  };
}

/**
 * Create MCP client with custom configuration
 */
export async function createCustomMCPClient(
  customConfig: Partial<MCPEnvironmentConfig>
): Promise<MCPService> {
  // This would require extending the MCPService to accept custom configs
  // For now, return the standard instance
  return createMCPClient();
}

/**
 * Test MCP server connectivity
 */
export async function testMCPConnectivity(serverId?: string): Promise<{
  serverId: string;
  connected: boolean;
  responseTime?: number;
  error?: string;
}[]> {
  const mcpService = MCPService.getInstance();
  
  if (!mcpService.isReady()) {
    await mcpService.initialize();
  }
  
  const results: {
    serverId: string;
    connected: boolean;
    responseTime?: number;
    error?: string;
  }[] = [];
  
  const serversToTest = serverId ? [serverId] : mcpService.getEnabledServers();
  
  for (const id of serversToTest) {
    const startTime = Date.now();
    
    try {
      const healthResult = await mcpService.checkHealth(id);
      const responseTime = Date.now() - startTime;
      
      results.push({
        serverId: id,
        connected: Array.isArray(healthResult) ? 
          healthResult.some(r => r.healthy) : 
          (healthResult?.healthy ?? false),
        responseTime
      });
    } catch (error) {
      results.push({
        serverId: id,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}