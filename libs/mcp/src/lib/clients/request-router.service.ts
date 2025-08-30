/**
 * @fileoverview request-router.service module for the clients component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Request Router Service
 * Routes MCP requests to appropriate servers based on method, load, and availability
 */

import { MCPRequest } from './mcp-client.service';
import { getCurrentConfig } from '../config/environment-config';
import { MCPServerConfig } from '../config/mcp-config.schema';

export interface RoutingRule {
  pattern: string | RegExp;
  serverId: string;
  priority: number;
  conditions?: {
    serverCategory?: string;
    minPriority?: number;
    requiresAuth?: boolean;
  };
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'least-connections' | 'priority-based' | 'random';
  options?: Record<string, unknown>;
}

/**
 * Request Router Service
 */
export class RequestRouter {
  private mcpClient: unknown; // MCPClientService reference
  private config = getCurrentConfig();
  private routingRules: RoutingRule[] = [];
  private serverLoadCounters = new Map<string, number>();
  private roundRobinCounters = new Map<string, number>();

  constructor(mcpClient: unknown) {
    this.mcpClient = mcpClient;
    this.initializeRoutingRules();
  }

  /**
   * Initialize default routing rules
   */
  private initializeRoutingRules(): void {
    this.routingRules = [
      // Git operations
      {
        pattern: /^git\./,
        serverId: 'git',
        priority: 10,
        conditions: { serverCategory: 'core' }
      },
      
      // GitHub operations
      {
        pattern: /^github\./,
        serverId: 'github',
        priority: 10,
        conditions: { serverCategory: 'development', requiresAuth: true }
      },
      
      // File system operations
      {
        pattern: /^(fs|file|read|write|list)\./,
        serverId: 'filesystem',
        priority: 10,
        conditions: { serverCategory: 'core' }
      },
      
      // Database operations
      {
        pattern: /^(db|database|query|bigquery)\./,
        serverId: 'databases',
        priority: 9,
        conditions: { serverCategory: 'data', requiresAuth: true }
      },
      
      // Vector/embedding operations
      {
        pattern: /^(vector|embedding|chroma)\./,
        serverId: 'chroma',
        priority: 8,
        conditions: { serverCategory: 'data' }
      },
      
      // Search operations
      {
        pattern: /^(search|exa)\./,
        serverId: 'exa',
        priority: 8,
        conditions: { serverCategory: 'web', requiresAuth: true }
      },
      
      // Web fetch operations
      {
        pattern: /^(fetch|http|web)\./,
        serverId: 'fetch',
        priority: 8,
        conditions: { serverCategory: 'web' }
      },
      
      // Memory operations
      {
        pattern: /^(memory|remember|recall)\./,
        serverId: 'memory',
        priority: 8,
        conditions: { serverCategory: 'core' }
      },
      
      // Time operations
      {
        pattern: /^(time|date|timezone)\./,
        serverId: 'time',
        priority: 7,
        conditions: { serverCategory: 'core' }
      },
      
      // Nx operations
      {
        pattern: /^(nx|workspace|project)\./,
        serverId: 'nx',
        priority: 9,
        conditions: { serverCategory: 'development' }
      },
      
      // Google Cloud operations
      {
        pattern: /^(gcp|google|cloud)\./,
        serverId: 'google',
        priority: 8,
        conditions: { serverCategory: 'platforms', requiresAuth: true }
      },
      
      // Cloud Run operations
      {
        pattern: /^(cloudrun|deploy)\./,
        serverId: 'google-cloud-run',
        priority: 7,
        conditions: { serverCategory: 'platforms', requiresAuth: true }
      },
      
      // Node.js operations
      {
        pattern: /^(node|npm|package)\./,
        serverId: 'node',
        priority: 8,
        conditions: { serverCategory: 'development' }
      },
      
      // Sequential thinking
      {
        pattern: /^(think|plan|analyze)\./,
        serverId: 'sequentialthinking',
        priority: 9,
        conditions: { serverCategory: 'core' }
      },
      
      // Testing operations
      {
        pattern: /^(test|browser|automation)\./,
        serverId: 'browserbase',
        priority: 4,
        conditions: { serverCategory: 'testing' }
      },
      
      // API validation
      {
        pattern: /^(api|openapi|swagger)\./,
        serverId: 'apimatic',
        priority: 6,
        conditions: { serverCategory: 'development' }
      },
      
      // Default fallback to everything server for testing
      {
        pattern: /.*/,
        serverId: 'everything',
        priority: 1,
        conditions: { serverCategory: 'testing' }
      }
    ];
  }

  /**
   * Route a request to the appropriate server
   */
  async routeRequest(request: MCPRequest): Promise<string> {
    // If server is explicitly specified, use it
    if (request.serverId) {
      const serverConfig = this.getServerConfig(request.serverId);
      if (serverConfig && this.isServerAvailable(request.serverId)) {
        return request.serverId;
      }
      throw new Error(`Requested server ${request.serverId} is not available`);
    }

    // Find matching routing rules
    const matchingRules = this.findMatchingRules(request.method);
    
    if (matchingRules.length === 0) {
      throw new Error(`No routing rule found for method: ${request.method}`);
    }

    // Filter rules by server availability and conditions
    const availableRules = matchingRules.filter(rule => {
      const serverConfig = this.getServerConfig(rule.serverId);
      return serverConfig && 
             this.isServerAvailable(rule.serverId) && 
             this.checkRuleConditions(rule, serverConfig);
    });

    if (availableRules.length === 0) {
      throw new Error(`No available servers found for method: ${request.method}`);
    }

    // Select server based on load balancing strategy
    const selectedRule = this.selectServerByLoadBalancing(availableRules, request);
    
    // Update load counters
    this.updateLoadCounters(selectedRule.serverId);
    
    return selectedRule.serverId;
  }

  /**
   * Find routing rules that match the request method
   */
  private findMatchingRules(method: string): RoutingRule[] {
    return this.routingRules
      .filter(rule => {
        if (typeof rule.pattern === 'string') {
          return method.includes(rule.pattern);
        } else {
          return rule.pattern.test(method);
        }
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if rule conditions are met
   */
  private checkRuleConditions(rule: RoutingRule, serverConfig: MCPServerConfig): boolean {
    if (!rule.conditions) {
      return true;
    }

    const { serverCategory, minPriority, requiresAuth } = rule.conditions;

    if (serverCategory && serverConfig.category !== serverCategory) {
      return false;
    }

    if (minPriority && serverConfig.priority < minPriority) {
      return false;
    }

    if (requiresAuth && !serverConfig.auth) {
      return false;
    }

    return true;
  }

  /**
   * Select server based on load balancing strategy with Vietnamese market optimization
   */
  private selectServerByLoadBalancing(rules: RoutingRule[], request: MCPRequest): RoutingRule {
    // Determine strategy based on request characteristics and Vietnamese market needs
    const strategy = this.determineOptimalStrategy(rules, request);

    switch (strategy.type) {
      case 'priority-based':
        return this.selectByPriority(rules);
      
      case 'round-robin':
        return this.selectByRoundRobin(rules);
      
      case 'least-connections':
        return this.selectByLeastConnections(rules);
      
      case 'random':
        return this.selectByRandom(rules);
      
      default:
        return this.selectByPriority(rules);
    }
  }

  /**
   * Determine optimal load balancing strategy for Vietnamese market
   */
  private determineOptimalStrategy(rules: RoutingRule[], request: MCPRequest): LoadBalancingStrategy {
    // For BigQuery and data-heavy operations, use least-connections to avoid overloading
    if (request.method.includes('bigquery') || request.method.includes('database')) {
      return { type: 'least-connections' };
    }
    
    // For real-time operations, use priority-based for consistent performance
    if (request.method.includes('memory') || request.method.includes('cache')) {
      return { type: 'priority-based' };
    }
    
    // For search and fetch operations, distribute load evenly
    if (request.method.includes('search') || request.method.includes('fetch')) {
      return { type: 'round-robin' };
    }
    
    // Default to priority-based for Vietnamese market stability
    return { type: 'priority-based' };
  }
        return this.selectByLeastConnections(rules);
      
      case 'random':
        return this.selectByRandom(rules);
      
      default:
        return rules[0]; // Fallback to first available
    }
  }

  /**
   * Select server by priority (highest first)
   */
  private selectByPriority(rules: RoutingRule[]): RoutingRule {
    return rules.sort((a, b) => {
      const serverA = this.getServerConfig(a.serverId);
      const serverB = this.getServerConfig(b.serverId);
      
      if (!serverA || !serverB) {
        return 0;
      }
      
      return serverB.priority - serverA.priority;
    })[0];
  }

  /**
   * Select server by round-robin
   */
  private selectByRoundRobin(rules: RoutingRule[]): RoutingRule {
    const ruleKey = rules.map(r => r.serverId).sort().join(',');
    const counter = this.roundRobinCounters.get(ruleKey) || 0;
    const selectedRule = rules[counter % rules.length];
    
    this.roundRobinCounters.set(ruleKey, counter + 1);
    return selectedRule;
  }

  /**
   * Select server by least connections/load
   */
  private selectByLeastConnections(rules: RoutingRule[]): RoutingRule {
    return rules.sort((a, b) => {
      const loadA = this.serverLoadCounters.get(a.serverId) || 0;
      const loadB = this.serverLoadCounters.get(b.serverId) || 0;
      return loadA - loadB;
    })[0];
  }

  /**
   * Select server randomly
   */
  private selectByRandom(rules: RoutingRule[]): RoutingRule {
    const randomIndex = Math.floor(Math.random() * rules.length);
    return rules[randomIndex];
  }

  /**
   * Update load counters
   */
  private updateLoadCounters(serverId: string): void {
    const currentLoad = this.serverLoadCounters.get(serverId) || 0;
    this.serverLoadCounters.set(serverId, currentLoad + 1);
    
    // Decay load counters periodically to prevent overflow
    if (currentLoad > 1000) {
      for (const [id, load] of this.serverLoadCounters) {
        this.serverLoadCounters.set(id, Math.floor(load * 0.9));
      }
    }
  }

  /**
   * Check if server is available
   */
  private isServerAvailable(serverId: string): boolean {
    const connection = this.mcpClient.getServerStatus(serverId);
    return connection && connection.status === 'connected';
  }

  /**
   * Get server configuration
   */
  private getServerConfig(serverId: string): MCPServerConfig | undefined {
    return this.config.servers.find(server => server.id === serverId);
  }

  /**
   * Add custom routing rule
   */
  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.unshift(rule); // Add at beginning for higher priority
    this.routingRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove routing rule
   */
  removeRoutingRule(pattern: string | RegExp): void {
    this.routingRules = this.routingRules.filter(rule => {
      if (typeof pattern === 'string') {
        return rule.pattern !== pattern;
      } else {
        return rule.pattern.toString() !== pattern.toString();
      }
    });
  }

  /**
   * Get current routing rules
   */
  getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  /**
   * Get server load statistics
   */
  getLoadStatistics(): Map<string, number> {
    return new Map(this.serverLoadCounters);
  }

  /**
   * Reset load counters
   */
  resetLoadCounters(): void {
    this.serverLoadCounters.clear();
    this.roundRobinCounters.clear();
  }

  /**
   * Get available servers for a method
   */
  getAvailableServersForMethod(method: string): string[] {
    const matchingRules = this.findMatchingRules(method);
    
    return matchingRules
      .filter(rule => {
        const serverConfig = this.getServerConfig(rule.serverId);
        return serverConfig && 
               this.isServerAvailable(rule.serverId) && 
               this.checkRuleConditions(rule, serverConfig);
      })
      .map(rule => rule.serverId);
  }

  /**
   * Test routing for a method (without actually routing)
   */
  testRouting(method: string): {
    matchingRules: RoutingRule[];
    availableServers: string[];
    selectedServer?: string;
  } {
    const matchingRules = this.findMatchingRules(method);
    const availableServers = this.getAvailableServersForMethod(method);
    
    let selectedServer: string | undefined;
    try {
      const availableRules = matchingRules.filter(rule => 
        availableServers.includes(rule.serverId)
      );
      if (availableRules.length > 0) {
        selectedServer = this.selectServerByLoadBalancing(availableRules, { 
          id: 'test', 
          method 
        } as MCPRequest).serverId;
      }
    } catch {
      // Ignore errors in test mode
    }

    return {
      matchingRules,
      availableServers,
      selectedServer
    };
  }
}