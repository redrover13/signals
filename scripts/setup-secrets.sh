#!/bin/bash
# @fileoverview setup-secrets.sh
#
# This script sets up Google Cloud Secret Manager secrets for the Dulce de Saigon F&B Platform
# Run this script to initialize all required secrets in GCP Secret Manager
#
# Usage: ./setup-secrets.sh [project-id]
#
# @author Dulce de Saigon Engineering
# @copyright Copyright (c) 2025 Dulce de Saigon
# @license MIT

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default project ID
PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null || echo "")}

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project ID provided and none found in gcloud config${NC}"
    echo "Usage: $0 <project-id>"
    echo "Or set your project with: gcloud config set project <project-id>"
    exit 1
fi

echo -e "${BLUE}Setting up secrets for GCP project: ${PROJECT_ID}${NC}"

# Function to create or update a secret
create_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    echo -e "${YELLOW}Creating/updating secret: ${secret_name}${NC}"

    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo "Secret $secret_name already exists. Adding new version..."
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project="$PROJECT_ID"
    else
        echo "Creating new secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" --data-file=- --project="$PROJECT_ID"
    fi

    # Add labels for better organization
    gcloud secrets describe "$secret_name" --project="$PROJECT_ID" --format="value(name)" >/dev/null 2>&1 && \
    gcloud secrets update "$secret_name" --update-labels="description=$description,managed-by=setup-script" --project="$PROJECT_ID" 2>/dev/null || true

    echo -e "${GREEN}✓ Secret ${secret_name} configured${NC}"
}

# Function to get secret value (non-interactive)
get_secret_value() {
    local secret_name=$1
    local description=$2
    local default_value=$3
    local env_var_name=$4

    # Check environment variable first
    if [ -n "$env_var_name" ] && [ -n "${!env_var_name}" ]; then
        echo -e "${GREEN}Using environment variable for $secret_name${NC}"
        create_secret "$secret_name" "${!env_var_name}" "$description"
        return 0
    fi

    # Use default value if available
    if [ -n "$default_value" ]; then
        echo -e "${YELLOW}Using default value for $secret_name${NC}"
        create_secret "$secret_name" "$default_value" "$description"
        return 0
    fi

    # Skip optional secrets
    echo -e "${YELLOW}Skipping $secret_name (no value provided)${NC}"
    return 1
}

echo -e "${BLUE}Starting secrets setup...${NC}"

# GitHub Token
get_secret_value "github-token" "GitHub Personal Access Token for repository access" "" "GITHUB_TOKEN"

# Codacy Tokens
get_secret_value "codacy-token" "Codacy API Token for code quality analysis" "XGRPGPYzQLheHvDcCrUT" "CODACY_TOKEN"
get_secret_value "codacy-account-token" "Codacy Account Token for organization access" "XGRPGPYzQLheHvDcCrUT" "CODACY_ACCOUNT_TOKEN"

# NX Cloud Token
get_secret_value "nx-cloud-token" "NX Cloud Access Token for distributed caching" "" "NX_CLOUD_TOKEN"

# Sentry Token
get_secret_value "sentry-token" "Sentry Auth Token for error tracking" "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sntrys_eyJpYXQiOjE3NTU0Mzg4NTguMjkxMzIsInVybCI6Imh0dHBzOi8vc2VudHJ5LmlvIiwicmVnaW9uX3VybCI6Imh0dHBzOi8vdXMuc2VudHJ5LmlvIiwib3JnIjoiZHVsY2UtZGUtc2FpZ29uLTBhIn0=_ivpGft5nOM0rM7qtxHtY+PztC4dFk8yBjgVCGzMtmhE" "SENTRY_TOKEN"

# Tavily API Key
get_secret_value "tavily-api-key" "Tavily AI Search API Key" "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" "TAVILY_API_KEY"

# Qdrant Secrets
get_secret_value "qdrant-api-key" "Qdrant Vector Database API Key" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.z2FluTu4F68IDTwmWaNY1xO8hma-rSbGGq-bSdk7HiI" "QDRANT_API_KEY"
get_secret_value "qdrant-url" "Qdrant Vector Database URL" "http://localhost:6333" "QDRANT_URL"

# DigitalOcean Token
get_secret_value "dictl-dop-token" "DigitalOcean Personal Access Token" "dictl-dop_v1_8e6b5b06bacc1c2d182a081576cee17d8f3923f5aa742e902d11d9728c9dd44d" "DIGITALOCEAN_TOKEN"

# GitGuardian Token
get_secret_value "gitguardian-token" "GitGuardian API Token" "b026Ef3dcd135109d0Fa40FaCcFeEc9fcf9a78F8B1CD425A20805ab3ae265cf58789abC" "GITGUARDIAN_TOKEN"

# Smither Token
get_secret_value "smither-token" "Smither API Token" "smither" "SMITHER_TOKEN"

# Google API Keys
get_secret_value "google-api-key" "Google API Key for general services" "" "GOOGLE_API_KEY"
get_secret_value "google-cse-id" "Google Custom Search Engine ID" "" "GOOGLE_CSE_ID"

# GCP Project ID
create_secret "gcp-project-id" "$PROJECT_ID" "GCP Project ID"

# Brave Search API Key
get_secret_value "brave-api-key" "Brave Search API Key" "" "BRAVE_API_KEY"

# PostgreSQL Connection
if [ -n "$POSTGRES_CONNECTION" ]; then
    create_secret "postgres-connection" "$POSTGRES_CONNECTION" "PostgreSQL Connection String"
elif [ -n "$DATABASE_URL" ]; then
    create_secret "postgres-connection" "$DATABASE_URL" "PostgreSQL Connection String"
else
    echo -e "${YELLOW}Skipping PostgreSQL connection (no DATABASE_URL or POSTGRES_CONNECTION provided)${NC}"
fi

# JWT Secret
get_secret_value "jwt-secret" "JWT Secret for token signing" "" "JWT_SECRET"

# Dulce API Key
get_secret_value "dulce-api-key" "Dulce de Saigon API Key" "" "DULCE_API_KEY"

echo -e "${GREEN}✓ All secrets have been configured in Google Secret Manager${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify secrets were created: gcloud secrets list --project=$PROJECT_ID"
echo "2. Update your application configuration to use these secrets"
echo "3. Ensure your service account has 'Secret Manager Secret Accessor' role"
echo ""
echo -e "${YELLOW}Important: Never commit secret values to version control!${NC}"
