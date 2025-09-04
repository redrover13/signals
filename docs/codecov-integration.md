# Codecov Integration

This document describes the Codecov integration for the "Dulce de Saigon" F&B Data Platform project.

## Overview

We use [Codecov](https://codecov.io/) to track code coverage for our TypeScript codebase. Coverage reports are generated during test runs and automatically uploaded to Codecov during CI workflows.

## Configuration

### Coverage Configuration

The code coverage configuration is defined in the root `codecov.yml` file, which includes:

- Project-wide coverage targets and thresholds
- Pull request coverage requirements
- Ignored file patterns
- Comment behavior on PRs

### Coverage Generation

Coverage is generated through Jest's coverage mechanism. Each project has its own coverage configuration in its respective `jest.config.ts` file.

Our Nx workspace is configured to output coverage reports to the `coverage/{projectRoot}` directory for each project.

## Workflow Integration

The code coverage reporting is integrated into our CI workflow in `.github/workflows/ci-with-codecov.yml`. The workflow:

1. Runs tests across all projects with coverage enabled
2. Combines coverage reports from individual projects
3. Uploads the combined report to Codecov

## Local Development

To generate and view coverage reports locally:

```bash
# Run tests with coverage for all projects
pnpm test:coverage

# Combine the coverage reports (optional)
pnpm test:coverage:combine

# Coverage reports are available in:
# - Individual project reports: ./coverage/{projectRoot}/lcov-report/index.html
# - Combined report (after running combine script): ./coverage/combined/lcov-report/index.html
```

## Secrets and Authentication

The Codecov upload token is stored in Google Secret Manager at:
```
projects/${GCP_PROJECT_ID}/secrets/codecov-token/versions/latest
```

And exposed to the CI environment through the MCP server as the `CODECOV_TOKEN` environment variable.

## Troubleshooting

If you encounter issues with coverage reporting:

1. Ensure tests are running with the `--coverage` flag
2. Check that the coverage output directory matches what's expected in the CI workflow
3. Verify that the Codecov token is correctly set in the CI environment
4. Look for any errors in the Codecov upload step in the CI logs
