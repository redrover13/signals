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
export { mcpService, MCPService } from '../../agents/gemini-orchestrator/src/index';

// Re-export utility functions
export { createMCPClient } from '../../utils/monitoring/src/index';

// Re-export validation and testing functions
export { validateMCPEnvironment } from '../../agents/gemini-orchestrator/src/index';
export { testMCPConnectivity } from '../../agents/gemini-orchestrator/src/index';

// Re-export error handling utilities
export {
  createServiceErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  withErrorHandler
} from '../../agents/gemini-orchestrator/src/index';

// Re-export health monitoring utilities
export { getMCPHealthSummary, getMCPPerformanceMetrics } from '../../utils/monitoring/src/index';
