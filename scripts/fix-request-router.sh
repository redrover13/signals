#!/bin/bash

# Script to fix request-router.service.ts
echo "🔧 Fixing Request Router Service..."

# Create a directory if it doesn't exist
mkdir -p ./libs/utils/api-clients/src/lib

# Create the fixed file
cat > ./libs/utils/api-clients/src/lib/request-router.service.ts.new << 'EOF2'
/**
 * Request router service for Dulce Saigon
 */
import { MCPClientConfig, MCPServerConfig } from './mcp-client.service';

/**
 * Routing rule for matching requests to servers
 */
export interface RoutingRule {
  id: string;
  priority: number;
  match: {
    path?: string;
    method?: string;
    pathPattern?: string;
  };
  serverId: string;
}

/**
 * Service to route MCP requests to appropriate servers
 */
export class RequestRouter {
  private mcpClient: any;
  private config: MCPClientConfig;
  private routingRules: RoutingRule[] = [];

  /**
   * Constructor
   * @param mcpClient MCP client
   * @param getCurrentConfig Function to get current configuration
   */
  constructor(mcpClient: any, getCurrentConfig?: () => MCPClientConfig) {
    this.mcpClient = mcpClient;
    this.config = getCurrentConfig?.() || { servers: [], global: { healthMonitoring: { enabled: false } } };
    this.initializeRoutes();
  }

  /**
   * Initialize routing rules
   */
  private initializeRoutes(): void {
    // Default rules for specific server capabilities
    if (this.config.servers) {
      this.config.servers.forEach((server) => {
        if (server.id && server.capabilities) {
          // Add capability-based routing rules
          server.capabilities.forEach((capability) => {
            this.addCapabilityRoute(server.id, capability);
          });
        }
      });
    }
  }

  /**
   * Add a capability-based routing rule
   * @param serverId Server ID
   * @param capability Capability name
   */
  private addCapabilityRoute(serverId: string, capability: string): void {
    // Example: route tool/file-search to a server with 'file-search' capability
    if (capability) {
      this.routingRules.push({
        id: `capability-${capability}`,
        priority: 100,
        match: {
          pathPattern: `^/tools/${capability}(/.*)?$`,
        },
        serverId,
      });
    }
  }

  /**
   * Get all routing rules
   */
  getAllRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  /**
   * Add a custom routing rule
   * @param rule Routing rule
   */
  addRoutingRule(rule: RoutingRule): void {
    // Check if rule with same ID already exists
    const existingIndex = this.routingRules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      // Replace existing rule
      this.routingRules[existingIndex] = rule;
    } else {
      // Add new rule
      this.routingRules.push(rule);
    }

    // Sort rules by priority (highest first)
    this.routingRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a routing rule
   * @param ruleId Rule ID
   */
  removeRoutingRule(ruleId: string): boolean {
    const initialLength = this.routingRules.length;
    this.routingRules = this.routingRules.filter((rule) => rule.id !== ruleId);
    return this.routingRules.length < initialLength;
  }

  /**
   * Route a request to an appropriate server
   * @param request Request object
   */
  routeRequest(request: { path: string; method: string }): string | null {
    // Check if request has an explicit server ID
    if ('serverId' in request && typeof request.serverId === 'string') {
      return request.serverId;
    }

    // Find matching rule
    for (const rule of this.routingRules) {
      if (this.matchesRule(request, rule)) {
        return rule.serverId;
      }
    }

    // If no specific rule matches, use the first available server
    if (this.config.servers && this.config.servers.length > 0) {
      const firstServer = this.config.servers[0];
      return firstServer.id || null;
    }

    return null;
  }

  /**
   * Check if a request matches a routing rule
   * @param request Request object
   * @param rule Routing rule
   */
  private matchesRule(request: { path: string; method: string }, rule: RoutingRule): boolean {
    // Check path exact match
    if (rule.match.path && rule.match.path !== request.path) {
      return false;
    }

    // Check method match
    if (rule.match.method && rule.match.method !== request.method) {
      return false;
    }

    // Check path pattern match
    if (rule.match.pathPattern) {
      const regex = new RegExp(rule.match.pathPattern);
      if (!regex.test(request.path)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get server for a specific capability
   * @param capability Capability name
   */
  getServerForCapability(capability: string): MCPServerConfig | null {
    if (!this.config.servers) {
      return null;
    }

    return (
      this.config.servers.find((server) => server.capabilities?.includes(capability)) ||
      null
    );
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  updateConfig(config: MCPClientConfig): void {
    this.config = config;
    // Re-initialize routes with new config
    this.routingRules = [];
    this.initializeRoutes();
  }
}
EOF2

# Replace the file
mv ./libs/utils/api-clients/src/lib/request-router.service.ts.new ./libs/utils/api-clients/src/lib/request-router.service.ts

echo "✅ Request Router Service fixed!"
