# TypeScript Diagnostic Summary

Generated: 9/1/2025, 10:40:18 AM
TypeScript Version: Version 5.9.2

## Error Overview

Total Errors: 601
Files with Errors: 67

## Top Error Categories

- TS2307: Cannot find module '@google-cloud/vertexai' or its corresponding type declarations. (83 occurrences)
- TS2339: Property 'error' does not exist on type 'never'. (80 occurrences)
- TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'. (71 occurrences)
- TS2322: Type 'string | undefined' is not assignable to type 'string'. (40 occurrences)
- TS6133: 'GenModel' is declared but its value is never read. (38 occurrences)

## Configuration Issues

- Found 0 TypeScript configuration issues
- Found 10 module system inconsistencies

## Recommendations

### Cannot find module

Run 'pnpm install' to update dependencies and ensure type definitions are installed.

### Type '(.+)' is not assignable to type

Review type definitions and ensure proper types are used for variables and function parameters.

### Property '(.+)' does not exist on type

Add proper interface or type definitions for objects.

### Cannot find name '(.+)'

Ensure all variables are properly declared before use.

### Object is possibly 'null' or 'undefined'

Add null checks or use optional chaining (?.) and nullish coalescing (??) operators.

### CommonJS usage in ESM context

Standardize on ES modules by replacing require() with import statements.

### General TypeScript configuration

Standardize TypeScript configuration across all packages with a base tsconfig.json.
