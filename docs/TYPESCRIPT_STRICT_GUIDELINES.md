# TypeScript Strict Mode Guidelines

This document provides guidelines and best practices for working with TypeScript in strict mode. It includes common patterns, solutions for typical type errors, and examples for improving type safety throughout the codebase.

## Table of Contents

1. [Introduction to Strict Mode](#introduction-to-strict-mode)
2. [Common Type Errors and Solutions](#common-type-errors-and-solutions)
3. [Type Assertion Best Practices](#type-assertion-best-practices)
4. [Nullable Types and Handling](#nullable-types-and-handling)
5. [Function Typing](#function-typing)
6. [Using Utility Types](#using-utility-types)
7. [Type Guards](#type-guards)
8. [Advanced Type Patterns](#advanced-type-patterns)
9. [Testing and Validation](#testing-and-validation)
10. [Resources and Tools](#resources-and-tools)

## Introduction to Strict Mode

TypeScript strict mode enables a suite of type-checking options that improve the overall type safety of your codebase. It helps catch potential issues at compile time rather than runtime, leading to more reliable code.

Our project has the following strict mode options enabled in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

## Common Type Errors and Solutions

### Error: Object is possibly 'undefined' or 'null'

```typescript
// ❌ Error
function getName(user) {
  return user.name; // Error: Object is possibly 'undefined'
}

// ✅ Solution 1: Use optional chaining
function getName(user) {
  return user?.name;
}

// ✅ Solution 2: Use a type guard
function getName(user) {
  if (user) {
    return user.name;
  }
  return undefined;
}

// ✅ Solution 3: Use nullish coalescing for default values
function getName(user) {
  return user?.name ?? 'Unknown';
}
```

### Error: Parameter implicitly has 'any' type

```typescript
// ❌ Error
function processUser(user) {
  return user.id;
}

// ✅ Solution: Add explicit type annotations
interface User {
  id: string;
  name: string;
}

function processUser(user: User): string {
  return user.id;
}
```

### Error: Property does not exist on type

```typescript
// ❌ Error
function getCity(data) {
  return data.address.city;
}

// ✅ Solution: Define proper interfaces
interface Address {
  city: string;
  street: string;
}

interface User {
  name: string;
  address?: Address;
}

function getCity(data: User): string {
  return data.address?.city ?? 'Unknown';
}
```

### Error: Type has no index signature

```typescript
// ❌ Error
function getValue(obj, key) {
  return obj[key]; // Error: Element implicitly has an 'any' type because...
}

// ✅ Solution 1: Add index signature to the type
interface Dictionary<T> {
  [key: string]: T;
}

function getValue<T>(obj: Dictionary<T>, key: string): T | undefined {
  return obj[key];
}

// ✅ Solution 2: Use Record utility type
function getValue<T>(obj: Record<string, T>, key: string): T | undefined {
  return obj[key];
}
```

## Type Assertion Best Practices

Type assertions should be used sparingly and with caution. Always prefer type guards and proper type definitions over assertions.

```typescript
// ❌ Avoid unnecessary type assertions
const user = data as User;

// ✅ Use type guards instead
function isUser(obj: any): obj is User {
  return obj && typeof obj.name === 'string' && typeof obj.id === 'string';
}

if (isUser(data)) {
  // data is now typed as User
  console.log(data.name);
}

// ✅ Use `unknown` instead of `any` for better safety with assertions
function parseJson(json: string): unknown {
  return JSON.parse(json);
}

const data = parseJson('{"name":"John"}') as User;
```

## Nullable Types and Handling

TypeScript strict mode enforces explicit handling of `null` and `undefined` values.

```typescript
// ❌ Problematic nullable handling
function process(value: string | null) {
  return value.toLowerCase(); // Error: Object is possibly 'null'
}

// ✅ Solution 1: Null check
function process(value: string | null) {
  if (value === null) {
    return '';
  }
  return value.toLowerCase();
}

// ✅ Solution 2: Default value with nullish coalescing
function process(value: string | null) {
  return (value ?? '').toLowerCase();
}

// ✅ Solution 3: Use our utility types for consistent handling
import { Optional } from '@/utils/common-types';

function process(value: Optional<string>) {
  return value?.toLowerCase() ?? '';
}
```

## Function Typing

Properly typed functions make your code more maintainable and self-documenting.

```typescript
// ❌ Poorly typed function
function fetchData(id) {
  return fetch(`/api/data/${id}`).then(res => res.json());
}

// ✅ Well-typed function
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

async function fetchData(id: string): Promise<ApiResponse<UserData>> {
  const response = await fetch(`/api/data/${id}`);
  return response.json() as Promise<ApiResponse<UserData>>;
}
```

## Using Utility Types

Our codebase includes common utility types in `libs/utils/common-types/src/index.ts`. These should be used for consistency across the project.

```typescript
import {
  Optional,
  Nullable,
  ApiResponse,
  AsyncResult,
  QueryResult,
  Primitive,
  DeepPartial
} from '@/utils/common-types';

// Examples
function processData(data: Optional<UserData>): AsyncResult<ProcessedData> {
  // Implementation
}

function getUser(id: string): Promise<ApiResponse<Nullable<UserData>>> {
  // Implementation
}
```

## Type Guards

Type guards help narrow types and ensure type safety at runtime.

```typescript
// Simple type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Object type guard
interface User {
  id: string;
  name: string;
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof (obj as User).id === 'string' &&
    typeof (obj as User).name === 'string'
  );
}

// Using the type guard
function processData(data: unknown) {
  if (isUser(data)) {
    // data is now typed as User
    console.log(data.name);
  } else {
    console.error('Invalid data format');
  }
}
```

## Advanced Type Patterns

### Discriminated Unions

```typescript
type Success<T> = {
  type: 'success';
  data: T;
};

type Error = {
  type: 'error';
  error: string;
};

type Result<T> = Success<T> | Error;

function handleResult(result: Result<User>) {
  if (result.type === 'success') {
    // result is now typed as Success<User>
    console.log(result.data.name);
  } else {
    // result is now typed as Error
    console.error(result.error);
  }
}
```

### Generics with Constraints

```typescript
interface Entity {
  id: string;
}

function findById<T extends Entity>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Usage
const users: User[] = [/* ... */];
const user = findById(users, '123');
```

## Testing and Validation

### TypeScript Validation Script

Use our validation script to check for TypeScript errors:

```bash
npm run ts:analyze
```

This will generate a report of TypeScript errors in the codebase with recommendations for fixing them.

### Automatic Fixes

For some common TypeScript errors, you can use our auto-fixer script:

```bash
npm run ts:fix
```

Note that automatic fixes should be reviewed carefully before committing.

### Codacy Integration

To integrate TypeScript error checking with Codacy:

```bash
npm run ts:codacy
```

## Resources and Tools

- [TypeScript Handbook: Strict Mode](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#strictness)
- [TypeScript Deep Dive: Strict Mode](https://basarat.gitbook.io/typescript/intro/strictness)
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig)
- [Common TypeScript Errors](https://khalilstemmler.com/articles/typescript-domain-driven-design/chain-business-logic-domain-events/)

## Project-Specific Tools

- `npm run ts:analyze` - Analyze TypeScript errors
- `npm run ts:fix` - Attempt to fix common TypeScript errors
- `npm run ts:codacy` - Integrate TypeScript checking with Codacy
- `npm run ts:check:strict` - Run TypeScript compiler with strict checks

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "alwaysStrict": true
  }
}
```

## Best Practices

### Generic Types

- Always provide explicit type arguments to generic types
  ```typescript
  // ❌ BAD: Implicit any in Promise
  const getData = async () => {
    return fetchData();
  };

  // ✅ GOOD: Explicit type parameter
  const getData = async (): Promise<UserData> => {
    return fetchData();
  };
  ```

- Use the common-types library for standard patterns
  ```typescript
  import { AsyncResult, QueryResult } from '@nx-monorepo/utils/common-types';

  // Type-safe async operations
  async function processUser(id: string): Promise<AsyncResult<User>> {
    try {
      const user = await fetchUser(id);
      return { data: user, success: true };
    } catch (error) {
      return { error: error as Error, success: false };
    }
  }
  ```

- Use `unknown` instead of `any` when the type is truly unknown
  ```typescript
  // ❌ BAD: Using any
  function processData(data: any): string {
    return data.name;
  }

  // ✅ GOOD: Using unknown with type guards
  function processData(data: unknown): string {
    if (typeof data === 'object' && data !== null && 'name' in data) {
      return data.name as string;
    }
    throw new Error('Invalid data format');
  }
  ```

### Nullable and Optional Values

- Always check for null/undefined before accessing properties
  ```typescript
  // ❌ BAD: Not checking for undefined
  function getFirstItem(items: string[]): string {
    return items[0].toUpperCase();
  }

  // ✅ GOOD: Checking for undefined
  function getFirstItem(items: string[]): string {
    const item = items[0];
    if (!item) {
      throw new Error('No items available');
    }
    return item.toUpperCase();
  }
  ```

- Use optional chaining and nullish coalescing operators
  ```typescript
  // ❌ BAD: Not using optional chaining
  function getUserCity(user: User): string {
    if (user && user.address && user.address.city) {
      return user.address.city;
    }
    return 'Unknown';
  }

  // ✅ GOOD: Using optional chaining and nullish coalescing
  function getUserCity(user: User): string {
    return user?.address?.city ?? 'Unknown';
  }
  ```

### Function Parameters and Return Types

- Always define return types for functions, especially async functions
  ```typescript
  // ❌ BAD: Missing return type
  async function fetchUsers() {
    const response = await api.get('/users');
    return response.data;
  }

  // ✅ GOOD: Explicit return type
  async function fetchUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data;
  }
  ```

- Provide default values for optional parameters
  ```typescript
  // ❌ BAD: Not handling undefined
  function createUser(name: string, role?: string) {
    return {
      name,
      role: role.toUpperCase(), // Error: Object is possibly undefined
    };
  }

  // ✅ GOOD: Providing default value
  function createUser(name: string, role = 'USER') {
    return {
      name,
      role: role.toUpperCase(),
    };
  }
  ```

### Error Handling

- Use proper error typing and discriminated unions
  ```typescript
  // ❌ BAD: Using any for errors
  function handleError(error: any): string {
    return error.message;
  }

  // ✅ GOOD: Using unknown with type narrowing
  function handleError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  ```

- Avoid throwing non-Error objects
  ```typescript
  // ❌ BAD: Throwing string
  function validateInput(input: string): void {
    if (!input) {
      throw 'Input is required';
    }
  }

  // ✅ GOOD: Throwing Error object
  function validateInput(input: string): void {
    if (!input) {
      throw new Error('Input is required');
    }
  }
  ```

### Environment Variables

- Use the getEnv utility for accessing process.env
  ```typescript
  import { getEnv } from '@nx-monorepo/utils/common-types';

  // ❌ BAD: Direct access to process.env
  const apiKey = process.env.API_KEY;
  
  // ✅ GOOD: Using getEnv with type safety
  const apiKey = getEnv<string>('API_KEY');
  const maxRetries = getEnv<number>('MAX_RETRIES', 3);
  ```

## Testing Type Safety

Run TypeScript type checking to validate your code:

```bash
# Check the entire project
npx tsc --noEmit --skipLibCheck

# Check a specific file
npx tsc --noEmit --skipLibCheck path/to/file.ts
```

## Common Errors and Solutions

### Property 'x' does not exist on type 'y'

```typescript
// ❌ Error: Property 'name' does not exist on type 'unknown'
function greet(user: unknown): string {
  return `Hello, ${user.name}`;
}

// ✅ Solution: Add type guard
function greet(user: unknown): string {
  if (typeof user === 'object' && user !== null && 'name' in user) {
    return `Hello, ${(user as { name: string }).name}`;
  }
  return 'Hello, guest';
}
```

### Object is possibly 'undefined' or 'null'

```typescript
// ❌ Error: Object is possibly 'undefined'
function getFirstElement(arr: string[]): string {
  return arr[0].toUpperCase();
}

// ✅ Solution: Check for undefined
function getFirstElement(arr: string[]): string {
  if (arr.length === 0) {
    throw new Error('Array is empty');
  }
  return arr[0].toUpperCase();
}
```

### Parameter 'x' implicitly has an 'any' type

```typescript
// ❌ Error: Parameter 'data' implicitly has an 'any' type
function processData(data) {
  return data.id;
}

// ✅ Solution: Add explicit type
function processData(data: { id: string }): string {
  return data.id;
}
```
