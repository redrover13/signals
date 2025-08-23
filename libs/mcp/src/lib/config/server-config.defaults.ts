
/**
 * Default Server Configurations
 * Provides standardized configurations for MCP servers to ensure consistency and maintainability.
 */

import { MCPConnectionConfig, MCPHealthCheckConfig } from './mcp-config.schema';

// ================== CONNECTION DEFAULTS ==================

/**
 * Default retry configuration for servers.
 * - 3 attempts
 * - 1-second initial delay
 * - Exponential backoff
 */
export const DEFAULT_RETRY_CONFIG: MCPConnectionConfig['retry'] = {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
};

/**
 * Default connection timeout: 30 seconds
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Short connection timeout for quick operations: 10 seconds
 */
export const SHORT_TIMEOUT = 10000;

/**
 * Long connection timeout for potentially slow operations: 60 seconds
 */
export const LONG_TIMEOUT = 60000;


// ================== HEALTH CHECK DEFAULTS ==================

/**
 * Base health check configuration.
 */
const BASE_HEALTH_CHECK_CONFIG: Omit<MCPHealthCheckConfig, 'interval'> = {
  timeout: 10000,
  failureThreshold: 3,
};

/**
 * Health check for Core services (e.g., git, filesystem)
 * - Interval: 2 minutes
 */
export const CORE_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 120000,
  failureThreshold: 2,
  timeout: 5000,
};

/**
 * Health check for Development services (e.g., github, nx)
 * - Interval: 5 minutes
 */
export const DEV_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 300000,
};

/**
 * Health check for Data services (e.g., databases, chroma)
 * - Interval: 3 minutes
 */
export const DATA_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 180000,
  timeout: 15000,
};

/**
 * Health check for Web/API services (e.g., exa)
 * - Interval: 5 minutes
 */
export const WEB_API_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 300000,
  timeout: 15000,
};

/**
 * Health check for Platform services (e.g., netlify, firebase)
 * - Interval: 10 minutes
 */
export const PLATFORM_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 600000,
  timeout: 15000,
};

/**
 * Health check for Testing services (e.g., browserstack, everything)
 * - Interval: 10 minutes
 */
export const TESTING_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 600000,
  failureThreshold: 5,
  timeout: 30000,
};

/**
 * Health check for Specialized services
 * - Interval: 10 minutes
 */
export const SPECIALIZED_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 600000,
  timeout: 15000,
};

/**
 * Health check for Automation services
 * - Interval: 10 minutes
 */
export const AUTOMATION_HEALTH_CHECK: MCPHealthCheckConfig = {
  ...BASE_HEALTH_CHECK_CONFIG,
  interval: 600000,
  timeout: 15000,
};
