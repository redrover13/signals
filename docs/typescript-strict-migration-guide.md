# TypeScript Strict Mode Migration Guide

## 🔍 Introduction

This guide provides a step-by-step approach for migrating the Signals project to TypeScript's strict mode. Strict mode enhances type safety by enabling additional type checks, which helps catch more errors at compile time rather than runtime.

## 📋 Benefits of Strict Mode

- **Catches more errors at compile time**: Reduces runtime errors and improves code quality
- **Improves IDE support**: Better autocompletion, navigation, and refactoring
- **Enhances code documentation**: Types serve as documentation that stays in sync with the code
- **Makes code more maintainable**: Easier to understand and refactor with confidence
- **Reduces need for runtime type checking**: Less defensive programming needed

## 🚀 Migration Strategy

The recommended approach is to enable strict mode incrementally, starting with the least disruptive checks and gradually enabling more strict checks as issues are fixed.

### Phase 1: Preparation

1. **Measure current type coverage**:
   - Run the TypeScript compiler with `--noEmit` to see current error count
   - Use `ts:check` script to check all projects

2. **Set up migration infrastructure**:
   - Create a standardized tsconfig template with strict mode enabled
   - Set up CI/CD to run type checks (but not block on strict mode errors initially)
   - Configure a separate strict mode check script (`ts:check:strict`)

3. **Choose pilot projects**:
   - Select smaller, isolated libraries to start with
   - Prioritize libraries with good test coverage

### Phase 2: Initial Strict Checks

Enable these checks first, as they're typically less disruptive:

1. **noImplicitThis** (prevents `this` with an implicit `any` type):
   ```json
   {
     "compilerOptions": {
       "noImplicitThis": true
     }
   }
   ```
   
   Common fixes:
   - Add `this` parameter annotations to functions
   - Use arrow functions to preserve `this` context

2. **strictBindCallApply** (ensures correct types for `bind`, `call`, and `apply`):
   ```json
   {
     "compilerOptions": {
       "strictBindCallApply": true
     }
   }
   ```
   
   Common fixes:
   - Ensure correct argument types when using `bind`, `call`, or `apply`

3. **noFallthroughCasesInSwitch** (prevents accidental fallthrough in switch statements):
   ```json
   {
     "compilerOptions": {
       "noFallthroughCasesInSwitch": true
     }
   }
   ```
   
   Common fixes:
   - Add `break` statements to switch cases
   - Use `// fallthrough` comments where intentional

### Phase 3: Core Strict Checks

These checks typically require more changes but provide significant benefits:

1. **noImplicitAny** (prevents variables with implicit `any` type):
   ```json
   {
     "compilerOptions": {
       "noImplicitAny": true
     }
   }
   ```
   
   Common fixes:
   - Add explicit type annotations
   - Create proper interfaces for objects
   - Use generics for collections

2. **strictNullChecks** (prevents `null` and `undefined` from being assigned to other types):
   ```json
   {
     "compilerOptions": {
       "strictNullChecks": true
     }
   }
   ```
   
   Common fixes:
   - Add null checks before using variables
   - Use optional chaining (`?.`) and nullish coalescing (`??`)
   - Use non-null assertion (`!`) where appropriate (use sparingly)
   - Use optional properties (`?:`) in interfaces

3. **noImplicitReturns** (ensures all code paths in a function return a value):
   ```json
   {
     "compilerOptions": {
       "noImplicitReturns": true
     }
   }
   ```
   
   Common fixes:
   - Add explicit return statements to all code paths
   - Use `void` return type for functions that don't return anything

### Phase 4: Advanced Strict Checks

These checks typically require more substantial changes:

1. **strictFunctionTypes** (enables contravariant checking for function types):
   ```json
   {
     "compilerOptions": {
       "strictFunctionTypes": true
     }
   }
   ```
   
   Common fixes:
   - Refine function parameter types
   - Use more specific callback types

2. **strictPropertyInitialization** (ensures class properties are initialized):
   ```json
   {
     "compilerOptions": {
       "strictPropertyInitialization": true
     }
   }
   ```
   
   Common fixes:
   - Initialize properties in constructor
   - Use non-null assertion (`!`) for properties initialized in lifecycle methods
   - Use optional properties (`?:`) for truly optional properties

3. **alwaysStrict** (ensures files are parsed in strict mode):
   ```json
   {
     "compilerOptions": {
       "alwaysStrict": true
     }
   }
   ```
   
   Common fixes:
   - Remove duplicate `"use strict"` directives

### Phase 5: Full Strict Mode

Finally, enable the `strict` flag to ensure all strict checks are enabled:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## 🛠️ Tools and Techniques

### Gradual Migration Approach

1. **Per-file opt-in**: Use `// @ts-strict-mode: true` comments (requires custom tooling)
2. **Per-project opt-in**: Enable strict mode in selected project's tsconfig
3. **Flag-by-flag approach**: Enable one strict flag at a time across the codebase

### Managing the Migration

1. **TypeScript version**: Use the latest TypeScript version for best type inference
2. **Autofix where possible**: Use tools like `ts-migrate` to autofix common issues
3. **Isolate changes**: Keep strict mode migration changes separate from feature work
4. **Track progress**: Monitor the number of remaining type errors over time

### Handling Legacy Code

1. **Targeted any**: Use `any` temporarily with `// @ts-expect-error` comments
2. **Module augmentation**: Add types for third-party modules without types
3. **Type assertions**: Use type assertions (`as`) where TypeScript's inference falls short
4. **Partial types**: Use `Partial<T>` for objects that might be incomplete

## 📊 Common Patterns and Solutions

### Nullable Properties

Before:
```typescript
interface User {
  name: string;
  email: string;
}

function sendEmail(user: User) {
  // Might fail if email is null
  return sendEmailService(user.email);
}
```

After:
```typescript
interface User {
  name: string;
  email: string | null;
}

function sendEmail(user: User) {
  if (user.email === null) {
    return false;
  }
  return sendEmailService(user.email);
}
```

### Optional Parameters

Before:
```typescript
function createUser(name, email, role) {
  // ...
}
```

After:
```typescript
function createUser(name: string, email: string, role?: string) {
  const userRole = role || 'user';
  // ...
}
```

### Handling Dynamic Properties

Before:
```typescript
function getProp(obj, prop) {
  return obj[prop];
}
```

After:
```typescript
function getProp<T, K extends keyof T>(obj: T, prop: K): T[K] {
  return obj[prop];
}
```

## 📝 Conclusion

Migrating to TypeScript's strict mode is a significant undertaking, but the benefits in terms of code quality, maintainability, and developer experience are substantial. By following this incremental approach, the migration can be completed with minimal disruption to ongoing development.
