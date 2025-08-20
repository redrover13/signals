#!/bin/bash

# Script to update Secret Manager secrets with actual values
# Run this in Google Cloud Shell or authenticated environment

PROJECT_ID="saigon-signals"

echo "🔐 Updating Secret Manager secrets..."
echo "Please provide the actual values for your secrets:"
echo ""

# JWT Secret
echo "Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)
printf %s "$JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=- --project="$PROJECT_ID"
echo "✅ JWT secret updated"

# Encryption Key
echo "Generating encryption key..."
ENCRYPTION_KEY=$(openssl rand -base64 32)
printf %s "$ENCRYPTION_KEY" | gcloud secrets versions add encryption-key --data-file=- --project="$PROJECT_ID"
echo "✅ Encryption key updated"

# Database URL (you'll need to provide this)
echo ""
echo "📝 Manual update required for:"
echo "1. dulce-db-url - Update with your actual database connection string"
echo "2. agents-api-key - Update with your actual API key"
echo ""
echo "To update manually:"
echo "gcloud secrets versions add dulce-db-url --data-file=- --project=$PROJECT_ID"
echo "gcloud secrets versions add agents-api-key --data-file=- --project=$PROJECT_ID"
echo ""
echo "🎉 Secret updates complete!"