/**
 * MCP Library - Main Export
 * Comprehensive MCP (Model Context Protocol) integration for the signals project
 */

// Configuration exports
export * from './lib/config/mcp-config.schema';
export * from './lib/config/server-registry';
export * from './lib/config/environment-config';

// Client service exports
export * from './lib/clients/mcp-client.service';
export * from './lib/clients/server-health.service';
export * from './lib/clients/request-router.service';

// Main MCP service facade
export { MCPService } from './lib/mcp.service';

// Utility functions
export { createMCPClient, getMCPConfig, validateMCPEnvironment } from './lib/utils/mcp-utils';
export * from './lib/utils/error-handler';
