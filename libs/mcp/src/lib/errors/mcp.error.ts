/**
 * @fileoverview mcp.error module for the errors component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Stub error class for MCP
export class MCPError extends Error {
  constructor(
    message: string,
    public code?: string,
    public serverId?: string,
  ) {
    super(message);
    this.name = 'MCPError';
  }
}
