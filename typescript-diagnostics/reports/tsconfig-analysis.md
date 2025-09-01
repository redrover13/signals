# TypeScript Configuration Analysis

Generated: 9/1/2025, 10:40:20 AM

## Configuration Overview

Total TypeScript configurations: 103
Configurations extending another config: 98
Configurations not extending any config: 4

## Inconsistent Settings

### target

- Value: `"ES2020"`
  - Used in 1 configs: apps/cloud-functions/rag-processor/tsconfig.json
- Value: `"ES2022"`
  - Used in 1 configs: tsconfig.base.json
- Value: `"ESNext"`
  - Used in 1 configs: typescript-diagnostics/configs/tsconfig.base.template.json

### moduleResolution

- Value: `"node"`
  - Used in 2 configs: apps/cloud-functions/rag-processor/tsconfig.json, tsconfig.base.json
- Value: `"NodeNext"`
  - Used in 1 configs: typescript-diagnostics/configs/tsconfig.base.template.json

### outDir

- Value: `"./dist"`
  - Used in 1 configs: apps/cloud-functions/rag-processor/tsconfig.json
- Value: `"./dist/out-tsc"`
  - Used in 1 configs: tsconfig.base.json

### rootDir

- Value: `"./src"`
  - Used in 1 configs: apps/cloud-functions/rag-processor/tsconfig.json
- Value: `"."`
  - Used in 1 configs: tsconfig.base.json

## Recommendations

### Base Configuration

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "paths": {
      "@nx-monorepo/*": [
        "libs/*"
      ],
      "@nx-monorepo/adk": [
        "libs/adk/src/index.ts"
      ],
      "@nx-monorepo/agents-sdk": [
        "libs/agents-sdk/src/index.ts"
      ],
      "@nx-monorepo/gcp": [
        "libs/gcp/src/index.ts"
      ],
      "@nx-monorepo/utils/signals": [
        "libs/utils/signals/src/index.ts"
      ],
      "@nx-monorepo/utils/common-types": [
        "libs/utils/common-types/src/index.ts"
      ],
      "@nx-monorepo/security": [
        "libs/security/src/index.ts"
      ]
    }
  }
}
```

### Application Configuration

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "types": [
      "node"
    ]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "test",
    "**/*.spec.ts"
  ]
}
```

### Library Configuration

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "test",
    "**/*.spec.ts"
  ]
}
```

### Test Configuration

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": [
      "jest",
      "node"
    ]
  },
  "include": [
    "test/**/*",
    "**/*.spec.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```
