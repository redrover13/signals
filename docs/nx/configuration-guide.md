# NX Monorepo Configuration Guide

This document provides a comprehensive guide to the NX monorepo configuration implemented in the Dulce de Saigon project.

## Project Structure

The monorepo is organized into the following directories:

- `apps/`: Contains application projects that are deployable
- `libs/`: Contains library projects that are shared between applications
- `tools/`: Contains utility scripts and tools for managing the monorepo
- `infra/`: Contains infrastructure-related code (Terraform, etc.)
- `docs/`: Contains documentation

## Project Configuration

All projects in the monorepo are configured with a `project.json` file that follows this structure:

```json
{
  "name": "project-name",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "path/to/src",
  "projectType": "library|application",
  "implicitDependencies": [],
  "targets": {
    "build": { ... },
    "lint": { ... },
    "test": { ... }
  },
  "tags": ["domain:value", "type:lib|app"],
  "namedInputs": { ... }
}
```

### Caching Strategy

NX uses a sophisticated caching mechanism to avoid rebuilding, retesting, or relinting projects that haven't changed. Our configuration uses named inputs to optimize caching:

```json
"namedInputs": {
  "default": ["{projectRoot}/**/*", "sharedGlobals"],
  "production": [
    "default",
    "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
    "!{projectRoot}/tsconfig.spec.json",
    "!{projectRoot}/jest.config.[jt]s",
    "!{projectRoot}/.eslintrc.json"
  ],
  "sharedGlobals": []
}
```

This configuration:
- Includes all files in the project directory by default
- Excludes test files from production builds
- Allows defining shared globals that affect all projects

### Build Configurations

Each project has multiple build configurations:

```json
"configurations": {
  "production": {
    "optimization": true,
    "extractLicenses": true,
    "generatePackageJson": true,
    "sourceMap": false
  },
  "development": {
    "optimization": false,
    "sourceMap": true
  }
}
```

This allows for different build settings depending on the environment.

### Module Boundaries

We use tags to enforce module boundaries and prevent circular dependencies:

```json
"tags": ["domain:mcp", "type:lib"]
```

These tags are enforced through ESLint rules:

```json
"@nx/enforce-module-boundaries": [
  "error",
  {
    "enforceBuildableLibDependency": true,
    "allow": [],
    "depConstraints": [
      {
        "sourceTag": "*",
        "onlyDependOnLibsWithTags": ["*"]
      },
      {
        "sourceTag": "domain:mcp",
        "onlyDependOnLibsWithTags": ["domain:mcp", "domain:shared", "type:lib"]
      },
      {
        "sourceTag": "type:app",
        "onlyDependOnLibsWithTags": ["type:lib"]
      }
    ]
  }
]
```

This configuration ensures that:
- All projects can depend on shared utilities
- Domain-specific projects can only depend on projects in the same domain or shared domain
- Applications can only depend on libraries, not other applications

## TypeScript Configuration

The monorepo uses a base TypeScript configuration in `tsconfig.base.json` that all projects extend:

```json
{
  "compilerOptions": {
    "rootDir": ".",
    "baseUrl": ".",
    "paths": { ... },
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

The strict TypeScript settings ensure type safety across the codebase.

## ESLint Configuration

The monorepo uses a comprehensive ESLint configuration with rules for TypeScript and JavaScript files:

```json
{
  "root": true,
  "plugins": ["@nx"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "extends": ["plugin:@nx/typescript"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/explicit-function-return-type": "warn",
        // Other TypeScript-specific rules
      }
    },
    {
      "files": ["*.js", "*.jsx"],
      "extends": ["plugin:@nx/javascript"],
      "rules": {
        // JavaScript-specific rules
      }
    }
  ]
}
```

## Utility Scripts

The monorepo includes several utility scripts for managing and validating the codebase:

- `tools/scripts/update-project-configs.ts`: Updates all project configurations with best practices
- `tools/scripts/check-typescript-issues.ts`: Checks for TypeScript issues across the workspace
- `tools/scripts/analyze-dependencies.ts`: Analyzes dependencies for circular references and other issues

## CI/CD Integration

The monorepo includes GitHub Actions workflows for validating changes:

- `nx-validation.yml`: Runs linting, testing, and building for affected projects

## Best Practices

When working with this monorepo, follow these best practices:

1. **Use proper tagging**: Always use appropriate domain and type tags for new projects
2. **Respect module boundaries**: Don't create dependencies that violate the defined boundaries
3. **Update named inputs**: When adding new file types, update the named inputs to include them
4. **Optimize caching**: Use proper inputs for targets to maximize cache hits
5. **Keep it consistent**: Follow the established patterns for project configuration

## Troubleshooting

If you encounter issues with the monorepo, try these solutions:

1. **Cache problems**: Run `nx reset` to clear the cache
2. **Dependency issues**: Run `npx ts-node tools/scripts/analyze-dependencies.ts` to identify problems
3. **TypeScript errors**: Run `npx ts-node tools/scripts/check-typescript-issues.ts` to find issues
4. **Project recognition**: Make sure your project.json file follows the standardized format
