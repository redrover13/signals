/**
 * @fileoverview Log destination types
 */
import { LogEntry } from './log-entry';

export interface LogDestination {
  write(entry: LogEntry): void;
}
