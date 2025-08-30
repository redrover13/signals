/**
 * @fileoverview Logging utility for the ADK component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains structured logging functionality with multiple output destinations.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { ConfigManager } from './configuration';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log level priorities (higher number = higher priority)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  serviceName: string;
  environment: string;
  correlationId?: string;
  userId?: string;
  component?: string;
  [key: string]: any;
}

/**
 * Structured logger for ADK
 */
export class Logger {
  private config: ConfigManager;
  private serviceName: string;
  private environment: string;
  private minLevel: LogLevel;
  private useStructured: boolean;
  private destination: 'console' | 'file' | 'cloud';
  private filePath?: string;
  private logFile?: fs.WriteStream;
  private correlationIdFn?: () => string;
  
  constructor(config: ConfigManager) {
    this.config = config;
    this.serviceName = config.get('serviceName', 'adkService');
    this.environment = config.get('environment', 'development');
    this.minLevel = config.get('logging.level', 'info') as LogLevel;
    this.useStructured = config.get('logging.useStructured', false);
    this.destination = config.get('logging.destination', 'console');
    this.filePath = config.get('logging.filePath');
    
    // Initialize log file if needed
    if (this.destination === 'file' && this.filePath) {
      this.initLogFile();
    }
  }
  
  /**
   * Set a correlation ID provider function
   */
  setCorrelationIdProvider(fn: () => string): void {
    this.correlationIdFn = fn;
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Log an info message
   */
  info(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Log an error message
   */
  error(message: string, error?: Error, context: Record<string, any> = {}): void {
    const errorContext = { ...context };
    
    if (error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    this.log(LogLevel.ERROR, message, errorContext);
  }
  
  /**
   * Create a child logger for a specific component
   */
  child(component: string): Logger {
    const childLogger = new Logger(this.config);
    childLogger.setCorrelationIdProvider(this.correlationIdFn);
    return childLogger;
  }
  
  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context: Record<string, any> = {}): void {
    // Check if we should log this level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const correlationId = this.correlationIdFn ? this.correlationIdFn() : undefined;
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      serviceName: this.serviceName,
      environment: this.environment,
      correlationId,
      ...context,
    };
    
    switch (this.destination) {
      case 'console':
        this.logToConsole(logEntry);
        break;
      case 'file':
        this.logToFile(logEntry);
        break;
      case 'cloud':
        this.logToCloud(logEntry);
        break;
    }
  }
  
  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, ...context } = entry;
    
    // Color mapping
    const colors = {
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      reset: '\x1b[0m',
    };
    
    const color = colors[level];
    const reset = colors.reset;
    
    if (this.useStructured) {
      // Structured JSON logging
      console.log(JSON.stringify(entry));
    } else {
      // Human-friendly logging
      const levelPadded = level.toUpperCase().padEnd(5);
      const contextStr = Object.keys(context).length > 0
        ? util.inspect(context, { depth: 4, colors: true })
        : '';
      
      console.log(
        `${color}${timestamp} [${levelPadded}] ${message}${reset}${
          contextStr ? ` ${contextStr}` : ''
        }`
      );
    }
  }
  
  /**
   * Log to file
   */
  private logToFile(entry: LogEntry): void {
    if (!this.logFile) {
      this.initLogFile();
    }
    
    if (this.logFile) {
      const logLine = this.useStructured
        ? JSON.stringify(entry) + '\n'
        : `${entry.timestamp} [${entry.level.toUpperCase().padEnd(5)}] ${entry.message}\n`;
      
      this.logFile.write(logLine);
    }
  }
  
  /**
   * Log to cloud logging
   */
  private logToCloud(entry: LogEntry): void {
    // In a real implementation, we would use GCP Cloud Logging here
    // For now, fallback to console
    this.logToConsole(entry);
  }
  
  /**
   * Initialize log file
   */
  private initLogFile(): void {
    if (!this.filePath) {
      this.destination = 'console';
      return;
    }
    
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create or append to log file
      this.logFile = fs.createWriteStream(this.filePath, { flags: 'a' });
      
      // Handle stream errors
      this.logFile.on('error', (err) => {
        console.error(`Error writing to log file: ${err.message}`);
        this.destination = 'console';
        this.logFile = undefined;
      });
    } catch (err) {
      console.error(`Failed to create log file: ${err instanceof Error ? err.message : String(err)}`);
      this.destination = 'console';
    }
  }
  
  /**
   * Close logger (clean up resources)
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.logFile) {
        this.logFile.end(() => {
          this.logFile = undefined;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
