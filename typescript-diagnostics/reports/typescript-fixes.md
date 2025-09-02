# TypeScript Error Fixes

Generated: 9/1/2025, 10:40:20 AM

## Error Analysis

Total Errors: 601

### Top Error Types

- **TS2307**: 83 occurrences - Cannot find module '...' or its corresponding type declarations.
  - Example: Cannot find module '@google-cloud/vertexai' or its corresponding type declarations.

- **TS2339**: 80 occurrences - Property '...' does not exist on type '...'.
  - Example: Property 'error' does not exist on type 'never'.

- **TS2345**: 71 occurrences - Argument of type '...' is not assignable to parameter of type '...'.
  - Example: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

- **TS2322**: 40 occurrences - Type '...' is not assignable to type '...'.
  - Example: Type 'string | undefined' is not assignable to type 'string'.

- **TS6133**: 38 occurrences - '...' is declared but its value is never read.
  - Example: 'GenModel' is declared but its value is never read.

- **TS7006**: 36 occurrences - Parameter '...' implicitly has an '...' type.
  - Example: Parameter 'table' implicitly has an 'any' type.

- **TS18048**: 36 occurrences - '...' is possibly '...'.
  - Example: 'parts' is possibly 'undefined'.

- **TS2532**: 22 occurrences - Object is possibly '...'.
  - Example: Object is possibly 'undefined'.

- **TS2305**: 19 occurrences - Module '...' has no exported member '...'.
  - Example: Module '"@google/generative-ai"' has no exported member 'GenModel'.

- **TS2363**: 18 occurrences - The right-hand side of an arithmetic operation must be of type '...', '...', '...' or an enum type.
  - Example: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.

## Generated Fix Scripts

### fix-name-not-found

- **Error Code:** TS2304
- **Description:** Fixes name not found errors by adding missing imports and declarations
- **Path:** `typescript-diagnostics/scripts/fixes/fix-name-not-found.js`

### fix-module-not-found

- **Error Code:** TS2307
- **Description:** Fixes module not found errors by installing missing dependencies and updating import paths
- **Path:** `typescript-diagnostics/scripts/fixes/fix-module-not-found.js`

### fix-type-assignability

- **Error Code:** TS2322
- **Description:** Fixes type assignability errors by adding type assertions and guards
- **Path:** `typescript-diagnostics/scripts/fixes/fix-type-assignability.js`

### fix-property-not-found

- **Error Code:** TS2339
- **Description:** Fixes property not found errors by adding optional chaining and type assertions
- **Path:** `typescript-diagnostics/scripts/fixes/fix-property-not-found.js`

### fix-null-checks

- **Error Code:** TS2532
- **Description:** Fixes null/undefined check errors by adding optional chaining and nullish coalescing
- **Path:** `typescript-diagnostics/scripts/fixes/fix-null-checks.js`
