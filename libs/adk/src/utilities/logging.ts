/**
 * @fileoverview logging module for the utilities component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Logging utility for the ADK library
 * 
 * Provides structured logging with support for different environments
 * and integration with external logging services.
 */
import { Injectable } from '@angular/core';
import { LogLevel } from '../types/log-level';
import { LogEntry } from '../types/log-entry';
import { LogDestination } from '../types/log-destination';

// Default log destinations
const CONSOLE_LOG_DESTINATION: LogDestination = {
  id: 'console',
  name: 'Console',
  description: 'Logs to the browser or node console',
  enabled: true,
  minLevel: LogLevel.DEBUG
};

// Default log filters
const DEFAULT_EXCLUSION_PATTERNS = [
  /^\[HMR\]/,
  /^\[webpack-dev-server\]/,
  /^\[hot-module-replacement\]/
];

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private _globalLogLevel: LogLevel = LogLevel.INFO;
  private _destinations: LogDestination[] = [CONSOLE_LOG_DESTINATION];
  private _exclusionPatterns: RegExp[] = [...DEFAULT_EXCLUSION_PATTERNS];
  private _categoryLevels = new Map<string, LogLevel>();
  private _isProduction = false;
  private _isVerbose = false;
  
  constructor() {
    // Detect environment
    this._isProduction = process.env['NODE_ENV'] === 'production';
    this._isVerbose = process.env['VERBOSE'] === 'true';
    
    // Set default log level based on environment
    if (this._isProduction) {
      this._globalLogLevel = LogLevel.WARN;
    } else if (this._isVerbose) {
      this._globalLogLevel = LogLevel.DEBUG;
    } else {
      this._globalLogLevel = LogLevel.INFO;
    }
  }
  
  /**
   * Set the global minimum log level
   */
  setGlobalLogLevel(level: LogLevel): void {
    this._globalLogLevel = level;
  }
  
  /**
   * Set the log level for a specific category
   */
  setCategoryLogLevel(category: string, level: LogLevel): void {
    this._categoryLevels.set(category, level);
  }
  
  /**
   * Add a log destination
   */
  addDestination(destination: LogDestination): void {
    // Check if destination with this ID already exists
    const existingIndex = this._destinations.findIndex(d => d.id === destination.id);
    
    if (existingIndex >= 0) {
      // Replace existing destination
      this._destinations[existingIndex] = destination;
    } else {
      // Add new destination
      this._destinations.push(destination);
    }
  }
  
  /**
   * Remove a log destination by ID
   */
  removeDestination(id: string): boolean {
    const initialLength = this._destinations.length;
    this._destinations = this._destinations.filter(d => d.id !== id);
    return this._destinations.length < initialLength;
  }
  
  /**
   * Clear all log destinations (except console in non-production environments)
   */
  clearDestinations(includeConsole = false): void {
    if (includeConsole) {
      this._destinations = [];
    } else {
      this._destinations = this._destinations.filter(d => d.id === 'console');
    }
  }
  
  /**
   * Add a message exclusion pattern
   */
  addExclusionPattern(pattern: RegExp): void {
    this._exclusionPatterns.push(pattern);
  }
  
  /**
   * Clear all exclusion patterns
   */
  clearExclusionPatterns(): void {
    this._exclusionPatterns = [];
  }
  
  /**
   * Log a message at DEBUG level
   */
  debug(message: string, category?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, category, data);
  }
  
  /**
   * Log a message at INFO level
   */
  info(message: string, category?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, category, data);
  }
  
  /**
   * Log a message at WARN level
   */
  warn(message: string, category?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, category, data);
  }
  
  /**
   * Log a message at ERROR level
   */
  error(message: string, category?: string, data?: unknown, error?: Error): void {
    this.log(LogLevel.ERROR, message, category, data, error);
  }
  
  /**
   * Log a message at FATAL level
   */
  fatal(message: string, category?: string, data?: unknown, error?: Error): void {
    this.log(LogLevel.FATAL, message, category, data, error);
  }
  
  /**
   * Generic logging method
   */
  log(level: LogLevel, message: string, category?: string, data?: unknown, error?: Error): void {
    // Check if message should be excluded
    if (this.isExcluded(message)) {
      return;
    }
    
    // Get effective log level for this category
    const effectiveLevel = this.getEffectiveLogLevel(category);
    
    // Check if message meets minimum log level
    if (level < effectiveLevel) {
      return;
    }
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      category,
      data,
      error
    };
    
    // Send to all enabled destinations that accept this log level
    for (const destination of this._destinations) {
      if (destination.enabled && level >= destination.minLevel) {
        this.sendToDestination(destination, entry);
      }
    }
  }
  
  /**
   * Create a logger for a specific category
   */
  getLogger(category: string): CategoryLogger {
    return new CategoryLogger(this, category);
  }
  
  /**
   * Get all configured log destinations
   */
  getDestinations(): LogDestination[] {
    return [...this._destinations];
  }
  
  /**
   * Send a log entry to a destination
   */
  private sendToDestination(destination: LogDestination, entry: LogEntry): void {
    try {
      // For console destination
      if (destination.id === 'console') {
        this.logToConsole(entry);
        return;
      }
      
      // For custom handler
      if (destination.handler) {
        destination.handler(entry);
      }
    } catch (error) {
      // Fall back to console if destination logging fails
      console.error('Error sending log to destination', {
        destinationId: destination.id,
        error
      });
    }
  }
  
  /**
   * Format and log an entry to the console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const categoryText = entry.category ? `[${entry.category}]` : '';
    
    const formattedMessage = `${timestamp} ${levelName} ${categoryText} ${entry.message}`;
    
    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, entry.data || '', entry.error || '');
        break;
      default:
        console.log(formattedMessage, entry.data || '');
    }
  }
  
  /**
   * Get the effective log level for a category
   */
  private getEffectiveLogLevel(category?: string): LogLevel {
    if (category && this._categoryLevels.has(category)) {
      return this._categoryLevels.get(category) || this._globalLogLevel;
    }
    
    return this._globalLogLevel;
  }
  
  /**
   * Check if a message should be excluded based on patterns
   */
  private isExcluded(message: string): boolean {
    return this._exclusionPatterns.some(pattern => pattern.test(message));
  }
}

/**
 * Logger for a specific category
 */
export class CategoryLogger {
  private _service: LoggingService;
  private _category: string;
  
  constructor(service: LoggingService, category: string) {
    this._service = service;
    this._category = category;
  }
  
  debug(message: string, data?: unknown): void {
    this._service.debug(message, this._category, data);
  }
  
  info(message: string, data?: unknown): void {
    this._service.info(message, this._category, data);
  }
  
  warn(message: string, data?: unknown): void {
    this._service.warn(message, this._category, data);
  }
  
  error(message: string, data?: unknown, error?: Error): void {
    this._service.error(message, this._category, data, error);
  }
  
  fatal(message: string, data?: unknown, error?: Error): void {
    this._service.fatal(message, this._category, data, error);
  }
  
  log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    this._service.log(level, message, this._category, data, error);
  }
}
