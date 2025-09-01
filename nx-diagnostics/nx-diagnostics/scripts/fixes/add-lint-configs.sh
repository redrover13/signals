#!/bin/bash

# Fix script for: Add Missing Lint Configurations (15 projects)
# Generated: 2025-09-01T06:52:12.391Z

# Add missing lint configurations
echo "Adding lint configurations to projects..."
echo "Adding lint config to cms-api"
npx nx g @nx/eslint:lint-project --project=cms-api --skipFormat
echo "Adding lint config to reviews-api"
npx nx g @nx/eslint:lint-project --project=reviews-api --skipFormat
echo "Adding lint config to crm-api"
npx nx g @nx/eslint:lint-project --project=crm-api --skipFormat
echo "Adding lint config to social-api"
npx nx g @nx/eslint:lint-project --project=social-api --skipFormat
echo "Adding lint config to bq-agent"
npx nx g @nx/eslint:lint-project --project=bq-agent --skipFormat
echo "Adding lint config to looker-agent"
npx nx g @nx/eslint:lint-project --project=looker-agent --skipFormat
echo "Adding lint config to gemini-orchestrator"
npx nx g @nx/eslint:lint-project --project=gemini-orchestrator --skipFormat
echo "Adding lint config to crm-agent"
npx nx g @nx/eslint:lint-project --project=crm-agent --skipFormat
echo "Adding lint config to reviews-agent"
npx nx g @nx/eslint:lint-project --project=reviews-agent --skipFormat
echo "Adding lint config to content-agent"
npx nx g @nx/eslint:lint-project --project=content-agent --skipFormat
echo "Adding lint config to api-clients"
npx nx g @nx/eslint:lint-project --project=api-clients --skipFormat
echo "Adding lint config to gcp-auth"
npx nx g @nx/eslint:lint-project --project=gcp-auth --skipFormat
echo "Adding lint config to dbt-models"
npx nx g @nx/eslint:lint-project --project=dbt-models --skipFormat
echo "Adding lint config to schemas"
npx nx g @nx/eslint:lint-project --project=schemas --skipFormat
echo "Adding lint config to env"
npx nx g @nx/eslint:lint-project --project=env --skipFormat
