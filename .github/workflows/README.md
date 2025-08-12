# GitHub Actions CI/CD Workflows

This directory contains the CI/CD pipeline configurations for the Dulce de Saigon Nx monorepo.

## Workflows Overview

### 1. Basic CI (`ci.yml`)
- **Purpose**: Original simple CI workflow
- **Triggers**: Push to main/master, Pull requests
- **Jobs**: Basic build, lint, and test

### 2. Complete CI/CD Pipeline (`ci-complete.yml`)
- **Purpose**: Comprehensive CI/CD with security, quality, and deployment
- **Triggers**: Push, PR, manual dispatch
- **Key Features**:
   - 🔐 **Security Scanning**: Gitleaks, Secretlint, GitGuardian
  - 📦 **Dependency Audit**: Security vulnerabilities and license compliance
  - 🧪 **Multi-Node Testing**: Tests on Node 18, 20, and 22
  - 🎯 **Nx Affected**: Only builds/tests changed projects
  - 🌏 **Vietnamese Localization**: Validates VN language support
  - ☁️ **Google Cloud Build**: Automatic deployment trigger
  - 📊 **Performance Monitoring**: Bundle size checks
  - 🚀 **Semantic Release**: Automated versioning

### 3. Google Cloud Deployment (`deploy-gcp.yml`)
- **Purpose**: Deploy services to Google Cloud Platform
- **Triggers**: After successful CI, manual dispatch
- **Services Deployed**:
  - **API**: Cloud Run with 512Mi memory, 1-10 instances
  - **Web**: Cloud Run with 1Gi memory, 2-20 instances, CDN enabled
  - **Agents**: Cloud Run with 256Mi memory, 0-5 instances
- **Regions**: `asia-southeast1` (Singapore - closest to Vietnam)
- **Features**:
  - 🔄 **Change Detection**: Only deploys modified services
  - 🐳 **Docker**: Builds and pushes to Artifact Registry
  - 📈 **Traffic Migration**: Gradual rollout (10% → 50% → 100%)
  - 🧪 **Smoke Tests**: Post-deployment health checks
  - 💾 **CDN Cache**: Automatic invalidation

### 4. Pull Request Checks (`pr-checks.yml`)
- **Purpose**: Automated PR validation
- **Triggers**: PR opened, synchronized, or reopened
- **Checks**:
  - 📏 **File Size**: Prevents files >1MB
  - 📝 **PR Title**: Enforces conventional commits
  - 📁 **Required Files**: Ensures critical files exist
  - 🇻🇳 **Vietnamese Review**: Flags untranslated content
  - 🔐 **Security**: Scans changed files for secrets
  - 📊 **Nx Analysis**: Comments affected projects
  - ✅ **Quality Gates**: 80% code coverage requirement
  - 📚 **Documentation**: Reminds to update docs
  - 🔍 **Dependencies**: Audits new packages

## Environment Variables & Secrets

### Required GitHub Secrets:
```yaml
# Google Cloud
GCP_PROJECT_ID: Your GCP project ID
WIF_PROVIDER: Workload Identity Federation provider
WIF_SERVICE_ACCOUNT: Service account for deployments

# Security Scanning
GITGUARDIAN_API_KEY: GitGuardian API key
NX_CLOUD_ACCESS_TOKEN: Nx Cloud token (optional)

# Monitoring
MONITORING_TOKEN: Token for deployment notifications
CODECOV_TOKEN: Codecov integration (optional)

# Semantic Release
GITHUB_TOKEN: Auto-provided by GitHub Actions
```

### Service Accounts Required:
- `dulce-api-sa@PROJECT.iam.gserviceaccount.com`
- `dulce-web-sa@PROJECT.iam.gserviceaccount.com`
- `dulce-agents-sa@PROJECT.iam.gserviceaccount.com`

## Workflow Usage

### Running Manual Deployment
```bash
# Deploy all services to staging
gh workflow run deploy-gcp.yml -f environment=staging -f services=all

# Deploy only API to production
gh workflow run deploy-gcp.yml -f environment=production -f services=api
```

### Monitoring Workflow Runs
```bash
# View recent workflow runs
gh run list

# Watch a specific run
gh run watch <run-id>

# View workflow logs
gh run view <run-id> --log
```

## Best Practices

1. **Security First**
   - All secrets stored in GitHub Secrets
   - No hardcoded values in workflows
   - Service accounts with minimal permissions

2. **Cost Optimization**
   - Uses GitHub-hosted runners (free tier)
   - Caches dependencies to reduce build time
   - Only deploys affected services

3. **Vietnamese Compliance**
   - Data stays in Southeast Asia region
   - Checks for Vietnamese language support
   - Respects local regulations

4. **Nx Monorepo Integration**
   - Uses `nx affected` commands
   - Parallel execution where possible
   - Shared dependency caching

## Troubleshooting

### Common Issues

1. **Secret scanning failures**
   - Check `.secretlintrc.json` configuration
   - Verify GitGuardian API key is valid

2. **Deployment failures**
   - Ensure service accounts have correct permissions
   - Check Google Cloud quotas
   - Verify Docker images build correctly

3. **PR checks blocking**
   - Run `pnpm nx format:write` locally
   - Ensure 80% test coverage
   - Check file sizes before committing

### Debug Commands
```bash
# Test workflows locally with act
act -W .github/workflows/ci-complete.yml

# Validate workflow syntax
actionlint .github/workflows/*.yml

# Check Nx affected locally
pnpm nx print-affected --base=main
```

## Maintenance

- Review and update Node versions quarterly
- Update action versions monthly
- Audit workflow permissions regularly
- Monitor workflow execution times

---

For questions or issues, contact the DevOps team or create an issue in the repository.