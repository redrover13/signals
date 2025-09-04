/**
 * @fileoverview Log entry types
 */
import { LogLevel } from './log-level';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
  error?: Error;
}
