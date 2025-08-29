# TypeScript Project References

This document explains how TypeScript Project References are implemented in the Dulce de Saigon F&B Data Platform to improve build performance and type checking.

## Overview

TypeScript Project References allow for more efficient incremental builds by enabling TypeScript to understand the dependency graph between projects. This results in:

- Faster builds by only rebuilding what's changed and its dependents
- Better type checking across project boundaries
- Improved IDE performance through isolated type checking
- Clearer project boundaries and dependencies

## Implementation

Our implementation consists of:

1. **Root Configuration**: A central `tsconfig.references.json` file that defines all project references
2. **Composite Projects**: Each library and application is configured as a composite project
3. **Declaration Maps**: Enabled for all projects to improve debugging experience
4. **Build Scripts**: Added to package.json for building with project references

### File Structure

```
tsconfig.base.json             # Base configuration with shared settings
tsconfig.references.json       # Lists all projects in the monorepo
libs/*/tsconfig.json           # Library-specific configurations
libs/*/tsconfig.lib.json       # Library build configuration (composite: true)
apps/*/tsconfig.json           # Application-specific configurations
```

### Build Configuration

All `tsconfig.lib.json` files are configured with:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

## Build Commands

The following npm scripts are available for working with project references:

- `pnpm ts:build` - Build all projects in the correct dependency order
- `pnpm ts:build:watch` - Watch mode for incremental builds
- `pnpm ts:clean` - Clean all built artifacts
- `pnpm ts:refs:enable` - Update all tsconfig.lib.json files to enable project references

## Development Workflow

When working with TypeScript Project References:

1. Make changes to your code
2. Run `pnpm ts:build` (or use watch mode with `pnpm ts:build:watch`)
3. TypeScript will only rebuild the projects that were affected by your changes

## Performance Benefits

- **Faster Builds**: Only rebuilding what's necessary
- **Better IDE Experience**: More accurate IntelliSense and faster navigation
- **Cleaner Dependencies**: Explicit project relationships

## Troubleshooting

If you experience issues with project references:

1. Run `pnpm ts:clean` to clean all build outputs
2. Run `pnpm ts:refs:enable` to ensure all tsconfig files are properly configured
3. Run `pnpm ts:refs:fix` to fix common issues with project references
4. Run `pnpm ts:build` to rebuild everything from scratch

### Common Issues and Solutions

#### 1. "File is not listed within the file list of project"

This error occurs when TypeScript cannot find a file that is being imported because it's not included in the project's `include` patterns.

**Solution**: 
- Update the `include` field in the project's tsconfig.json to include the necessary files
- Run `pnpm ts:refs:fix` which will attempt to fix these issues automatically
- Check that the file exists at the expected path

#### 2. "Cannot find module or its corresponding type declarations"

This error occurs when TypeScript can't resolve an import path.

**Solution**: 
- Make sure the module is correctly listed in `references` in tsconfig.json
- Ensure the referenced project is built before the current project
- Check that imports use the correct path aliases defined in tsconfig.base.json
- Run `pnpm ts:refs:fix` to automatically generate references between projects

#### 3. "Composite project cannot reference non-composite project"

This occurs when a composite project tries to reference a project that doesn't have the `composite` flag enabled.

**Solution**:
- Make sure all referenced projects have `"composite": true` in their tsconfig.json
- Run `pnpm ts:refs:enable` to enable composite project settings for all libraries

#### 4. Import paths issues

If you're having trouble with import paths, ensure that:

- You're using the path aliases defined in tsconfig.base.json
- You're not importing directly from the src/ directory of another project
- All path mappings in tsconfig.base.json are correct

## Future Improvements

- Integration with Nx caching for even better build performance
- Automatic dependency detection for project references
- CI pipeline optimizations using project references
- Better IDE integration for project references navigation
- Improved error messages for project reference issues
