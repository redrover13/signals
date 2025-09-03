/**
 * @fileoverview mcp-response.interface module for the interfaces component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Stub interface for MCP responses
export interface MCPResponse {
  success?: boolean;
  data?: any;
  error?: string;
  serverId?: string;
  timestamp?: Date;
}
