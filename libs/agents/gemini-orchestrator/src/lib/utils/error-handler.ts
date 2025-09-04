/**
 * @fileoverview error-handler module for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Error categories
 */
export enum ErrorCategory {
  UNKNOWN = 'unknown',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  SERVER_ERROR = 'server_error',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
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
 * Standardized error structure
 */
export interface StandardizedError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

/**
 * Gemini-specific error categories
 */
export enum GeminiErrorCategory {
  MODEL_UNAVAILABLE = 'model_unavailable',
  CONTENT_FILTER = 'content_filter',
  TOKEN_LIMIT = 'token_limit',
  TOOL_CALL_FAILURE = 'tool_call_failure',
  PARSING_ERROR = 'parsing_error',
  MCP_SERVER_UNAVAILABLE = 'mcp_server_unavailable',
  MCP_SERVER_ERROR = 'mcp_server_error',
  MCP_REQUEST_ERROR = 'mcp_request_error',
  RAG_SEARCH_ERROR = 'rag_search_error',
  RAG_PROCESSING_ERROR = 'rag_processing_error',
  RAG_EXTRACTION_ERROR = 'rag_extraction_error',
  RAG_EMBEDDING_ERROR = 'rag_embedding_error',
  RAG_INTEGRATION_ERROR = 'rag_integration_error',
}

/**
 * Categorize error based on message content
 */
export function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('econnreset')
  ) {
    return ErrorCategory.NETWORK;
  }
  if (message.includes('timeout') || message.includes('etimedout')) {
    return ErrorCategory.TIMEOUT;
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return ErrorCategory.RATE_LIMIT;
  }
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  ) {
    return ErrorCategory.VALIDATION;
  }
  if (message.includes('server error') || message.includes('internal error')) {
    return ErrorCategory.SERVER_ERROR;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Create a standardized error
 */
export function createError(
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  context?: Record<string, unknown>,
  requestId?: string,
): StandardizedError {
  const error = new Error(message) as StandardizedError;
  error.category = category;
  error.severity = severity;
  error.context = context;
  error.requestId = requestId;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Create a standardized error handler for Gemini orchestrator functions
 */
export function createGeminiErrorHandler(functionName: string, fileName: string) {
  return (
    error: Error,
    params?: Record<string, unknown>,
    requestId?: string,
    serverId?: string,
  ): StandardizedError => {
    // Handle Gemini-specific errors
    const message = error.message.toLowerCase();

    // Categorize Gemini-specific errors
    let category = ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    if (message.includes('model') && message.includes('unavailable')) {
      category = ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('content') && message.includes('filter')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('token') || message.includes('limit')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('tool') && message.includes('call')) {
      category = ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('parse') || message.includes('json')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (
      message.includes('mcp') &&
      message.includes('server') &&
      message.includes('unavailable')
    ) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('mcp') && message.includes('server')) {
      category = ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('mcp') && message.includes('request')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
    } else {
      // Use default categorization for other errors
      category = categorizeError(error);

      // Adjust severity based on category
      if (category === ErrorCategory.AUTHENTICATION || category === ErrorCategory.AUTHORIZATION) {
        severity = ErrorSeverity.HIGH;
      } else if (category === ErrorCategory.NETWORK || category === ErrorCategory.TIMEOUT) {
        severity = ErrorSeverity.MEDIUM;
      } else if (category === ErrorCategory.VALIDATION) {
        severity = ErrorSeverity.LOW;
      }
    }

    // Create enhanced error message
    const enhancedMessage = `[${functionName}@${fileName}] ${error.message}`;

    // Create context
    const context = {
      functionName,
      fileName,
      params,
      serverId,
      originalMessage: error.message,
      stack: error.stack,
    };

    return createError(enhancedMessage, category, severity, context, requestId);
  };
}

/**
 * Map unknown error to standard Error type
 */
export function mapGeminiError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error('Unknown Gemini error');
  }
}
