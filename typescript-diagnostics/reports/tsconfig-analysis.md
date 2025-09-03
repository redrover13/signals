# TypeScript Configuration Analysis

Generated: 9/3/2025, 2:59:12 PM

## Configuration Overview

Total TypeScript configurations: 124
Configurations extending another config: 121
Configurations not extending any config: 3

## Inconsistent Settings

### target

- Value: `"ES2022"`
  - Used in 1 configs: tsconfig.base.json
- Value: `"ESNext"`
  - Used in 1 configs: typescript-diagnostics/configs/tsconfig.base.template.json

### module

- Value: `"NodeNext"`
  - Used in 1 configs: tsconfig.base.json
- Value: `"ESNext"`
  - Used in 1 configs: typescript-diagnostics/configs/tsconfig.base.template.json

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
    "paths": {
      "@dulce/gcp": [
        "libs/gcp/src/index.ts"
      ],
      "@dulce-de-saigon/security": [
        "libs/security/src/index.ts"
      ],
      "@dulce/*": [
        "libs/*"
      ],
      "@dulce/adk": [
        "libs/adk/src/index.ts"
      ],
      "@dulce/agents": [
        "libs/agents/src/index.ts"
      ],
      "@dulce/agents/gemini-orchestrator": [
        "libs/agents/gemini-orchestrator/src/index.ts"
      ],
      "@dulce/agents/bq-agent": [
        "libs/agents/bq-agent/src/index.ts"
      ],
      "@dulce/agents/content-agent": [
        "libs/agents/content-agent/src/index.ts"
      ],
      "@dulce/agents/crm-agent": [
        "libs/agents/crm-agent/src/index.ts"
      ],
      "@dulce/agents/looker-agent": [
        "libs/agents/looker-agent/src/index.ts"
      ],
      "@dulce/agents/reviews-agent": [
        "libs/agents/reviews-agent/src/index.ts"
      ],
      "@dulce/agents-sdk": [
        "libs/agents-sdk/src/index.ts"
      ],
      "@dulce/build-tools": [
        "libs/build-tools/src/index.ts"
      ],
      "@dulce/gcp/*": [
        "libs/gcp/src/*"
      ],
      "@dulce/mcp": [
        "libs/mcp/src/index.ts"
      ],
      "@dulce/utils/api-clients": [
        "libs/utils/api-clients/src/index.ts"
      ],
      "@dulce/utils/gcp-auth": [
        "libs/utils/gcp-auth/src/index.ts"
      ],
      "@dulce/utils/monitoring": [
        "libs/utils/monitoring/src/index.ts"
      ],
      "@dulce/utils/signals": [
        "libs/utils/signals/src/index.ts"
      ],
      "@dulce/data-models": [
        "libs/data-models/schemas/src/index.ts"
      ],
      "@dulce/data-models/dbt-models": [
        "libs/data-models/dbt-models/src/index.ts"
      ],
      "@dulce/data-models/schemas": [
        "libs/data-models/schemas/src/index.ts"
      ],
      "@dulce/env": [
        "libs/env/src/index.ts"
      ],
      "@dulce/security": [
        "libs/security/src/index.ts"
      ],
      "@dulce/ui/components": [
        "libs/ui/components/src/index.ts"
      ],
      "@dulce/utils/secrets-manager": [
        "libs/utils/secrets-manager/src/index.ts"
      ],
      "@dulce/utils/common-types": [
        "libs/utils/common-types/src/index.ts"
      ],
      "@dulce/gcp-core": [
        "libs/gcp-core/src/index.ts"
      ],
      "@dulce/utils/gcp-auth-bigquery": [
        "libs/utils/gcp-auth-bigquery/src/index.ts"
      ],
      "@dulce/utils/gcp-auth-firestore": [
        "libs/utils/gcp-auth-firestore/src/index.ts"
      ],
      "@dulce/utils/gcp-auth-pubsub": [
        "libs/utils/gcp-auth-pubsub/src/index.ts"
      ],
      "@dulce/utils/gcp-auth-secret-manager": [
        "libs/utils/gcp-auth-secret-manager/src/index.ts"
      ],
      "@dulce/utils/gcp-auth-storage": [
        "libs/utils/gcp-auth-storage/src/index.ts"
      ],
      "@dulce/utils/gcp-auth-vertex-ai": [
        "libs/utils/gcp-auth-vertex-ai/src/index.ts"
      ]
    },
    "allowSyntheticDefaultImports": true
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
