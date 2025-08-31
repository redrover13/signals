/**
 * @fileoverview Common type definitions for consistent typing across the codebase
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains utility types to ensure consistency and type safety.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Standard API response type with generic payload
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

/**
 * Type for safely handling nullable values
 */
export type Nullable<T> = T | null;

/**
 * Type for safely handling undefined values
 */
export type Optional<T> = T | undefined;

/**
 * Type for environment variables with strict typing
 */
export type EnvVar<T = string> = T | undefined;

/**
 * Type-safe access to process.env
 */
export const getEnv = <T = string>(key: string, defaultValue?: T): T => {
  const value = process.env[key];
  return (value !== undefined ? value : defaultValue) as T;
};

/**
 * Type for record with unknown values
 */
export type UnknownRecord = Record<string, unknown>;

/**
 * Result type for asynchronous operations
 */
export interface AsyncResult<T, E = Error> {
  data?: T;
  error?: E;
  success: boolean;
}

/**
 * Type for BigQuery query results
 */
export type QueryResult<T = UnknownRecord> = T[];

/**
 * Type for upload results
 */
export interface UploadResult {
  url: string;
  contentType: string;
  size: number;
}

/**
 * Type for signal pattern used in the codebase
 */
export interface Signal<T> {
  value: T;
  subscribe: (callback: (value: T) => void) => () => void;
  update: (updater: (value: T) => T) => void;
}

/**
 * Type for standard agent response
 */
export interface AgentResult<T> {
  data: T;
  metadata?: UnknownRecord;
}
