# CI/CD Pipeline with CodeQL Integration

## Overview

This document describes how CodeQL has been integrated into our CI/CD pipeline to ensure code quality and security standards across the Dulce de Saigon F&B Data Platform.

## Pipeline Structure

Our CI/CD pipeline includes the following stages:

1. **Dependency Installation**: Installing all required dependencies using pnpm
2. **CodeQL Fixes**: Automatically fixing common CodeQL issues using our custom script
3. **Linting**: Running ESLint to ensure code style consistency
4. **Testing**: Running Jest tests to verify functionality
5. **Type Checking**: Verifying TypeScript types
6. **CodeQL Analysis**: Running GitHub's CodeQL analysis to detect security vulnerabilities
7. **Build**: Building the application for deployment
8. **Deployment**: Deploying to the appropriate environment

## CodeQL Integration

### Workflow Files

- `.github/workflows/codeql.yml`: Main CodeQL analysis workflow
- `.github/workflows/ci.yml`: CI pipeline with CodeQL fixes

### Configuration Files

- `.github/codeql/codeql-config.yml`: General CodeQL configuration
- `.github/codeql/typescript-config.yml`: TypeScript-specific configuration

### Helper Scripts

- `scripts/fix-codeql-issues.js`: Automatically fixes common CodeQL issues
- `scripts/install-hooks.sh`: Installs Git hooks for pre-commit checks

## TypeScript Standards

### File Headers

All TypeScript files should include a standard file header using the template at `.github/templates/ts-header.template`. The header includes:

- File description
- Project information
- Copyright notice
- License information

### Coding Standards

- Use ES modules syntax consistently
- Follow the TypeScript coding standards specified in `.eslintrc.json`
- Ensure all files pass CodeQL analysis

## Pre-commit Hooks

We've implemented a pre-commit hook that automatically runs the CodeQL fix script before each commit. This ensures that common issues are fixed before code is committed to the repository.

## How to Run Locally

```bash
# Install dependencies
pnpm install

# Run CodeQL fix script
pnpm codeql:fix

# Check CodeQL analysis locally
pnpm codeql:check
```

## Troubleshooting

If you encounter CodeQL errors, check the following:

1. Run `pnpm codeql:fix` to automatically fix common issues
2. Ensure your TypeScript files have the correct headers
3. Verify that you're using consistent module syntax (ESM vs CommonJS)
4. Check for syntax errors in your code
