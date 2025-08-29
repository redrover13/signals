# CodeQL Configuration Guide

## Overview

This document explains the CodeQL configuration for the Dulce de Saigon F&B Data Platform project. CodeQL is a static analysis tool that helps identify potential security vulnerabilities and code quality issues in the codebase.

## Current Configuration

The project is configured to scan only JavaScript/TypeScript code, as these are the primary languages used in the codebase. The configuration is defined in:

1. `.github/codeql/typescript-config.yml` - Contains TypeScript-specific configuration
2. `.github/workflows/codeql.yml` - Contains the GitHub Actions workflow configuration

## Excluded Languages

The following languages were previously configured but have been removed from scanning because they are not actively used in the codebase:

- Java/Kotlin
- Python
- Swift
- Actions (GitHub Actions)

## Automated Fixes

We've created scripts to automatically fix common CodeQL issues:

```bash
# Run the fix script to repair issues in JavaScript/TypeScript files
node scripts/fix-codeql-issues.js

# Simulate a CodeQL analysis to verify fixes
./scripts/simulate-codeql.sh
```

These scripts will:
1. Remove invalid CDATA tags
2. Detect mixed module systems
3. Add standard headers to TypeScript files

## Troubleshooting CodeQL Issues

If you encounter CodeQL errors, consider the following:

1. **CDATA Tags**: CDATA tags (`<![CDATA[` and `]]>`) can cause syntax errors:
   - These tags are often found in code that was generated or copied from XML sources
   - Run `node scripts/fix-codeql-issues.js` to automatically remove them

2. **Module System Conflicts**: This project uses ESM (ECMAScript Modules):
   - The `package.json` has `"type": "module"`
   - Use `import`/`export` syntax in `.js` and `.ts` files
   - For CommonJS files, use the `.cjs` extension
   - Avoid mixing require() and import in the same file

3. **Missing Headers**: TypeScript files should have standard headers:
   - The fix script will add appropriate headers
   - Headers provide documentation and file ownership details

4. **Build Failures**: If CodeQL can't analyze your code:
   - Ensure your code can be built successfully
   - Run `pnpm build` to verify the build process works
   - Check that all dependencies are installed

## Pre-commit Hook

A pre-commit hook has been set up to automatically check for and fix CodeQL issues before committing code. To install the hook:

```bash
./scripts/install-hooks.sh
```

## Adding New Code

When adding new code, ensure that:

1. No CDATA tags are present in the code
2. Files use a consistent module system (ES modules or CommonJS, not both)
3. TypeScript files have proper file headers

Following these guidelines will ensure that the CodeQL analysis continues to pass.

## Adding Support for New Languages

If you need to add support for additional languages in the future:

1. Update the `.github/codeql/typescript-config.yml` file to include the language
2. Modify the `.github/workflows/codeql.yml` file to include the language in the matrix
3. Ensure the appropriate build tools and configurations are in place for that language

## References

- [CodeQL Documentation](https://codeql.github.com/docs/)
- [GitHub CodeQL Action](https://github.com/github/codeql-action)
- [CodeQL Query Help](https://codeql.github.com/codeql-query-help/)
