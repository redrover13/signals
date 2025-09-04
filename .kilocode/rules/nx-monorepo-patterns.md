# NX Monorepo Patterns and Standards

## Overview

This document defines the coding patterns and standards specific to NX monorepo development within the Signals project. These rules ensure proper project boundaries, dependency management, and consistent architecture across the monorepo.

## Project Structure Rules

### Rule: Proper Library Organization

**Severity**: Error  
**Category**: Architecture

Libraries must be organized by domain and scope, not by technical layer.

#### ✅ Compliant Examples

```typescript
// Good: Domain-based organization
libs/
  gcp/                    // GCP integrations
    src/lib/
      bigquery/
      storage/
      secret-manager/
  agents/                 // AI agents domain
    src/lib/
      gemini-orchestrator/
      reviews-agent/
  data-models/           // Shared data models
    src/lib/
      user/
      order/
      inventory/
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Technical layer organization
libs/
  services/              // Too generic
  utils/                 // Catch-all anti-pattern
  components/            // Mixed concerns
  helpers/               // Vague purpose
```

### Rule: Explicit Dependency Declaration

**Severity**: Error  
**Category**: Dependencies

All dependencies must be explicitly declared in the consuming project's `package.json`.

#### ✅ Compliant Examples

```json
// libs/gcp/package.json
{
  "dependencies": {
    "@google-cloud/bigquery": "8.1.1",
    "@google-cloud/storage": "7.16.0"
  }
}

// apps/cloud-functions/social-api/package.json
{
  "dependencies": {
    "@nx-monorepo/gcp": "*",
    "fastify": "^5.5.0"
  }
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Importing without declaring dependency
import { BigQuery } from '@google-cloud/bigquery'; // Not in package.json
```

### Rule: Barrel Export Pattern

**Severity**: Warning  
**Category**: Code Organization

Libraries must use barrel exports (`index.ts`) to provide clean public APIs.

#### ✅ Compliant Examples

```typescript
// libs/gcp/src/index.ts
export * from './lib/bigquery';
export * from './lib/storage';
export { GCPConfig } from './lib/config';

// libs/gcp/src/lib/bigquery/index.ts
export { BigQueryService } from './bigquery.service';
export { BigQueryError } from './bigquery.error';
export type { BigQueryConfig, QueryResult } from './bigquery.types';
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Direct imports from internal modules
import { BigQueryService } from '@nx-monorepo/gcp/src/lib/bigquery/bigquery.service';

// Good: Import from barrel
import { BigQueryService } from '@nx-monorepo/gcp';
```

## NX Project Configuration Rules

### Rule: Proper Project Tags

**Severity**: Warning  
**Category**: Architecture

All projects must have appropriate tags for dependency constraints and graph visualization.

#### ✅ Compliant Examples

```json
// libs/gcp/project.json
{
  "tags": ["scope:gcp", "type:lib", "platform:node"]
}

// apps/frontend-agents/project.json
{
  "tags": ["scope:frontend", "type:app", "platform:web"]
}

// libs/agents/project.json
{
  "tags": ["scope:agents", "type:lib", "platform:node", "ai:enabled"]
}
```

#### ❌ Non-Compliant Examples

```json
// Bad: No tags or generic tags
{
  "tags": []
}

{
  "tags": ["lib"] // Too generic
}
```

### Rule: Dependency Constraints

**Severity**: Error  
**Category**: Architecture

Projects must respect dependency constraints based on their tags.

#### ✅ Compliant Examples

```typescript
// Frontend app can depend on frontend libs
// apps/frontend-agents (scope:frontend)
import { UserService } from '@nx-monorepo/user-lib'; // scope:frontend

// Backend service can depend on GCP libs
// apps/cloud-functions/social-api (scope:backend)
import { BigQueryService } from '@nx-monorepo/gcp'; // scope:gcp
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Frontend depending on backend-specific libs
// apps/frontend-agents (scope:frontend)
import { BigQueryService } from '@nx-monorepo/gcp'; // scope:gcp - VIOLATION
```

## Code Generation Rules

### Rule: Use NX Generators

**Severity**: Warning  
**Category**: Code Generation

New projects, libraries, and components should be created using NX generators.

#### ✅ Compliant Examples

```bash
# Good: Using NX generators
nx g @nx/node:lib gcp-utils --directory=libs/gcp-utils
nx g @nx/react:component UserProfile --project=frontend-agents
nx g @nx/node:app new-api --directory=apps/new-api
```

#### ❌ Non-Compliant Examples

```bash
# Bad: Manual creation
mkdir libs/new-lib
touch libs/new-lib/src/index.ts
```

### Rule: Consistent Project Structure

**Severity**: Error  
**Category**: Code Organization

All projects must follow the standard NX project structure.

#### ✅ Compliant Examples

```
libs/example-lib/
├── src/
│   ├── lib/
│   │   ├── example-lib.ts
│   │   └── example-lib.spec.ts
│   └── index.ts
├─�� project.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
└── jest.config.ts
```

#### ❌ Non-Compliant Examples

```
libs/example-lib/
├── example-lib.ts        # Bad: Files in root
├── tests/               # Bad: Separate test directory
│   └── example.test.ts
└── package.json         # Bad: Individual package.json without proper setup
```

## Testing Rules

### Rule: Co-located Tests

**Severity**: Warning  
**Category**: Testing

Test files should be co-located with their source files using the `.spec.ts` extension.

#### ✅ Compliant Examples

```
libs/gcp/src/lib/
├── bigquery/
│   ├── bigquery.service.ts
│   ├── bigquery.service.spec.ts
│   ├── bigquery.types.ts
│   └── index.ts
```

#### ❌ Non-Compliant Examples

```
libs/gcp/
├── src/lib/bigquery/
│   └── bigquery.service.ts
└── tests/                    # Bad: Separate test directory
    └── bigquery.test.ts      # Bad: Different naming convention
```

### Rule: Jest Configuration

**Severity**: Error  
**Category**: Testing

Each project must have its own Jest configuration that extends the workspace preset.

#### ✅ Compliant Examples

```typescript
// libs/gcp/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  displayName: 'gcp',
  preset: '../../jest.preset.cjs',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/gcp',
};

export default config;
```

## Build and Deployment Rules

### Rule: Proper Build Configuration

**Severity**: Error  
**Category**: Build

All buildable projects must have proper build configuration in their `project.json`.

#### ✅ Compliant Examples

```json
// libs/gcp/project.json
{
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/gcp",
        "main": "libs/gcp/src/index.ts",
        "tsConfig": "libs/gcp/tsconfig.lib.json",
        "assets": ["libs/gcp/*.md"]
      }
    }
  }
}
```

### Rule: Affected Commands Usage

**Severity**: Warning  
**Category**: Performance

CI/CD pipelines should use NX affected commands for efficiency.

#### ✅ Compliant Examples

```yaml
# .github/workflows/ci.yml
- name: Run affected tests
  run: pnpm nx affected --target=test --parallel

- name: Build affected projects
  run: pnpm nx affected --target=build --parallel
```

#### ❌ Non-Compliant Examples

```yaml
# Bad: Running all tests regardless of changes
- name: Run all tests
  run: pnpm nx run-many --target=test --all
```

## Import Rules

### Rule: Path Mapping Usage

**Severity**: Warning  
**Category**: Code Organization

Use TypeScript path mapping for clean imports instead of relative paths.

#### ✅ Compliant Examples

```typescript
// Good: Using path mapping
import { BigQueryService } from '@nx-monorepo/gcp';
import { UserProfile } from '@nx-monorepo/data-models';

// Good: Relative imports within the same library
import { validateUser } from './user.validator';
import { UserError } from '../errors/user.error';
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Long relative paths across libraries
import { BigQueryService } from '../../../libs/gcp/src/lib/bigquery/bigquery.service';
```

### Rule: Circular Dependency Prevention

**Severity**: Error  
**Category**: Architecture

Libraries must not have circular dependencies.

#### ✅ Compliant Examples

```typescript
// Good: Clear dependency hierarchy
// libs/data-models -> no dependencies on other libs
// libs/gcp -> depends on data-models
// libs/agents -> depends on gcp, data-models
// apps/api -> depends on agents, gcp, data-models
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Circular dependency
// libs/gcp imports from libs/agents
// libs/agents imports from libs/gcp
```

## Performance Rules

### Rule: Lazy Loading

**Severity**: Warning  
**Category**: Performance

Large libraries should support lazy loading where appropriate.

#### ✅ Compliant Examples

```typescript
// Good: Lazy loading for optional features
export async function getAdvancedAnalytics() {
  const { AdvancedAnalytics } = await import('./advanced-analytics');
  return new AdvancedAnalytics();
}
```

### Rule: Bundle Size Monitoring

**Severity**: Warning  
**Category**: Performance

Applications should monitor and optimize bundle sizes.

#### ✅ Compliant Examples

```json
// project.json
{
  "targets": {
    "bundle-analyzer": {
      "executor": "@nx/webpack:webpack",
      "options": {
        "webpackConfig": "webpack.analyzer.config.js"
      }
    }
  }
}
```

## Documentation Rules

### Rule: README Requirements

**Severity**: Warning  
**Category**: Documentation

Each library and application must have a comprehensive README.md.

#### ✅ Compliant Examples

```markdown
# @nx-monorepo/gcp

Google Cloud Platform integration library for the Signals monorepo.

## Features

- BigQuery service wrapper
- Cloud Storage utilities
- Secret Manager integration

## Usage

\`\`\`typescript
import { BigQueryService } from '@nx-monorepo/gcp';

const bq = new BigQueryService(config);
const results = await bq.query('SELECT \* FROM table');
\`\`\`

## Configuration

See [Configuration Guide](./docs/configuration.md)
```

These NX monorepo patterns ensure consistent, maintainable, and scalable code organization across the Signals project.
