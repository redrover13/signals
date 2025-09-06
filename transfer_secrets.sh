#!/bin/bash
# Secure secret transfer script for GCP to GitHub Actions

set -e  # Exit on any error

echo "🔐 GCP to GitHub Actions Secret Transfer"
echo "========================================"

# Function to safely transfer a secret
transfer_secret() {
    local gcp_name="$1"
    local gh_name="$2"
    
    echo "📥 Checking $gcp_name -> $gh_name"
    
    # Check if secret has versions
    if ! gcloud secrets versions list "$gcp_name" --format="value(name)" | head -1 > /dev/null 2>&1; then
        echo "⚠️  Skipping $gcp_name (no values stored)"
        return 0
    fi
    
    echo "📥 Transferring $gcp_name -> $gh_name"
    
    # Get secret value from GCP (this will be visible in terminal)
    secret_value=$(gcloud secrets versions access latest --secret="$gcp_name")
    
    if [ -z "$secret_value" ]; then
        echo "❌ Failed to retrieve $gcp_name from GCP"
        return 1
    fi
    
    # Set in GitHub (value will be masked in output)
    echo "$secret_value" | gh secret set "$gh_name"
    
    echo "✅ Successfully transferred $gh_name"
}

# Transfer secrets with proper naming
echo "🚀 Starting secret transfers..."

# API Tokens
transfer_secret "GRAFANA_API_TOKEN" "GRAFANA_API_TOKEN"
transfer_secret "JENKINS_API_TOKEN" "JENKINS_API_TOKEN" 
transfer_secret "TAVILY_API_KEY" "TAVILY_API_KEY"
transfer_secret "agents-api-key" "AGENTS_API_KEY"
transfer_secret "sentry-token" "SENTRY_TOKEN"

# Database and URLs
transfer_secret "dulce-db-url" "DULCE_DB_URL"
transfer_secret "grafana-url" "GRAFANA_URL"
transfer_secret "qdrant-url" "QDRANT_URL"

# Security
transfer_secret "encryption-key" "ENCRYPTION_KEY"
transfer_secret "jwt-secret" "JWT_SECRET"

# Additional tokens
transfer_secret "codacy-account-token" "CODACY_ACCOUNT_TOKEN"
transfer_secret "codacy-token" "CODACY_TOKEN"
transfer_secret "grafana-admin-password" "GRAFANA_ADMIN_PASSWORD"
transfer_secret "grafana-api-token" "GRAFANA_API_TOKEN"
transfer_secret "qdrant-api-key" "QDRANT_API_KEY"
transfer_secret "tavily-api-key" "TAVILY_API_KEY"

echo "🎉 Secret transfer complete!"
echo "📋 Summary of transferred secrets:"
gh secret list
