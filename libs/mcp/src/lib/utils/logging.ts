/**
 * @fileoverview logging module for the utils component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Logging utility for MCP
 * 
 * Provides a flexible logging system with multiple levels, 
 * formatters, and output destinations.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Define log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
  NONE = 5
}

// Interface for log entries
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  error?: Error;
}

// Interface for log formatters
export interface LogFormatter {
  format(entry: LogEntry): string;
}

// Interface for log outputs
export interface LogOutput {
  log(entry: LogEntry): void;
}

// Default formatter implementation
export class DefaultLogFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const category = entry.category ? `[${entry.category}]` : '';
    
    let message = `${timestamp} ${level} ${category} ${entry.message}`;
    
    if (entry.data) {
      try {
        const data = typeof entry.data === 'string' 
          ? entry.data 
          : JSON.stringify(entry.data, null, 2);
        message += `\nData: ${data}`;
      } catch (err) {
        message += `\nData: [Unable to stringify data]`;
      }
    }
    
    if (entry.error) {
      message += `\nError: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }
}

// Console output implementation
export class ConsoleLogOutput implements LogOutput {
  private formatter: LogFormatter;
  
  constructor(formatter?: LogFormatter) {
    this.formatter = formatter || new DefaultLogFormatter();
  }
  
  log(entry: LogEntry): void {
    const formattedMessage = this.formatter.format(entry);
    
    switch (entry.level) {
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
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
}

// In-memory output for testing and UI display
export class MemoryLogOutput implements LogOutput {
  private entries: LogEntry[] = [];
  private maxEntries: number;
  private entriesSubject = new BehaviorSubject<LogEntry[]>([]);
  
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }
  
  log(entry: LogEntry): void {
    this.entries.push(entry);
    
    // Trim if exceeding max entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    
    this.entriesSubject.next([...this.entries]);
  }
  
  getEntries(): LogEntry[] {
    return [...this.entries];
  }
  
  clear(): void {
    this.entries = [];
    this.entriesSubject.next([]);
  }
  
  observe(): Observable<LogEntry[]> {
    return this.entriesSubject.asObservable();
  }
}

// Logging service
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private minLevel: LogLevel = LogLevel.INFO;
  private categoryLevels = new Map<string, LogLevel>();
  private outputs: LogOutput[] = [];
  private defaultCategory = 'DEFAULT';
  
  constructor() {
    // Add console output by default
    this.addOutput(new ConsoleLogOutput());
  }
  
  /**
   * Set the minimum global log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Set the minimum log level for a specific category
   */
  setCategoryLevel(category: string, level: LogLevel): void {
    this.categoryLevels.set(category, level);
  }
  
  /**
   * Add a log output destination
   */
  addOutput(output: LogOutput): void {
    this.outputs.push(output);
  }
  
  /**
   * Remove all log outputs
   */
  clearOutputs(): void {
    this.outputs = [];
  }
  
  /**
   * Set the default log category
   */
  setDefaultCategory(category: string): void {
    this.defaultCategory = category;
  }
  
  /**
   * Log at DEBUG level
   */
  debug(message: string, category?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, category, data);
  }
  
  /**
   * Log at INFO level
   */
  info(message: string, category?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, category, data);
  }
  
  /**
   * Log at WARN level
   */
  warn(message: string, category?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, category, data);
  }
  
  /**
   * Log at ERROR level
   */
  error(message: string, category?: string, data?: unknown, error?: Error): void {
    this.log(LogLevel.ERROR, message, category, data, error);
  }
  
  /**
   * Log at FATAL level
   */
  fatal(message: string, category?: string, data?: unknown, error?: Error): void {
    this.log(LogLevel.FATAL, message, category, data, error);
  }
  
  /**
   * Generic log method
   */
  log(level: LogLevel, message: string, category?: string, data?: unknown, error?: Error): void {
    const cat = category || this.defaultCategory;
    
    // Check if this log should be filtered based on level
    if (!this.shouldLog(level, cat)) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category: cat,
      message,
      data,
      error
    };
    
    this.processLogEntry(entry);
  }
  
  /**
   * Check if a log entry should be processed based on its level and category
   */
  private shouldLog(level: LogLevel, category: string): boolean {
    // Category-specific level takes precedence over global level
    const categoryLevel = this.categoryLevels.get(category);
    const effectiveMinLevel = categoryLevel !== undefined ? categoryLevel : this.minLevel;
    
    return level >= effectiveMinLevel;
  }
  
  /**
   * Process a log entry by sending it to all outputs
   */
  private processLogEntry(entry: LogEntry): void {
    for (const output of this.outputs) {
      try {
        output.log(entry);
      } catch (error) {
        // If an output fails, log to console as a fallback
        console.error('Logging output failed:', error);
      }
    }
  }
  
  /**
   * Create a logger with a specific category
   */
  getLogger(category: string): Logger {
    return new Logger(this, category);
  }
}

/**
 * Logger class that uses the LoggingService with a predefined category
 */
export class Logger {
  constructor(
    private service: LoggingService,
    private category: string
  ) {}
  
  debug(message: string, data?: unknown): void {
    this.service.debug(message, this.category, data);
  }
  
  info(message: string, data?: unknown): void {
    this.service.info(message, this.category, data);
  }
  
  warn(message: string, data?: unknown): void {
    this.service.warn(message, this.category, data);
  }
  
  error(message: string, data?: unknown, error?: Error): void {
    this.service.error(message, this.category, data, error);
  }
  
  fatal(message: string, data?: unknown, error?: Error): void {
    this.service.fatal(message, this.category, data, error);
  }
  
  log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    this.service.log(level, message, this.category, data, error);
  }
}
