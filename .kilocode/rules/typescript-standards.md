# TypeScript Coding Standards

## Overview

This document defines the TypeScript coding standards for the Signals monorepo. These rules ensure type safety, code quality, and maintainability across all TypeScript code in the project.

## Type Safety Rules

### Rule: Strict TypeScript Configuration

**Severity**: Error  
**Category**: Type Safety

All projects must use strict TypeScript configuration.

#### ✅ Compliant Examples

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### ❌ Non-Compliant Examples

```json
// Bad: Loose TypeScript configuration
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

### Rule: Explicit Return Types for Public APIs

**Severity**: Warning  
**Category**: Type Safety

Public functions and methods must have explicit return types.

#### ✅ Compliant Examples

```typescript
// Good: Explicit return types
export function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export async function fetchUserData(id: string): Promise<UserProfile | null> {
  const user = await userRepository.findById(id);
  return user ? mapToUserProfile(user) : null;
}

// Good: Generic functions with constraints
export function createService<T extends ServiceConfig>(config: T): Service<T> {
  return new Service(config);
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Implicit return types for public APIs
export function calculateTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export async function fetchUserData(id: string) {
  const user = await userRepository.findById(id);
  return user ? mapToUserProfile(user) : null;
}
```

### Rule: Avoid Any Type

**Severity**: Error  
**Category**: Type Safety

The `any` type should be avoided. Use proper types or `unknown` instead.

#### ✅ Compliant Examples

```typescript
// Good: Proper typing
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function processApiResponse<T>(response: ApiResponse<T>): T {
  if (response.status !== 200) {
    throw new Error(response.message);
  }
  return response.data;
}

// Good: Using unknown for truly unknown data
function parseJson(json: string): unknown {
  return JSON.parse(json);
}

// Good: Type guards for unknown data
function isUserProfile(data: unknown): data is UserProfile {
  return typeof data === 'object' && data !== null && 'id' in data && 'email' in data;
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Using any
function processApiResponse(response: any): any {
  return response.data;
}

// Bad: Any in function parameters
function handleEvent(event: any): void {
  console.log(event.type);
}
```

### Rule: Proper Interface Design

**Severity**: Warning  
**Category**: Type Safety

Interfaces should be well-designed with proper naming and structure.

#### ✅ Compliant Examples

```typescript
// Good: Clear, descriptive interfaces
interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly preferences: UserPreferences;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface UserPreferences {
  readonly language: 'vi' | 'en';
  readonly timezone: string;
  readonly notifications: NotificationSettings;
}

interface NotificationSettings {
  readonly email: boolean;
  readonly push: boolean;
  readonly sms: boolean;
}

// Good: Generic interfaces
interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: K): Promise<void>;
}

// Good: Extending interfaces
interface AdminUserProfile extends UserProfile {
  readonly permissions: Permission[];
  readonly lastLoginAt: Date | null;
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Vague interface names
interface Data {
  stuff: any;
  things: string[];
}

// Bad: Mutable properties without justification
interface UserProfile {
  id: string; // Should be readonly
  email: string; // Should be readonly
  name: string; // Mutable is OK for display name
}

// Bad: Overly complex single interface
interface UserEverything {
  id: string;
  email: string;
  preferences: any;
  orders: any[];
  payments: any[];
  addresses: any[];
  // ... 50 more properties
}
```

## Error Handling Rules

### Rule: Custom Error Classes

**Severity**: Warning  
**Category**: Error Handling

Use custom error classes with proper typing and context.

#### ✅ Compliant Examples

```typescript
// Good: Custom error hierarchy
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(field: string, value: unknown, constraint: string) {
    super(`Validation failed for field '${field}': ${constraint}`);
    this.context = { field, value, constraint };
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`);
    this.context = { resource, id };
  }
}

// Good: Usage with proper error handling
async function getUserProfile(id: string): Promise<UserProfile> {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('id', id, 'must be a non-empty string');
  }

  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('User', id);
  }

  return mapToUserProfile(user);
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Generic Error usage
async function getUserProfile(id: string): Promise<UserProfile> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('User not found'); // No context, generic error
  }
  return user;
}

// Bad: String throwing
function validateInput(input: string): void {
  if (!input) {
    throw 'Input is required'; // Never throw strings
  }
}
```

### Rule: Proper Async Error Handling

**Severity**: Error  
**Category**: Error Handling

Async functions must properly handle and propagate errors.

#### ✅ Compliant Examples

```typescript
// Good: Proper async error handling
async function processOrderBatch(orders: Order[]): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];

  for (const batch of chunk(orders, 10)) {
    try {
      const batchResults = await Promise.allSettled(batch.map((order) => processOrder(order)));

      results.push(
        ...batchResults.map((result) => {
          if (result.status === 'fulfilled') {
            return { success: true, data: result.value };
          } else {
            logger.error('Order processing failed', {
              error: result.reason,
              orderId: batch.find((o) => o.id)?.id,
            });
            return { success: false, error: result.reason };
          }
        }),
      );
    } catch (error) {
      logger.error('Batch processing failed', { error, batchSize: batch.length });
      throw new ProcessingError('Failed to process order batch', { cause: error });
    }
  }

  return results;
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Unhandled promise rejections
async function processOrderBatch(orders: Order[]): Promise<any[]> {
  const results = [];
  for (const order of orders) {
    results.push(await processOrder(order)); // Can throw, not handled
  }
  return results;
}

// Bad: Swallowing errors
async function fetchData(): Promise<any> {
  try {
    return await api.getData();
  } catch (error) {
    return null; // Error information lost
  }
}
```

## Utility Types and Patterns

### Rule: Use Built-in Utility Types

**Severity**: Warning  
**Category**: Type Safety

Leverage TypeScript's built-in utility types for common patterns.

#### ✅ Compliant Examples

```typescript
// Good: Using utility types
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

// Good: Omit sensitive fields
type PublicUser = Omit<User, 'password'>;

// Good: Partial for updates
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;

// Good: Required for ensuring all fields
type CompleteUser = Required<User>;

// Good: Record for key-value mappings
type UserPermissions = Record<string, boolean>;

// Good: Extract for union types
type UserRole = 'admin' | 'user' | 'guest';
type AdminRole = Extract<UserRole, 'admin'>;

// Good: Conditional types
type ApiResponse<T> = T extends string ? { message: T } : { data: T };
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Recreating utility type functionality
interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  // Manually excluding password - error-prone
}

// Bad: Any for partial updates
function updateUser(id: string, updates: any): Promise<User> {
  // Should use Partial<Pick<User, 'name' | 'email'>>
}
```

### Rule: Proper Generic Constraints

**Severity**: Warning  
**Category**: Type Safety

Generic types should have appropriate constraints.

#### ✅ Compliant Examples

```typescript
// Good: Constrained generics
interface Identifiable {
  id: string;
}

function updateEntity<T extends Identifiable>(entity: T, updates: Partial<Omit<T, 'id'>>): T {
  return { ...entity, ...updates };
}

// Good: Multiple constraints
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

function sortByDate<T extends Timestamped>(
  items: T[],
  field: keyof Timestamped = 'createdAt',
): T[] {
  return items.sort((a, b) => a[field].getTime() - b[field].getTime());
}

// Good: Conditional constraints
type EventHandler<T> = T extends string ? (message: T) => void : (data: T) => void;
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Unconstrained generics
function updateEntity<T>(entity: T, updates: any): T {
  return { ...entity, ...updates }; // No guarantee T has id
}

// Bad: Overly permissive
function processData<T extends any>(data: T): T {
  // any constraint is meaningless
  return data;
}
```

## Code Organization Rules

### Rule: Proper Type Exports

**Severity**: Warning  
**Category**: Code Organization

Types should be properly exported and organized.

#### ✅ Compliant Examples

```typescript
// Good: Organized type exports
// types/user.types.ts
export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  password: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface UserWithRole extends UserProfile {
  role: UserRole;
}

// Good: Barrel export with type keyword
// types/index.ts
export type { UserProfile, CreateUserRequest, UserWithRole } from './user.types';
export type { OrderStatus, Order } from './order.types';
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Mixed exports without type keyword
export { UserProfile } from './user.types'; // Should be export type

// Bad: Types scattered in implementation files
// user.service.ts
export interface UserProfile { ... } // Should be in types file
export class UserService { ... }
```

### Rule: Consistent Naming Conventions

**Severity**: Warning  
**Category**: Code Organization

Follow consistent naming conventions for types and interfaces.

#### ✅ Compliant Examples

```typescript
// Good: Consistent naming
interface UserProfile {} // Interface: PascalCase
type UserRole = 'admin' | 'user'; // Type alias: PascalCase
enum OrderStatus {} // Enum: PascalCase
const USER_ROLES = {} as const; // Const assertion: SCREAMING_SNAKE_CASE

// Good: Descriptive generic names
interface Repository<TEntity, TKey = string> {
  findById(id: TKey): Promise<TEntity | null>;
}

// Good: Event naming
interface UserCreatedEvent {
  type: 'user.created';
  payload: UserProfile;
  timestamp: Date;
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Inconsistent naming
interface userProfile {} // Should be PascalCase
type user_role = 'admin'; // Should be PascalCase
enum orderStatus {} // Should be PascalCase

// Bad: Generic single letters without meaning
interface Repository<T, U> {
  // T and U are not descriptive
  findById(id: U): Promise<T | null>;
}
```

## Performance and Optimization Rules

### Rule: Efficient Type Definitions

**Severity**: Warning  
**Category**: Performance

Type definitions should be efficient and avoid unnecessary complexity.

#### ✅ Compliant Examples

```typescript
// Good: Efficient union types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Good: Mapped types for transformations
type Optional<T> = {
  [K in keyof T]?: T[K];
};

// Good: Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;

// Good: Conditional types with proper distribution
type NonNullable<T> = T extends null | undefined ? never : T;
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Overly complex recursive types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[P]>
    : T[P];
}; // Too complex, hard to understand and debug

// Bad: Inefficient string literal unions
type VeryLongUnion = 'option1' | 'option2' | /* ... 100 more options */;
```

These TypeScript standards ensure type safety, maintainability, and performance across the Signals monorepo codebase.
