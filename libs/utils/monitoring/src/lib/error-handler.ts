/**
 * @fileoverview error-handler module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Standardized Error Handling Utility for MCP Services
 * Provides consistent error handling patterns across the codebase
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Standardized error interface
 */
export interface StandardizedError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: {
    function: string;
    file: string;
    params?: Record<string, unknown>;
    timestamp: Date;
    requestId?: string;
    serverId?: string;
  };
  originalError?: Error;
  retryable: boolean;
  userMessage?: string; // Vietnamese-friendly message
}

/**
 * Error recovery options
 */
export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  fallbackAction?: () => Promise<unknown>;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Create a standardized error
 */
export function createError(
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  context: {
    function: string;
    file: string;
    params?: Record<string, unknown>;
    requestId?: string;
    serverId?: string;
  },
  originalError?: Error,
  userMessage?: string,
): StandardizedError {
  const error = new Error(message) as StandardizedError;

  error.category = category;
  error.severity = severity;
  error.context = {
    ...context,
    timestamp: new Date(),
  };
  error.originalError = originalError;
  error.retryable = isRetryableError(category);
  error.userMessage = userMessage;

  return error;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(category: ErrorCategory): boolean {
  return [
    ErrorCategory.NETWORK,
    ErrorCategory.TIMEOUT,
    ErrorCategory.RATE_LIMIT,
    ErrorCategory.SERVER_ERROR,
  ].includes(category);
}

/**
 * Categorize an error based on its characteristics
 */
export function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('econnrefused')
  ) {
    return ErrorCategory.NETWORK;
  }

  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  ) {
    return ErrorCategory.VALIDATION;
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return ErrorCategory.TIMEOUT;
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return ErrorCategory.RATE_LIMIT;
  }

  if (message.includes('config') || message.includes('environment')) {
    return ErrorCategory.CONFIGURATION;
  }

  if (message.includes('server error') || message.includes('internal error')) {
    return ErrorCategory.SERVER_ERROR;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get Vietnamese error message
 */
export function getVietnameseMessage(category: ErrorCategory): string {
  const messages = {
    [ErrorCategory.NETWORK]: 'Lỗi kết nối mạng. Vui lòng thử lại sau.',
    [ErrorCategory.AUTHENTICATION]: 'Lỗi xác thực. Vui lòng kiểm tra thông tin đăng nhập.',
    [ErrorCategory.VALIDATION]: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra thông tin đầu vào.',
    [ErrorCategory.CONFIGURATION]: 'Lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.',
    [ErrorCategory.TIMEOUT]: 'Yêu cầu bị hết thời gian chờ. Vui lòng thử lại.',
    [ErrorCategory.RATE_LIMIT]: 'Quá nhiều yêu cầu. Vui lòng chờ và thử lại sau.',
    [ErrorCategory.SERVER_ERROR]: 'Lỗi máy chủ. Vui lòng thử lại sau.',
    [ErrorCategory.UNKNOWN]: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
  };

  return messages[category];
}

/**
 * Enhanced try-catch wrapper with standardized error handling
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  context: {
    function: string;
    file: string;
    params?: Record<string, unknown>;
    requestId?: string;
    serverId?: string;
  },
  options: ErrorRecoveryOptions = {},
): Promise<T> {
  const { maxRetries = 0, retryDelay = 1000, exponentialBackoff = false } = options;

  let lastError: Error;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const originalError = error as Error;
      lastError = originalError;

      const category = categorizeError(originalError);
      const severity = getSeverityFromCategory(category);

      const standardizedError = createError(
        originalError.message,
        category,
        severity,
        context,
        originalError,
        getVietnameseMessage(category),
      );

      // Log the error with context
      logError(standardizedError);

      // Check if we should retry
      if (attempt < maxRetries && standardizedError.retryable) {
        attempt++;

        if (options.onRetry) {
          options.onRetry(attempt, standardizedError);
        }

        // Calculate delay with optional exponential backoff
        const delay = exponentialBackoff ? retryDelay * Math.pow(2, attempt - 1) : retryDelay;

        await sleep(delay);
        continue;
      }

      // If we have a fallback action and no more retries
      if (options.fallbackAction && attempt === maxRetries) {
        try {
          return (await options.fallbackAction()) as T;
        } catch (fallbackError) {
          console.warn('Fallback action failed:', fallbackError);
        }
      }

      throw standardizedError;
    }
  }

  throw lastError!;
}

/**
 * Get severity based on category
 */
function getSeverityFromCategory(category: ErrorCategory): ErrorSeverity {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.CONFIGURATION:
      return ErrorSeverity.HIGH;
    case ErrorCategory.VALIDATION:
      return ErrorSeverity.MEDIUM;
    case ErrorCategory.NETWORK:
    case ErrorCategory.TIMEOUT:
    case ErrorCategory.RATE_LIMIT:
      return ErrorSeverity.LOW;
    case ErrorCategory.SERVER_ERROR:
      return ErrorSeverity.CRITICAL;
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Log error with appropriate level and context
 */
export function logError(error: StandardizedError): void {
  const logLevel = getLogLevel(error.severity);
  const logMessage = formatErrorLog(error);

  switch (logLevel) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'info':
      console.info(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

/**
 * Get log level based on severity
 */
function getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'debug' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'debug';
  }
}

/**
 * Format error for logging
 */
function formatErrorLog(error: StandardizedError): string {
  return JSON.stringify(
    {
      message: error.message,
      category: error.category,
      severity: error.severity,
      context: error.context,
      stack: error.stack,
      originalError: error.originalError?.message,
      userMessage: error.userMessage,
    },
    null,
    2,
  );
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create error handler for specific service/module
 */
export function createServiceErrorHandler(serviceName: string, fileName: string) {
  return {
    async withRetry<T>(
      fn: () => Promise<T>,
      functionName: string,
      params?: Record<string, unknown>,
      options?: ErrorRecoveryOptions,
    ): Promise<T> {
      return withErrorHandler(
        fn,
        {
          function: `${serviceName}.${functionName}`,
          file: fileName,
          params,
        },
        options,
      );
    },

    createError: (
      message: string,
      category: ErrorCategory,
      severity: ErrorSeverity,
      functionName: string,
      params?: Record<string, unknown>,
      originalError?: Error,
      userMessage?: string,
    ) =>
      createError(
        message,
        category,
        severity,
        {
          function: `${serviceName}.${functionName}`,
          file: fileName,
          params,
        },
        originalError,
        userMessage,
      ),
  };
}
