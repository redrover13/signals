#!/bin/bash

# Fix script for: Add Unit Tests for Applications (5 projects)
# Generated: 2025-09-01T04:17:49.916Z

# Add unit tests to projects
echo "Adding unit tests to projects..."
echo "Setting up tests for frontend-agents"
npx nx g @nx/jest:configuration --project=frontend-agents --setupFile=none --skipFormat
echo "Setting up tests for cms-api"
npx nx g @nx/jest:configuration --project=cms-api --setupFile=none --skipFormat
echo "Setting up tests for reviews-api"
npx nx g @nx/jest:configuration --project=reviews-api --setupFile=none --skipFormat
echo "Setting up tests for crm-api"
npx nx g @nx/jest:configuration --project=crm-api --setupFile=none --skipFormat
echo "Setting up tests for social-api"
npx nx g @nx/jest:configuration --project=social-api --setupFile=none --skipFormat
