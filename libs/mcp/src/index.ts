/**
 * @fileoverview Main entry point for the MCP library
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Exports the main MCP service and utilities.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Re-export the main MCP service from the gemini-orchestrator library
export { mcpService, MCPService } from '@nx-monorepo/agents/gemini-orchestrator';

// Re-export utility functions
export { createMCPClient } from '@nx-monorepo/utils/monitoring';

// Re-export validation and testing functions
export { validateMCPEnvironment } from '@nx-monorepo/agents/gemini-orchestrator';
export { testMCPConnectivity } from '@nx-monorepo/agents/gemini-orchestrator';

// Re-export error handling utilities
export {
  createServiceErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  withErrorHandler
} from '@nx-monorepo/agents/gemini-orchestrator';

// Re-export health monitoring utilities
export { getMCPHealthSummary, getMCPPerformanceMetrics } from '@nx-monorepo/utils/monitoring';
