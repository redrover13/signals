# ESLint Configuration Guide for Signals Project

This document explains the ESLint setup in the Signals monorepo to help developers understand how linting is configured and how to use it effectively.

## Overview

The Signals project uses ESLint within an Nx monorepo architecture. Linting is managed through Nx's ESLint plugin integration rather than using ESLint directly.

## Configuration Structure

1. **Root Configuration**:
   - `.eslintrc.json` - Contains the base rules and extends configurations
   - Defines specialized overrides for different file types (TS, JS, test files)
   - Sets up module boundary rules through the `@nx/enforce-module-boundaries` rule
   - Uses a dedicated `tsconfig.eslint.json` for TypeScript linting that is compatible with project references

2. **Nx Integration**:
   - ESLint is integrated through `@nx/eslint/plugin` in the `nx.json` file
   - Linting targets are defined in each project's `project.json` file
   - Uses Nx's caching system to improve performance

3. **Project-Specific Configurations**:
   - Each project has its own `eslint.config.cjs` file
   - These extend the root configuration with project-specific rules
   - Example: React projects add React-specific linting rules

## Running ESLint

To run ESLint in this project, use the Nx commands:

```bash
# Lint a specific project
pnpm nx lint <project-name>

# Example: Lint the agent-frontend project
pnpm nx lint agent-frontend

# Lint all projects
pnpm nx lint

# Lint only affected projects (only changed files)
pnpm nx affected --target=lint

# Lint with strict mode (used in CI)
pnpm nx affected --target=lint --parallel=3 --max-warnings=0
```

You can also use the npm script defined in package.json:

```bash
pnpm lint
```

## Important Note on Direct ESLint Usage

The project relies on Nx's ESLint integration (`@nx/eslint`) rather than a direct dependency on the `eslint` package itself. This is a common pattern in Nx monorepos where Nx manages the tooling internally.

When you run `nx lint`, Nx uses its own ESLint integration to run the linting process. This is why you cannot run `eslint` directly or through `npx eslint`.

## ESLint Rules Overview

The project uses a combination of:

- TypeScript-specific rules (`@typescript-eslint/*`)
- React-specific rules (for React components)
- General JavaScript best practices
- Nx-specific rules for module boundaries

Key rules include:
- `@typescript-eslint/no-explicit-any`: Prevents use of the `any` type
- `@typescript-eslint/no-unused-vars`: Prevents unused variables
- `@nx/enforce-module-boundaries`: Enforces Nx module boundaries for proper architecture
- React-specific rules in React projects

## Adding Custom Rules

To add custom rules to a specific project:

1. Edit the project's `eslint.config.cjs` file
2. Add your rules to the `rules` object
3. Make sure to test your changes by running linting

Example:
```javascript
module.exports = [
    ...baseConfig,
    ...nx.configs["flat/react"],
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            // Your custom rules here
            "max-len": ["error", { "code": 100 }]
        }
    }
];
```

## Troubleshooting

If you encounter linting issues:

1. Make sure you're running linting through Nx (`nx lint`)
2. Check for errors in your ESLint configuration files
3. Verify that all necessary ESLint plugins are installed
4. Clear the Nx cache if needed: `nx reset`

### Common Issues

#### TypeScript Project References

If you see errors like:

```
ESLint was configured to run on files using `parserOptions.project` but that file isn't included in the "project" reference
```

This is because ESLint's `parserOptions.project` has limitations with TypeScript project references. Our solution is:

1. We use a dedicated `tsconfig.eslint.json` that extends the base config but doesn't use project references
2. ESLint is configured to use this file instead of directly using `tsconfig.base.json`
3. This approach allows ESLint to properly type-check files without the limitations of project references

## Best Practices

1. Always run linting before committing code
2. Fix all linting issues rather than suppressing them
3. Use consistent code style across the entire project
4. When adding new rules, discuss with the team to maintain consistency
