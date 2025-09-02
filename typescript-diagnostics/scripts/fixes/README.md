# TypeScript Error Fixes

This directory contains scripts to fix common TypeScript errors.

## Available Fixes

### fix-name-not-found

- **Error Code:** TS2304
- **Description:** Fixes name not found errors by adding missing imports and declarations
- **Usage:** `node typescript-diagnostics/scripts/fixes/fix-name-not-found.js`

### fix-module-not-found

- **Error Code:** TS2307
- **Description:** Fixes module not found errors by installing missing dependencies and updating import paths
- **Usage:** `node typescript-diagnostics/scripts/fixes/fix-module-not-found.js`

### fix-type-assignability

- **Error Code:** TS2322
- **Description:** Fixes type assignability errors by adding type assertions and guards
- **Usage:** `node typescript-diagnostics/scripts/fixes/fix-type-assignability.js`

### fix-property-not-found

- **Error Code:** TS2339
- **Description:** Fixes property not found errors by adding optional chaining and type assertions
- **Usage:** `node typescript-diagnostics/scripts/fixes/fix-property-not-found.js`

### fix-null-checks

- **Error Code:** TS2532
- **Description:** Fixes null/undefined check errors by adding optional chaining and nullish coalescing
- **Usage:** `node typescript-diagnostics/scripts/fixes/fix-null-checks.js`


## How to Use

1. Run the main analysis script:
   ```
   node typescript-diagnostics/scripts/fix-common-errors.js
   ```

2. Review the generated fix scripts in this directory

3. Run individual fix scripts as needed:
   ```
   node typescript-diagnostics/scripts/fixes/fix-name-not-found.js
   ```

4. Or apply all fixes at once:
   ```
   node typescript-diagnostics/scripts/fix-common-errors.js --apply
   ```
