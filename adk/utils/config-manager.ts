/**
 * @fileoverview Configuration utility
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides configuration management utilities.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger, LogLevel } from './logger';

/**
 * Environment type
 */
export enum Environment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  /**
   * Environment to use
   */
  environment?: Environment;
  
  /**
   * Base configuration directory
   */
  configDir?: string;
  
  /**
   * Default values
   */
  defaults?: Record<string, any>;
  
  /**
   * Logger instance
   */
  logger?: Logger;
}

/**
 * Configuration manager for handling application configuration
 */
export class ConfigManager {
  private environment: Environment;
  private configDir: string;
  private config: Record<string, any>;
  private logger: Logger;
  
  /**
   * Creates a new ConfigManager
   * @param options Configuration manager options
   */
  constructor(options: ConfigManagerOptions = {}) {
    this.environment = options.environment || this.determineEnvironment();
    this.configDir = options.configDir || path.join(process.cwd(), 'config');
    this.config = options.defaults || {};
    
    // Create logger if not provided
    this.logger = options.logger || new Logger({
      minLevel: LogLevel.INFO,
      serviceName: 'ConfigManager'
    });
    
    this.logger.info(`Initialized for environment: ${this.environment}`);
  }
  
  /**
   * Determine the current environment
   * @returns Environment type
   */
  private determineEnvironment(): Environment {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env.toLowerCase()) {
      case 'production':
        return Environment.PRODUCTION;
      case 'staging':
        return Environment.STAGING;
      case 'testing':
      case 'test':
        return Environment.TESTING;
      case 'local':
        return Environment.LOCAL;
      default:
        return Environment.DEVELOPMENT;
    }
  }
  
  /**
   * Load configuration from files
   * @returns ConfigManager instance for chaining
   */
  load(): ConfigManager {
    try {
      // Load base config
      this.loadConfigFile('base.json');
      
      // Load environment-specific config
      this.loadConfigFile(`${this.environment}.json`);
      
      // Load local overrides if they exist
      this.loadConfigFile('local.json', true);
      
      this.logger.info('Configuration loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load configuration', { error });
    }
    
    return this;
  }
  
  /**
   * Load a specific configuration file
   * @param filename Configuration filename
   * @param optional Whether the file is optional
   */
  private loadConfigFile(filename: string, optional: boolean = false): void {
    const filePath = path.join(this.configDir, filename);
    
    if (!optional && !fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }
    
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileConfig = JSON.parse(fileContent);
        
        // Merge with existing config
        this.config = this.mergeConfigs(this.config, fileConfig);
        
        this.logger.debug(`Loaded configuration from ${filename}`);
      } catch (error) {
        throw new Error(`Failed to parse configuration file ${filename}: ${error.message}`);
      }
    }
  }
  
  /**
   * Merge configuration objects
   * @param target Target configuration
   * @param source Source configuration
   * @returns Merged configuration
   */
  private mergeConfigs(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const result = { ...target };
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof result[key] === 'object' &&
          result[key] !== null &&
          !Array.isArray(result[key])
        ) {
          // Recursively merge objects
          result[key] = this.mergeConfigs(result[key], source[key]);
        } else {
          // Replace value
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get a configuration value
   * @param key Configuration key (dot notation supported)
   * @param defaultValue Default value if key not found
   * @returns Configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let value: any = this.config;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return defaultValue as T;
      }
      
      value = value[part];
    }
    
    return (value === undefined) ? defaultValue as T : value;
  }
  
  /**
   * Set a configuration value
   * @param key Configuration key (dot notation supported)
   * @param value Configuration value
   * @returns ConfigManager instance for chaining
   */
  set(key: string, value: any): ConfigManager {
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (!(part in current)) {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    
    return this;
  }
  
  /**
   * Get the entire configuration
   * @returns Complete configuration object
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }
  
  /**
   * Get the current environment
   * @returns Current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }
  
  /**
   * Check if running in production environment
   * @returns Whether running in production
   */
  isProduction(): boolean {
    return this.environment === Environment.PRODUCTION;
  }
  
  /**
   * Check if running in development environment
   * @returns Whether running in development
   */
  isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT || this.environment === Environment.LOCAL;
  }
}
