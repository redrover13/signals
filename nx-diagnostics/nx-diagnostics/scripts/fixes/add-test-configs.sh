#!/bin/bash

# Fix script for: Add Missing Test Configurations (2 projects)
# Generated: 2025-09-01T06:52:12.391Z

# Add missing test configurations
echo "Adding test configurations to projects..."
echo "Adding test config to agents-lib"
npx nx g @nx/jest:jest-project --project=agents-lib --setupFile=jest --skipFormat
echo "Adding test config to gcp"
npx nx g @nx/jest:jest-project --project=gcp --setupFile=jest --skipFormat
