# Lodash-ES Migration Analysis

Generated: 9/1/2025, 10:40:20 AM

## Import Analysis

Total TypeScript Files: 230
Files with CommonJS lodash imports: 0
Files with ESM lodash imports: 1
Files with mixed lodash imports: 0

## Import Patterns

Files importing whole lodash library: 0
Files importing individual lodash functions: 1
Files with mixed import styles: 0

## Dependencies

Packages with lodash dependency: 0
Packages with lodash-es dependency: 1
Packages with both dependencies: 0
Packages with lodash types: 1

## Top Lodash Functions Used

- `memoize`: 1 occurrences

## Migration Recommendations

### 1. Use a codemod for automated migration

Consider using a codemod tool to automate the migration from lodash to lodash-es.

```javascript
# Example using jscodeshift with a custom transform
    npx jscodeshift -t transform-lodash-imports.js ./src
    
    # Or a more manual approach with search and replace
    find ./src -type f -name "*.ts" | xargs sed -i 's/require(['"]lodash['"]);/import _ from "lodash-es";/g'
```

### 2. Update tsconfig.json for proper ESM support

Ensure your TypeScript configuration properly supports ES modules.

```javascript
// In tsconfig.json
    {
      "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "NodeNext",
        "esModuleInterop": true
      }
    }
```
