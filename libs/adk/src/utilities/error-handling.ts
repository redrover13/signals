/**
 * @fileoverview error-handling module for the ADK component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains error handling utilities for ADK components.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * ADK Error types
 */
export enum ADKErrorType {
  CONFIGURATION = 'ConfigurationError',
  AUTHENTICATION = 'AuthenticationError',
  NETWORK = 'NetworkError',
  SERVICE = 'ServiceError',
  VALIDATION = 'ValidationError',
  TOOL_EXECUTION = 'ToolExecutionError',
  AGENT_EXECUTION = 'AgentExecutionError',
  UNKNOWN = 'UnknownError'
}

/**
 * ADK Error class for consistent error handling
 */
export class ADKError extends Error {
  public type: ADKErrorType;
  public details?: any;
  public timestamp: string;
  public isRetryable: boolean;
  public code?: string;

  constructor(options: {
    message: string;
    type?: ADKErrorType;
    details?: any;
    isRetryable?: boolean;
    code?: string;
    cause?: Error;
  }) {
    super(options.message);
    this.name = 'ADKError';
    this.type = options.type || ADKErrorType.UNKNOWN;
    this.details = options.details;
    this.timestamp = new Date().toISOString();
    this.isRetryable = options.isRetryable ?? false;
    this.code = options.code;
    
    // Capture original error cause if provided
    if (options.cause) {
      this.cause = options.cause;
    }
    
    // Capture stack trace
    Error.captureStackTrace(this, ADKError);
  }

  /**
   * Format error for logging
   */
  toLogFormat(): Record<string, any> {
    return {
      errorType: this.type,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      isRetryable: this.isRetryable,
      code: this.code,
      stack: this.stack,
      cause: this.cause ? 
        (this.cause instanceof Error ? 
          { message: this.cause.message, stack: this.cause.stack } : 
          this.cause) : 
        undefined
    };
  }

  /**
   * Create error from an unknown exception
   */
  static fromUnknown(error: unknown, defaultMessage = 'An unknown error occurred'): ADKError {
    if (error instanceof ADKError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ADKError({
        message: error.message,
        type: ADKErrorType.UNKNOWN,
        cause: error
      });
    }
    
    return new ADKError({
      message: typeof error === 'string' ? error : defaultMessage,
      details: error
    });
  }
  
  /**
   * Create a configuration error
   */
  static configuration(message: string, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType.CONFIGURATION,
      details
    });
  }
  
  /**
   * Create an authentication error
   */
  static authentication(message: string, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType.AUTHENTICATION,
      details,
      isRetryable: true
    });
  }
  
  /**
   * Create a network error
   */
  static network(message: string, details?: any, isRetryable = true): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType.NETWORK,
      details,
      isRetryable
    });
  }
  
  /**
   * Create a service error
   */
  static service(message: string, details?: any, isRetryable = true): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType.SERVICE,
      details,
      isRetryable
    });
  }
  
  /**
   * Create a validation error
   */
  static validation(message: string, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType.VALIDATION,
      details,
      isRetryable: false
    });
  }
  
  /**
   * Create a tool execution error
   */
  static toolExecution(message: string, toolName: string, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType.TOOL_EXECUTION,
      details: {
        toolName,
        ...details
      },
      isRetryable: true
    });
  }
  
  /**
   * Create an agent execution error
   */
  static agentExecution(message: string, agentName: string, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType.AGENT_EXECUTION,
      details: {
        agentName,
        ...details
      },
      isRetryable: true
    });
  }
}

/**
 * A global error handler for ADK components
 */
export class ADKErrorHandler {
  private static defaultHandler = (error: ADKError): void => {
    console.error(`[ADK ERROR][${error.type}] ${error.message}`, error.toLogFormat());
  };
  
  private static handler = ADKErrorHandler.defaultHandler;
  
  /**
   * Set a custom error handler
   */
  static setErrorHandler(handler: (error: ADKError) => void): void {
    ADKErrorHandler.handler = handler;
  }
  
  /**
   * Reset to the default error handler
   */
  static resetErrorHandler(): void {
    ADKErrorHandler.handler = ADKErrorHandler.defaultHandler;
  }
  
  /**
   * Handle an error
   */
  static handleError(error: unknown): void {
    const adkError = ADKError.fromUnknown(error);
    ADKErrorHandler.handler(adkError);
  }
  
  /**
   * Create a safe execution wrapper for async functions
   */
  static safeCatch<T>(
    fn: () => Promise<T>,
    errorTransformer?: (error: unknown) => ADKError
  ): Promise<T> {
    return fn().catch((error: unknown) => {
      const adkError = errorTransformer ? 
        errorTransformer(error) : 
        ADKError.fromUnknown(error);
      
      ADKErrorHandler.handler(adkError);
      throw adkError;
    });
  }
}
