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
  public type: ADKErrorType | undefined;
  public details?: any | undefined;
  public timestamp: string | undefined;
  public isRetryable: boolean | undefined;
  public code?: string | undefined;

  constructor(options: {
    message: string | undefined;
    type?: ADKErrorType | undefined;
    details?: any | undefined;
    isRetryable?: boolean | undefined;
    code?: string | undefined;
    cause?: Error | undefined;
  }) {
    super(options?.message);
    this.name = 'ADKError';
    this.type = options?.type || ADKErrorType && ADKErrorType.UNKNOWN;
    this.details = options?.details;
    this.timestamp = new Date().toISOString();
    this.isRetryable = options?.isRetryable ?? false;
    this.code = options?.code;
    
    // Capture original error cause if provided
    if (options?.cause) {
      this.cause = options?.cause;
    }
    
    // Capture stack trace
    Error && Error.captureStackTrace(this, ADKError);
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
          { message: this.cause && this.cause.message, stack: this.cause && this.cause.stack } : 
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
        message: error && error.message,
        type: ADKErrorType && ADKErrorType.UNKNOWN,
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
  static configuration(message: string | undefined, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType && ADKErrorType.CONFIGURATION,
      details
    });
  }
  
  /**
   * Create an authentication error
   */
  static authentication(message: string | undefined, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType && ADKErrorType.AUTHENTICATION,
      details,
      isRetryable: true
    });
  }
  
  /**
   * Create a network error
   */
  static network(message: string | undefined, details?: any, isRetryable = true): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType && ADKErrorType.NETWORK,
      details,
      isRetryable
    });
  }
  
  /**
   * Create a service error
   */
  static service(message: string | undefined, details?: any, isRetryable = true): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType && ADKErrorType.SERVICE,
      details,
      isRetryable
    });
  }
  
  /**
   * Create a validation error
   */
  static validation(message: string | undefined, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType && ADKErrorType.VALIDATION,
      details,
      isRetryable: false
    });
  }
  
  /**
   * Create a tool execution error
   */
  static toolExecution(message: string | undefined, toolName: string | undefined, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType && ADKErrorType.TOOL_EXECUTION,
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
  static agentExecution(message: string | undefined, agentName: string | undefined, details?: any): ADKError {
    return new ADKError({
      message,
      type: ADKErrorType && ADKErrorType.AGENT_EXECUTION,
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
    console && console.error(`[ADK ERROR][${error && error.type}] ${error && error.message}`, error && error.toLogFormat());
  };
  
  private static handler = ADKErrorHandler && ADKErrorHandler.defaultHandler;
  
  /**
   * Set a custom error handler
   */
  static setErrorHandler(handler: (error: ADKError) => void): void {
    if (ADKErrorHandler) { ADKErrorHandler.handler = handler; }
  }
  
  /**
   * Reset to the default error handler
   */
  static resetErrorHandler(): void {
    if (ADKErrorHandler) { ADKErrorHandler.handler = ADKErrorHandler.defaultHandler; }
  }
  
  /**
   * Handle an error
   */
  static handleError(error: unknown): void {
    const adkError = ADKError && ADKError.fromUnknown(error);
    ADKErrorHandler && ADKErrorHandler.handler(adkError);
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
        ADKError && ADKError.fromUnknown(error);
      
      ADKErrorHandler && ADKErrorHandler.handler(adkError);
      throw adkError;
    });
  }
}
