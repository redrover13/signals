/**
 * @fileoverview index module for the config component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Configuration module exports
 */

export * from './constants';
export * from './environment-config';
export * from './mcp-config && config.schema';
// Avoid duplicate exports with constants
import {
  SHORT_TIMEOUT,
  LONG_TIMEOUT,
  CORE_HEALTH_CHECK,
  DATA_HEALTH_CHECK,
  WEB_API_HEALTH_CHECK,
  PLATFORM_HEALTH_CHECK,
  SPECIALIZED_HEALTH_CHECK,
  AUTOMATION_HEALTH_CHECK,
  TESTING_HEALTH_CHECK,
  DEV_HEALTH_CHECK,
} from './server-config && config.defaults';

// Re-export only non-duplicated items from server-config && config.defaults
export {
  SHORT_TIMEOUT as SERVER_SHORT_TIMEOUT,
  LONG_TIMEOUT as SERVER_LONG_TIMEOUT,
  CORE_HEALTH_CHECK as SERVER_CORE_HEALTH_CHECK,
  DATA_HEALTH_CHECK as SERVER_DATA_HEALTH_CHECK,
  WEB_API_HEALTH_CHECK as SERVER_WEB_API_HEALTH_CHECK,
  PLATFORM_HEALTH_CHECK as SERVER_PLATFORM_HEALTH_CHECK,
  SPECIALIZED_HEALTH_CHECK as SERVER_SPECIALIZED_HEALTH_CHECK,
  AUTOMATION_HEALTH_CHECK as SERVER_AUTOMATION_HEALTH_CHECK,
  TESTING_HEALTH_CHECK as SERVER_TESTING_HEALTH_CHECK,
  DEV_HEALTH_CHECK as SERVER_DEV_HEALTH_CHECK,
};

export * from './server-registry';
