/**
 * @fileoverview Logger utility
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides logging utilities.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Minimum log level
   */
  minLevel: LogLevel;
  
  /**
   * Service name
   */
  serviceName: string;
  
  /**
   * Whether to include timestamps
   */
  includeTimestamps?: boolean;
  
  /**
   * Output to console
   */
  console?: boolean;
  
  /**
   * Custom log handler
   */
  customHandler?: (level: LogLevel, message: string, meta: any) => void;
}

/**
 * Logger utility
 */
export class Logger {
  private config: LoggerConfig;
  private levels: Record<LogLevel, number>;
  
  /**
   * Creates a new Logger
   * @param config Logger configuration
   */
  constructor(config: LoggerConfig) {
    this.config = {
      includeTimestamps: true,
      console: true,
      ...config
    };
    
    // Define level hierarchy
    this.levels = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
  }
  
  /**
   * Check if a log level should be processed
   * @param level Log level to check
   * @returns Whether the level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.config.minLevel];
  }
  
  /**
   * Format a log message
   * @param level Log level
   * @param message Log message
   * @param meta Additional metadata
   * @returns Formatted log message
   */
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const parts = [`[${this.config.serviceName}]`, `[${level.toUpperCase()}]`];
    
    if (this.config.includeTimestamps) {
      parts.unshift(`[${new Date().toISOString()}]`);
    }
    
    let formattedMessage = `${parts.join(' ')} ${message}`;
    
    if (meta) {
      try {
        formattedMessage += ` ${JSON.stringify(meta)}`;
      } catch (error) {
        formattedMessage += ' [Unable to stringify metadata]';
      }
    }
    
    return formattedMessage;
  }
  
  /**
   * Log a message
   * @param level Log level
   * @param message Log message
   * @param meta Additional metadata
   */
  log(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Log to console if enabled
    if (this.config.console) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }
    
    // Call custom handler if provided
    if (this.config.customHandler) {
      this.config.customHandler(level, message, meta);
    }
  }
  
  /**
   * Log a debug message
   * @param message Log message
   * @param meta Additional metadata
   */
  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }
  
  /**
   * Log an info message
   * @param message Log message
   * @param meta Additional metadata
   */
  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }
  
  /**
   * Log a warning message
   * @param message Log message
   * @param meta Additional metadata
   */
  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }
  
  /**
   * Log an error message
   * @param message Log message
   * @param meta Additional metadata
   */
  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }
  
  /**
   * Create a child logger with a subcomponent name
   * @param subcomponent Subcomponent name
   * @returns Child logger
   */
  child(subcomponent: string): Logger {
    return new Logger({
      ...this.config,
      serviceName: `${this.config.serviceName}:${subcomponent}`
    });
  }
}
