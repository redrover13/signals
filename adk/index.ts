/**
 * @fileoverview Agent Developer Kit (ADK) main index
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Exports all ADK modules.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Export services
export * from './services';

// Export utilities
export * from './utils';

// Version information
export const ADK_VERSION = '0.2.0';

/**
 * Initialize the ADK with default configuration.
 * This is a convenience function for applications that want to use
 * the ADK with minimal setup.
 */
export function initializeADK(config: {
  projectId: string;
  serviceName: string;
  environment?: string;
}) {
  // Import utilities here to avoid circular dependencies
  const { Logger, LogLevel, ConfigManager, Environment } = require('./utils');
  
  // Initialize logger
  const logger = new Logger({
    minLevel: LogLevel.INFO,
    serviceName: config.serviceName || 'ADK'
  });
  
  // Initialize configuration
  const envMap: Record<string, Environment> = {
    'development': Environment.DEVELOPMENT,
    'production': Environment.PRODUCTION,
    'testing': Environment.TESTING
  };
  
  const configManager = new ConfigManager({
    environment: envMap[config.environment?.toLowerCase()] || Environment.DEVELOPMENT
  }).load();
  
  logger.info(`ADK initialized for project ${config.projectId}`, {
    version: ADK_VERSION,
    environment: config.environment
  });
  
  return {
    logger,
    config: configManager
  };
}
