#!/bin/bash
# Setup Workload Identity Federation for GitHub Actions
# Run this in Google Cloud Shell or with gcloud authenticated

set -euo pipefail

# Configuration
PROJECT_ID="saigon-signals"
GITHUB_ORG="YOUR_GITHUB_ORG"  # Replace with your GitHub org/username
GITHUB_REPO="YOUR_REPO_NAME"   # Replace with your repository name
REGION="asia-southeast1"

echo "🚀 Setting up Workload Identity Federation for ${PROJECT_ID}"

# Set project
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# Create Workload Identity Pool
echo "🏊 Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool" || echo "Pool already exists"

# Create OIDC Provider
echo "🔐 Creating OIDC Provider..."
gcloud iam workload-identity-pools providers create-oidc "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --issuer-uri="https://token.actions.githubusercontent.com" || echo "Provider already exists"

# Create GitHub Actions Service Account
echo "👤 Creating GitHub Actions Service Account..."
gcloud iam service-accounts create github-actions \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions Service Account" || echo "Service account already exists"

# Grant necessary permissions to GitHub Actions SA
echo "🔑 Granting permissions to GitHub Actions Service Account..."
for role in \
  "roles/run.developer" \
  "roles/storage.admin" \
  "roles/artifactregistry.writer" \
  "roles/cloudbuild.builds.editor" \
  "roles/secretmanager.secretAccessor" \
  "roles/iam.serviceAccountTokenCreator"
do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="${role}"
done

# Create application-specific service accounts
echo "👥 Creating application service accounts..."
for sa in "dulce-api-sa" "dulce-web-sa" "dulce-agents-sa"
do
  gcloud iam service-accounts create ${sa} \
    --project="${PROJECT_ID}" \
    --display-name="${sa}" || echo "Service account ${sa} already exists"
done

# Grant minimal permissions to app service accounts
echo "🔒 Setting up app service account permissions..."
# API Service Account
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:dulce-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:dulce-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Allow GitHub Actions to deploy as app service accounts
for sa in "dulce-api-sa" "dulce-web-sa" "dulce-agents-sa"
do
  gcloud iam service-accounts add-iam-policy-binding \
    ${sa}@${PROJECT_ID}.iam.gserviceaccount.com \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
done

# Get project number
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")

# Configure repository access
echo "🔗 Configuring repository access..."
echo "Replace GITHUB_ORG and GITHUB_REPO in the following command and run it:"
echo ""
echo "gcloud iam service-accounts add-iam-policy-binding \\"
echo "  github-actions@${PROJECT_ID}.iam.gserviceaccount.com \\"
echo "  --project=\"${PROJECT_ID}\" \\"
echo "  --role=\"roles/iam.workloadIdentityUser\" \\"
echo "  --member=\"principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}\""

# Create secrets in Secret Manager
echo "🔐 Creating secrets in Secret Manager..."
# Database URL placeholder
echo -n "<SET_THIS_IN_SECRET_MANAGER_LATER>" | \
  gcloud secrets create dulce-db-url --data-file=- || echo "Secret already exists"

# Agents API key placeholder  
echo -n "your-agents-api-key" | \
  gcloud secrets create agents-api-key --data-file=- || echo "Secret already exists"

# Get configuration values
echo ""
echo "✅ Setup complete! Add these values to your GitHub Secrets:"
echo ""
echo "GCP_PROJECT_ID: ${PROJECT_ID}"
echo "WIF_PROVIDER: projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/providers/github"
echo "WIF_SERVICE_ACCOUNT: github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
echo ""
echo "📝 Next steps:"
echo "1. Replace GITHUB_ORG and GITHUB_REPO in the command above and run it"
echo "2. Add the secrets to your GitHub repository settings"
echo "3. Update the secrets in Secret Manager with real values"
echo "4. Test the workflow with .github/workflows/test-wif.yml"