# Production Deployment Approval & Rollback SOP

## Required Reviewer Roles for Production

Production deployments require approval from designated reviewers. These reviewers must be assigned in the GitHub Environment settings for `production`.

**Recommended roles:**

- Lead Engineer
- DevOps Engineer
- CTO or delegated release manager

## Manual Approval Process

1. Open a Pull Request targeting the `main` branch.
2. Ensure all required status checks pass (CI, security, tests).
3. When the deployment workflow runs, it will pause at the `production` environment approval step.
4. A required reviewer must approve the deployment in the GitHub UI (Settings > Environments > production > Required reviewers).
5. Once approved, the workflow will proceed to deploy to production.

## SOP for Deployment Failure & Rollback

1. **Monitor the deployment:**

- The workflow will run health checks after deployment.
- If a health check fails, the workflow will attempt an automatic rollback to the previous stable version.

2. **Manual rollback:**

- If the automatic rollback fails or further issues are detected, trigger a manual rollback using the GCP Console or CLI:
  - `gcloud run services update-traffic <service> --region <region> --to-latest`

3. **Notify stakeholders:**

- Inform the team and stakeholders of the rollback and incident.

4. **Post-mortem:**

- Document the failure, root cause, and remediation steps in the incident log.

**See also:**

- [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)
- [WIF_SETUP_GUIDE.md](WIF_SETUP_GUIDE.md)

# Dulce de Saigon Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Dulce de Saigon platform to Google Cloud Platform.

## Prerequisites

Before deploying, ensure you have:

1. Google Cloud SDK installed and configured
2. A Google Cloud Project with billing enabled
3. PNPM 8.x installed locally
4. Terraform installed
5. Required APIs enabled (see below)

## Required APIs

Enable the following APIs in your Google Cloud Project:

```bash
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  containerregistry.googleapis.com \
  run.googleapis.com \
  pubsub.googleapis.com \
  bigquery.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  aiplatform.googleapis.com
```

## Infrastructure Setup

### 1. Terraform Configuration

Navigate to the Terraform directory:

```bash
cd infra/terraform
```

Create a `terraform.tfvars` file with your project configuration:

```hcl
project_id = "your-gcp-project-id"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Apply Infrastructure

```bash
terraform apply
```

This will create:

- Pub/Sub topics for events and agents
- BigQuery dataset and tables
- Cloud Storage bucket
- Service accounts with appropriate permissions
- Secret Manager secrets

## Application Deployment

### 1. API Service Deployment

Build and deploy the API service:

```bash
# Build the container
cd apps/api
gcloud builds submit --tag gcr.io/PROJECT_ID/dulce-api

# Deploy to Cloud Run
gcloud run deploy dulce-api \
  --image gcr.io/PROJECT_ID/dulce-api \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars=GCP_PROJECT_ID=PROJECT_ID,BQ_DATASET=dulce,PUBSUB_TOPIC=dulce.events
```

### 2. Agents Service Deployment

Build and deploy the agents service:

```bash
# Build the container
cd apps/agents
gcloud builds submit --tag gcr.io/PROJECT_ID/dulce-agents

# Deploy to Cloud Run
gcloud run deploy dulce-agents \
  --image gcr.io/PROJECT_ID/dulce-agents \
  --platform managed \
  --region asia-southeast1 \
  --no-allow-unauthenticated \
  --service-account dulce-agents-sa@PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars=GCP_PROJECT_ID=PROJECT_ID,BQ_DATASET=dulce
```

### 3. Web Application Deployment

You can deploy the web application either to Vercel or Cloud Run.

#### Option A: Vercel Deployment

1. In Vercel, import `apps/web`.
2. Set environment variables:
   - `NEXT_PUBLIC_API_BASE=https://<cloud-run-api-url>`

#### Option B: Cloud Run Deployment

```bash
# Build the container
cd apps/web
gcloud builds submit --tag gcr.io/PROJECT_ID/dulce-web

# Deploy to Cloud Run
gcloud run deploy dulce-web \
  --image gcr.io/PROJECT_ID/dulce-web \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars=NEXT_PUBLIC_API_BASE=https://<cloud-run-api-url>
```

## Environment Variables

Each service requires specific environment variables:

### API Service

- `GCP_PROJECT_ID` - Your Google Cloud Project ID
- `BQ_DATASET` - BigQuery dataset name (default: dulce)
- `PUBSUB_TOPIC` - Pub/Sub topic name for events (default: dulce.events)
- `AGENTS_TOPIC` - Pub/Sub topic name for agents (default: dulce.agents)

### Agents Service

- `GCP_PROJECT_ID` - Your Google Cloud Project ID
- `BQ_DATASET` - BigQuery dataset name (default: dulce)

### Web Application

- `NEXT_PUBLIC_API_BASE` - URL of the deployed API service

## Workload Identity Federation Setup

For secure CI/CD without service account keys:

1. Run the setup script in Cloud Shell:

   ```bash
   curl -O https://raw.githubusercontent.com/YOUR_REPO/main/scripts/setup-wif-github.sh
   chmod +x setup-wif-github.sh
   ./setup-wif-github.sh
   ```

2. Complete repository binding with your GitHub details

3. Add the following secrets to GitHub:
   - `GCP_PROJECT_ID`
   - `WIF_PROVIDER`
   - `WIF_SERVICE_ACCOUNT`

## Verification

After deployment, verify the setup:

1. Visit the web application URL
2. Check that events are being sent to the API
3. Verify data is appearing in BigQuery:
   ```sql
   SELECT * FROM `PROJECT_ID.dulce.events` ORDER BY ts DESC LIMIT 10;
   ```
4. Check the agents service is processing tasks (if enabled)

## Monitoring and Logging

The platform uses Google Cloud's built-in monitoring:

- **Logs**: Available in Cloud Logging
- **Metrics**: Available in Cloud Monitoring
- **Alerts**: Configure for critical issues

Set up alerts for:

- API service downtime
- Agents processing failures
- BigQuery errors
- High latency or error rates

## Backup and Disaster Recovery

The platform includes automated backups:

- **BigQuery**: Snapshots are automatically retained
- **Cloud Storage**: Versioning enabled for critical data
- **Secrets**: Stored in Secret Manager with versioning

For disaster recovery:

1. Recreate infrastructure using Terraform
2. Restore data from BigQuery snapshots if needed
3. Redeploy applications

## Cost Optimization

To minimize costs:

- Use free-tier resources where possible
- Set up budget alerts in Google Cloud
- Use preemptible instances for non-critical workloads
- Implement proper logging retention policies
- Monitor and optimize BigQuery queries

## Scaling

The platform automatically scales:

- **Cloud Run**: Scales based on request volume
- **Pub/Sub**: Handles message buffering during traffic spikes
- **BigQuery**: Provides serverless analytics at scale

For manual scaling:

- Adjust Cloud Run memory and CPU allocation
- Increase BigQuery slot capacity for heavy workloads
