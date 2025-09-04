# Error Handling Patterns

## Overview

This document defines standardized error handling patterns for the Signals monorepo. Consistent error handling improves debugging, monitoring, and user experience across all applications and services.

## Error Class Hierarchy

### Rule: Use Custom Error Classes

**Severity**: Error  
**Category**: Error Handling

All errors should use custom error classes that extend a base application error.

#### ✅ Compliant Examples

```typescript
// Good: Base error class with context
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Good: Domain-specific error classes
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(field: string, value: unknown, constraint: string, cause?: Error) {
    super(
      `Validation failed for field '${field}': ${constraint}`,
      {
        field,
        value,
        constraint,
      },
      cause,
    );
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(resource: string, identifier: string, cause?: Error) {
    super(
      `${resource} with identifier '${identifier}' not found`,
      {
        resource,
        identifier,
      },
      cause,
    );
  }
}

export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;
  readonly isOperational = true;

  constructor(service: string, operation: string, cause?: Error) {
    super(
      `External service '${service}' failed during '${operation}'`,
      {
        service,
        operation,
      },
      cause,
    );
  }
}

export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;
  readonly isOperational = false; // Programming error

  constructor(setting: string, expectedType: string, cause?: Error) {
    super(
      `Configuration error: '${setting}' must be ${expectedType}`,
      {
        setting,
        expectedType,
      },
      cause,
    );
  }
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Using generic Error
function validateUser(user: unknown): User {
  if (!user) {
    throw new Error('User is required'); // No context, generic error
  }
  return user as User;
}

// Bad: Throwing strings
function processOrder(order: Order): void {
  if (!order.id) {
    throw 'Order ID is required'; // Never throw strings
  }
}

// Bad: Throwing plain objects
function authenticate(token: string): void {
  if (!token) {
    throw { message: 'Token required', code: 401 }; // Not an Error instance
  }
}
```

## Async Error Handling

### Rule: Proper Promise Error Handling

**Severity**: Error  
**Category**: Error Handling

All async operations must properly handle and propagate errors.

#### ✅ Compliant Examples

```typescript
// Good: Comprehensive async error handling
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
    private readonly logger: Logger,
  ) {}

  async processOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      // Validate input
      const validatedData = await this.validateOrderData(orderData);

      // Create order
      const order = await this.orderRepository.create(validatedData);

      // Process payment
      try {
        const payment = await this.paymentService.processPayment({
          orderId: order.id,
          amount: order.totalAmount,
          method: orderData.paymentMethod,
        });

        // Update order with payment info
        return await this.orderRepository.update(order.id, {
          paymentId: payment.id,
          status: 'paid',
        });
      } catch (paymentError) {
        // Rollback order on payment failure
        await this.orderRepository.update(order.id, { status: 'payment_failed' });

        throw new ExternalServiceError(
          'PaymentService',
          'processPayment',
          paymentError instanceof Error ? paymentError : new Error(String(paymentError)),
        );
      }
    } catch (error) {
      this.logger.error('Order processing failed', {
        orderData: { ...orderData, paymentMethod: '[REDACTED]' },
        error: error instanceof Error ? error.message : String(error),
      });

      // Re-throw if it's already an AppError
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unknown errors
      throw new AppError(
        'Failed to process order',
        { orderData: orderData.id },
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private async validateOrderData(data: CreateOrderRequest): Promise<ValidatedOrderData> {
    const errors: ValidationError[] = [];

    if (!data.customerId) {
      errors.push(new ValidationError('customerId', data.customerId, 'is required'));
    }

    if (!data.items || data.items.length === 0) {
      errors.push(new ValidationError('items', data.items, 'must contain at least one item'));
    }

    if (data.totalAmount <= 0) {
      errors.push(new ValidationError('totalAmount', data.totalAmount, 'must be positive'));
    }

    if (errors.length > 0) {
      throw new ValidationError(
        'orderData',
        data,
        `Multiple validation errors: ${errors.map((e) => e.message).join(', ')}`,
      );
    }

    return data as ValidatedOrderData;
  }
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Unhandled promise rejections
async function processOrder(orderData: CreateOrderRequest): Promise<Order> {
  const order = await orderRepository.create(orderData); // Can throw, not handled
  const payment = await paymentService.processPayment(order); // Can throw, not handled
  return order;
}

// Bad: Swallowing errors
async function fetchUserData(id: string): Promise<User | null> {
  try {
    return await userService.getUser(id);
  } catch (error) {
    console.log('Error fetching user'); // Error information lost
    return null;
  }
}

// Bad: Not re-throwing after logging
async function saveData(data: any): Promise<void> {
  try {
    await database.save(data);
  } catch (error) {
    logger.error('Save failed', error);
    // Should re-throw or handle appropriately
  }
}
```

### Rule: Result Pattern for Error Handling

**Severity**: Warning  
**Category**: Error Handling

For operations where errors are expected, consider using the Result pattern.

#### ✅ Compliant Examples

```typescript
// Good: Result pattern for expected errors
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export class UserService {
  async findUser(id: string): Promise<Result<User, NotFoundError | ValidationError>> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: new ValidationError('id', id, 'must be a non-empty string'),
        };
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          error: new NotFoundError('User', id),
        };
      }

      return { success: true, data: user };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof AppError
            ? error
            : new ExternalServiceError('UserRepository', 'findById', error as Error),
      };
    }
  }
}

// Good: Using Result pattern
async function handleUserRequest(userId: string): Promise<void> {
  const result = await userService.findUser(userId);

  if (!result.success) {
    if (result.error instanceof NotFoundError) {
      // Handle not found specifically
      response.status(404).json({ message: 'User not found' });
    } else if (result.error instanceof ValidationError) {
      // Handle validation error
      response.status(400).json({ message: result.error.message });
    } else {
      // Handle other errors
      response.status(500).json({ message: 'Internal server error' });
    }
    return;
  }

  // Success case
  const user = result.data;
  response.json(user);
}
```

## Error Context and Logging

### Rule: Structured Error Logging

**Severity**: Warning  
**Category**: Error Handling

Errors should be logged with structured context information.

#### ✅ Compliant Examples

```typescript
// Good: Structured error logging
export class BigQueryService {
  constructor(private readonly logger: Logger) {}

  async executeQuery(sql: string, params?: unknown[]): Promise<unknown[]> {
    const queryId = generateId();
    const startTime = Date.now();

    this.logger.info('Executing BigQuery query', {
      queryId,
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      paramCount: params?.length ?? 0,
    });

    try {
      const [rows] = await this.bigQueryClient.query({
        query: sql,
        params,
        location: 'asia-southeast1',
      });

      const duration = Date.now() - startTime;
      this.logger.info('BigQuery query completed', {
        queryId,
        duration,
        rowCount: rows.length,
      });

      return rows;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('BigQuery query failed', {
        queryId,
        duration,
        sql: sql.substring(0, 200),
        paramCount: params?.length ?? 0,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      throw new ExternalServiceError(
        'BigQuery',
        'executeQuery',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Poor error logging
async function executeQuery(sql: string): Promise<unknown[]> {
  try {
    return await bigQueryClient.query(sql);
  } catch (error) {
    console.log('Query failed'); // No context, using console.log
    throw error;
  }
}

// Bad: Logging sensitive information
async function authenticateUser(credentials: UserCredentials): Promise<User> {
  try {
    return await authService.authenticate(credentials);
  } catch (error) {
    logger.error('Auth failed', { credentials, error }); // Logging sensitive data
    throw error;
  }
}
```

## Error Recovery and Retry Patterns

### Rule: Implement Retry Logic for Transient Errors

**Severity**: Warning  
**Category**: Error Handling

Implement retry logic for operations that may fail due to transient issues.

#### ✅ Compliant Examples

```typescript
// Good: Retry logic with exponential backoff
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RetryableOperation {
  constructor(
    private readonly config: RetryConfig,
    private readonly logger: Logger,
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    isRetryable: (error: Error) => boolean = this.defaultRetryableCheck,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();

        if (attempt > 1) {
          this.logger.info('Operation succeeded after retry', {
            operationName,
            attempt,
            totalAttempts: this.config.maxAttempts,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn('Operation failed', {
          operationName,
          attempt,
          totalAttempts: this.config.maxAttempts,
          error: lastError.message,
          willRetry: attempt < this.config.maxAttempts && isRetryable(lastError),
        });

        // Don't retry on last attempt or non-retryable errors
        if (attempt === this.config.maxAttempts || !isRetryable(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
          this.config.maxDelay,
        );

        await this.delay(delay);
      }
    }

    throw new ExternalServiceError('RetryableOperation', operationName, lastError);
  }

  private defaultRetryableCheck(error: Error): boolean {
    // Retry on network errors, timeouts, and 5xx HTTP errors
    return (
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND') ||
      (error as any).status >= 500
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Good: Usage of retry logic
export class ExternalApiClient {
  constructor(
    private readonly retryableOperation: RetryableOperation,
    private readonly httpClient: HttpClient,
  ) {}

  async fetchUserData(userId: string): Promise<UserData> {
    return this.retryableOperation.execute(
      () => this.httpClient.get(`/users/${userId}`),
      'fetchUserData',
      (error) => {
        // Custom retry logic for this operation
        return error.message.includes('timeout') || (error as any).status >= 500;
      },
    );
  }
}
```

### Rule: Circuit Breaker Pattern

**Severity**: Warning  
**Category**: Error Handling

Implement circuit breaker pattern for external service calls.

#### ✅ Compliant Examples

```typescript
// Good: Circuit breaker implementation
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private readonly config: CircuitBreakerConfig,
    private readonly logger: Logger,
  ) {}

  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new ExternalServiceError(
          'CircuitBreaker',
          operationName,
          new Error('Circuit breaker is OPEN'),
        );
      }

      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
      this.logger.info('Circuit breaker transitioning to HALF_OPEN', {
        operationName,
      });
    }

    try {
      const result = await operation();

      // Success - reset circuit breaker
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.logger.info('Circuit breaker reset to CLOSED', {
          operationName,
        });
      }

      return result;
    } catch (error) {
      this.recordFailure(operationName);
      throw error;
    }
  }

  private recordFailure(operationName: string): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;

      this.logger.warn('Circuit breaker opened', {
        operationName,
        failureCount: this.failureCount,
        recoveryTimeout: this.config.recoveryTimeout,
      });
    }
  }
}
```

These error handling patterns ensure consistent, robust error management across the Signals monorepo, improving reliability and debugging capabilities.
