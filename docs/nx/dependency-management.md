# NX Monorepo Dependency Management

This document outlines the dependency management strategy for the Dulce de Saigon NX monorepo.

## Dependency Types

In an NX monorepo, there are several types of dependencies:

1. **Direct Dependencies**: Explicitly imported in code
2. **Implicit Dependencies**: Not directly imported but required for build/runtime
3. **Dev Dependencies**: Used during development only

## Dependency Declaration

Dependencies should be declared in the appropriate files:

- **NPM Dependencies**: Declared in `package.json`
- **Project Dependencies**: Imported in code and managed by NX
- **Implicit Dependencies**: Declared in `project.json` as `implicitDependencies`

## Module Boundaries

The monorepo enforces module boundaries using tags:

- `domain:*`: Represents a functional domain (e.g., `domain:mcp`)
- `type:*`: Represents a project type (e.g., `type:lib`, `type:app`)

Projects can only depend on libraries that match their boundary constraints.

## Circular Dependencies

Circular dependencies occur when two or more projects depend on each other, either directly or indirectly. These should always be avoided as they:

1. Make the codebase harder to understand
2. Can cause build issues
3. Create tight coupling between components

Use the `analyze-dependencies.ts` script to identify circular dependencies:

```bash
npx ts-node tools/scripts/analyze-dependencies.ts
```

## Best Practices

Follow these best practices for dependency management:

### 1. Minimize Dependencies

Only add dependencies that are absolutely necessary. Every dependency increases:
- Build time
- Maintenance burden
- Security risk

### 2. Use Nx Workspace Libraries

Prefer creating internal libraries over adding external dependencies when possible.

### 3. Follow the Dependency Graph

Structure your code to follow a clear direction in the dependency graph:

```
Applications -> Feature Libraries -> Domain Libraries -> Utility Libraries
```

### 4. Update Implicit Dependencies

When a project relies on another project's artifacts but doesn't import it directly, add it as an implicit dependency:

```json
"implicitDependencies": ["config-lib", "styles-lib"]
```

### 5. Regularly Audit Dependencies

Use the dependency analysis tool to check for:
- Unused dependencies
- Outdated dependencies
- Security vulnerabilities

```bash
pnpm audit
```

## Troubleshooting Dependency Issues

### Missing Dependencies

If you encounter errors like:

```
Cannot find module 'x' or its corresponding type declarations.
```

Check if:
1. The dependency is installed in package.json
2. The path mapping is correctly set in tsconfig.base.json
3. The dependency is built before the dependent project

### Circular Dependencies

If the dependency analysis tool reports circular dependencies:

1. Identify the cycle in the dependency graph
2. Extract shared code into a new library
3. Restructure code to break the cycle

### Dependency Resolution Issues

If you encounter unexpected dependency resolution issues:

1. Clear the NX cache with `nx reset`
2. Reinstall dependencies with `pnpm install`
3. Check for version conflicts in package.json

## For New Projects

When adding a new project to the monorepo:

1. Properly categorize it with the correct tags
2. Define its dependencies clearly
3. Avoid creating circular dependencies
4. Follow the established module boundaries
