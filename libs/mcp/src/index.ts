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

// Main MCP service facade
export { MCPService } from './lib/mcp.service';
