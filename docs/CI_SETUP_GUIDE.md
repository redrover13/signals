# CI/CD Setup Guide

This guide explains how to set up and maintain the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Dulce de Saigon F&B Data Platform.

## Overview

Our CI/CD pipeline is designed to ensure code quality, run tests, and automate deployments to various environments. We use GitHub Actions as our primary CI/CD tool, with additional integration with Nx Cloud for caching and distributed task execution.

## Pipeline Structure

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Commit   │────▶│    Build    │────▶│     Test    │────▶│   Deploy    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Lint Check │     │ Nx Affected │     │  Unit Tests │     │ Dev Deploy  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                   │                   │
                          ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │ Build Apps  │     │    E2E      │     │ UAT Deploy  │
                    └─────────────┘     └─────────────┘     └─────────────┘
                                                                  │
                                                                  ▼
                                                            ┌─────────────┐
                                                            │ Prod Deploy │
                                                            └─────────────┘
```

## Environment Setup

We use the following environments:

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| Development | For developers to test changes | Automatic on merge to `develop` |
| UAT | User Acceptance Testing | Manual approval after Dev deploy |
| Production | Live environment | Manual approval after UAT verification |

## GitHub Actions Workflows

All workflows are defined in `.github/workflows/`:

1. **ci.yml** - Runs on every PR to verify code quality and tests
2. **deploy-dev.yml** - Deploys to development environment
3. **deploy-uat.yml** - Deploys to UAT environment
4. **deploy-prod.yml** - Deploys to production environment

## Nx Cloud Integration

We use Nx Cloud to:
- Cache build artifacts for faster CI/CD execution
- Distribute test execution across multiple CI agents
- Track affected projects for targeted testing and deployment

## Security Considerations

Our CI/CD pipeline includes:
- Secret management using GitHub Secrets
- SAST (Static Application Security Testing) using CodeQL
- Dependency vulnerability scanning
- Infrastructure as Code validation

## Setting Up the Pipeline

### Prerequisites

1. GitHub repository access with admin permissions
2. Nx Cloud access token
3. GCP service account keys with appropriate permissions
4. Environment-specific configuration files

### Configuration Steps

1. **Set up GitHub Secrets**:
   - `NX_CLOUD_ACCESS_TOKEN` - For Nx Cloud integration
   - `GCP_SA_KEY_DEV` - Service account key for dev environment
   - `GCP_SA_KEY_UAT` - Service account key for UAT environment
   - `GCP_SA_KEY_PROD` - Service account key for production environment

2. **Configure Branch Protection**:
   - Require PR reviews before merging to `main` and `develop`
   - Require status checks to pass before merging
   - Restrict who can push to `main`

3. **Set up Nx Cloud**:
   - Register your project with Nx Cloud
   - Configure distributed CI in nx.json

## Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Failed build | Check build logs in GitHub Actions |
| Nx cache not working | Verify NX_CLOUD_ACCESS_TOKEN is set correctly |
| Deployment failure | Check GCP service account permissions |
| Slow CI execution | Review Nx distributed task execution settings |

## Best Practices

1. **Keep builds fast** by using Nx affected to only build and test what changed
2. **Manage secrets carefully** and never commit them to the repository
3. **Use environment-specific configurations** stored securely
4. **Implement gradual rollouts** for production deployments
5. **Monitor deployments** with proper alerts and rollback mechanisms

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx Cloud Documentation](https://nx.app/docs)
- [GCP Deployment Manager](https://cloud.google.com/deployment-manager/docs)
- [Security Best Practices for CI/CD](https://cloud.google.com/solutions/best-practices-for-building-containers)
