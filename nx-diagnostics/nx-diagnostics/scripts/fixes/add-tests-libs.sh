#!/bin/bash

# Fix script for: Add Unit Tests for Libraries (2 projects)
# Generated: 2025-09-01T04:17:49.916Z

# Add unit tests to projects
echo "Adding unit tests to projects..."
echo "Setting up tests for gcp-core"
npx nx g @nx/jest:configuration --project=gcp-core --setupFile=none --skipFormat
echo "Setting up tests for gcp"
npx nx g @nx/jest:configuration --project=gcp --setupFile=none --skipFormat
