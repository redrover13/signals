/**
 * @fileoverview index module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * MCP Library - Main Export
 * Comprehensive MCP (Model Context Protocol) integration for the signals project
 */

// Configuration exports
export * from './lib/config/server-registry';

// Client service exports
export * from './lib/clients/mcp-client.service';
export * from './lib/clients/request-router.service';

// Performance optimization services
export * from './lib/services/cache.service';
export * from './lib/services/connection-pool.service';
export * from './lib/services/performance-metrics.service';

// Main MCP service facade
export { MCPService } from './lib/mcp.service';

// Export a singleton instance for runtime usage
const __mcpServiceInstance = (typeof require !== 'undefined'
  ? require('./lib/mcp.service')
  : (await import('./lib/mcp.service'))).MCPService.getInstance();

// Defensive shim: ensure getEnabledServers exists to avoid runtime errors
// Will be overridden by the actual implementation when available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const __mcpServiceAny: any = __mcpServiceInstance as any;
if (typeof __mcpServiceAny.getEnabledServers !== 'function') {
  __mcpServiceAny.getEnabledServers = () => [] as string[];
}

// Re-export as named export
export const mcpService = __mcpServiceAny as import('./lib/mcp.service').MCPService;
