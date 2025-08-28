/**
 * @fileoverview request-router.service module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Minimal Request Router stub to restore compilation while the real
 * implementation is repaired. This file is intentionally small and
 * preserves the original public API surface used by tests.
 */

import { MCPRequest } from './mcp-client.service';
import { getCurrentConfig } from '../config/environment-config';
import { MCPServerConfig } from '../config/mcp-config.schema';

export interface RoutingRule {
  pattern: string | RegExp;
  serverId: string;
  priority: number;
  conditions?: Record<string, any>;
}

export class RequestRouter {
  private mcpClient: any;
  private config: any;
  private routingRules: RoutingRule[] = [];

  constructor(mcpClient: any) {
    this.mcpClient = mcpClient;
    this.config = getCurrentConfig?.() || { servers: [] };
  }

  async routeRequest(request: MCPRequest): Promise<string> {
    if (request && (request as any).serverId) {
      return (request as any).serverId;
    }
    const first = this.config.servers && this.config.servers[0];
    return first?.id || 'everything';
  }

  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.unshift(rule);
  }

  removeRoutingRule(_pattern: string | RegExp): void {
    // no-op in stub
  }

  getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  getLoadStatistics(): Map<string, number> {
    return new Map();
  }

  resetLoadCounters(): void {
    // no-op
  }

  private getServerConfig(serverId: string): MCPServerConfig | undefined {
    return (this.config.servers || []).find((s: any) => s.id === serverId);
  }

  // Keep compatibility with existing callers: provide a synchronous
  // testRouting(method) that returns the chosen server id for a method.
  testRouting(method: string): string {
    // Try to match a routing rule by string or RegExp pattern
    const found = this.routingRules.find((r) => {
      if (typeof r.pattern === 'string') return r.pattern === method;
      try {
        return (r.pattern as RegExp).test(method);
      } catch {
        return false;
      }
    });
    if (found) return found.serverId;
    const first = this.config.servers && this.config.servers[0];
    return first?.id || 'everything';
  }
}
