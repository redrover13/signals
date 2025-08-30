# Secrets Management Setup

This document outlines the secrets management implementation for the Dulce de Saigon F&B Data Platform using Google Cloud Secret Manager.

## Overview

The platform implements a comprehensive secrets management system that:

- ✅ Uses Google Cloud Secret Manager for secure credential storage
- ✅ Provides programmatic access to secrets with caching
- ✅ Supports environment variable fallbacks for development
- ✅ Includes validation and error handling
- ✅ Follows Vietnamese data privacy requirements

## Quick Start

### 1. Set up Google Cloud Project

```bash
# Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable secretmanager.googleapis.com
```

### 2. Run the Secrets Setup Script

```bash
# Make script executable and run
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh YOUR_PROJECT_ID
```

The script will prompt you to enter values for all required secrets.

### 3. Verify Secrets Setup

```bash
# List all secrets
gcloud secrets list --project=YOUR_PROJECT_ID

# Check a specific secret
gcloud secrets versions access latest --secret=github-token --project=YOUR_PROJECT_ID
```

## Secrets Configuration

### Required Secrets

| Secret Name | Environment Variable | Description | Status |
|-------------|---------------------|-------------|---------|
| `github-token` | `GITHUB_TOKEN` | GitHub Personal Access Token | ✅ Configured |
| `codacy-token` | `CODACY_API_TOKEN` | Codacy API Token | ✅ Configured |
| `sentry-token` | `SENTRY_AUTH_TOKEN` | Sentry Auth Token | ✅ Configured |
| `tavily-api-key` | `TAVILY_API_KEY` | Tavily AI Search API Key | ✅ Configured |
| `qdrant-api-key` | `QDRANT_API_KEY` | Qdrant Vector Database API Key | ✅ Configured |
| `qdrant-url` | `QDRANT_URL` | Qdrant Vector Database URL | ✅ Configured |
| `gcp-project-id` | `GCP_PROJECT_ID` | GCP Project ID | ✅ Configured |
| `jwt-secret` | `JWT_SECRET` | JWT Secret for token signing | ✅ Configured |
| `dulce-api-key` | `DULCE_API_KEY` | Dulce de Saigon API Key | ✅ Configured |

### Optional Secrets

| Secret Name | Environment Variable | Description | Status |
|-------------|---------------------|-------------|---------|
| `nx-cloud-token` | `NX_CLOUD_ACCESS_TOKEN` | NX Cloud Access Token | ✅ Configured |
| `dictl-dop-token` | `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean Personal Access Token | ✅ Added |
| `gitguardian-token` | `GITGUARDIAN_API_TOKEN` | GitGuardian API Token | ✅ Added |
| `smither-token` | `SMITHER_API_TOKEN` | Smither API Token | ✅ Added |
| `google-api-key` | `GOOGLE_API_KEY` | Google API Key | ✅ Configured |
| `google-cse-id` | `GOOGLE_CSE_ID` | Google Custom Search Engine ID | ✅ Configured |
| `brave-api-key` | `BRAVE_API_KEY` | Brave Search API Key | ✅ Configured |
| `postgres-connection` | `POSTGRES_CONNECTION_STRING` | PostgreSQL Connection String | ✅ Configured |

## Programmatic Usage

### TypeScript/JavaScript

```typescript
import { getSecret, loadAppConfig, validateSecrets } from '@dulce-de-saigon/security';

// Get a single secret
const githubToken = await getSecret('github-token');

// Load all application configuration
const config = await loadAppConfig();

// Validate required secrets are available
const { valid, missing } = await validateSecrets();
if (!valid) {
  console.error('Missing secrets:', missing);
}
```

### Environment Variables (Development)

For development, you can set environment variables instead of using Secret Manager:

```bash
export GITHUB_TOKEN=your_github_token_here
export CODACY_API_TOKEN=your_codacy_token_here
export SENTRY_AUTH_TOKEN=your_sentry_token_here
# ... etc
```

The system will automatically fall back to environment variables when Secret Manager is not available.

## MCP Configuration

The MCP (Model Context Protocol) servers are configured to use secrets from Secret Manager:

```json
{
  "servers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "github-token"
      }
    },
    "codacy": {
      "env": {
        "CODACY_API_TOKEN": "codacy-token"
      }
    }
  },
  "secrets": {
    "github-token": {
      "secretManager": "projects/${GCP_PROJECT_ID}/secrets/github-token/versions/latest"
    }
  }
}
```

## Security Best Practices

### ✅ What We've Implemented

1. **No Hardcoded Secrets**: All secrets are referenced by name, never stored in code
2. **Google Secret Manager**: Enterprise-grade secret storage with audit logging
3. **Access Control**: IAM-based access control for secrets
4. **Caching**: In-memory caching with TTL to reduce API calls
5. **Environment Fallbacks**: Development-friendly environment variable support
6. **Validation**: Runtime validation of required secrets
7. **Error Handling**: Comprehensive error handling with meaningful messages

### 🔒 Additional Security Measures

1. **Service Account**: Use dedicated service accounts with minimal required permissions
2. **Secret Rotation**: Regularly rotate secrets and update versions
3. **Audit Logging**: Enable Cloud Audit Logs for secret access monitoring
4. **Network Security**: Use VPC Service Controls for additional network isolation

## Troubleshooting

### Common Issues

1. **"Secret not found" error**
   ```bash
   # Check if secret exists
   gcloud secrets describe github-token --project=YOUR_PROJECT_ID

   # Create the secret if missing
   echo -n "your_token_here" | gcloud secrets create github-token --data-file=-
   ```

2. **Permission denied**
   ```bash
   # Grant Secret Manager Secret Accessor role to service account
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:your-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. **Environment variable not working**
   - Ensure environment variables are set before starting the application
   - Check variable names match exactly (case-sensitive)

### Validation Script

Run this to validate your secrets setup:

```bash
#!/bin/bash
PROJECT_ID=YOUR_PROJECT_ID

echo "Validating secrets setup..."

# Check required secrets exist
REQUIRED_SECRETS=("github-token" "codacy-token" "sentry-token" "tavily-api-key" "qdrant-api-key" "gcp-project-id" "jwt-secret" "dulce-api-key")

for secret in "${REQUIRED_SECRETS[@]}"; do
  if gcloud secrets describe "$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "✅ $secret exists"
  else
    echo "❌ $secret missing"
  fi
done
```

## Migration from Hardcoded Secrets

If you find any hardcoded secrets in the codebase:

1. **Identify the secret**: Look for API keys, tokens, passwords in code
2. **Create Secret Manager entry**: Use the setup script or gcloud CLI
3. **Update code**: Replace hardcoded values with secret references
4. **Test thoroughly**: Ensure the application still works correctly

### Example Migration

**Before (❌ Bad):**
```typescript
const GITHUB_TOKEN = 'ghp_1234567890abcdef';
```

**After (✅ Good):**
```typescript
import { getSecret } from '@dulce-de-saigon/security';

const GITHUB_TOKEN = await getSecret('github-token');
```

## Compliance

This secrets management implementation complies with:

- **Vietnamese Personal Data Protection Decree (2018)**
- **Google Cloud Security Best Practices**
- **OWASP Security Guidelines**
- **Industry-standard secret management practices**

## Support

For issues with secrets management:

1. Check this documentation first
2. Review GCP Secret Manager documentation
3. Contact the platform engineering team
4. Create an issue in the project repository

---

**Remember**: Never commit secrets to version control. Always use Secret Manager or environment variables for development.
