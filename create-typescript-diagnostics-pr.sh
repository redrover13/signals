#!/usr/bin/env bash

# Create branch for TypeScript diagnostics PR
git checkout -b feature/typescript-diagnostics

# Copy files to proper locations
mkdir -p typescript-diagnostics/reports
mkdir -p typescript-diagnostics/configs
mkdir -p typescript-diagnostics/scripts/fixes

# Set execute permissions on scripts
chmod +x typescript-diagnostics/scripts/diagnose.js
chmod +x typescript-diagnostics/scripts/analyze-lodash-migration.js
chmod +x typescript-diagnostics/scripts/standardize-tsconfig.js
chmod +x typescript-diagnostics/scripts/fix-common-errors.js
chmod +x typescript-diagnostics/scripts/run-all-diagnostics.js
chmod +x typescript-diagnostics/scripts/verify-codacy-compliance.js
chmod +x typescript-diagnostics/scripts/nx-typescript-diagnostics.js

# Update package.json with new scripts
cat << 'EOF' > package.json.update
  "ts:diagnostics": "node typescript-diagnostics/scripts/run-all-diagnostics.js",
  "ts:diagnostics:fix": "node typescript-diagnostics/scripts/run-all-diagnostics.js --apply",
  "ts:diagnostics:lodash": "node typescript-diagnostics/scripts/analyze-lodash-migration.js",
  "ts:diagnostics:config": "node typescript-diagnostics/scripts/standardize-tsconfig.js",
  "ts:diagnostics:errors": "node typescript-diagnostics/scripts/fix-common-errors.js",
  "ts:diagnostics:nx": "node typescript-diagnostics/scripts/nx-typescript-diagnostics.js",
  "ts:diagnostics:nx:fix": "node typescript-diagnostics/scripts/nx-typescript-diagnostics.js --fix",
  "ts:diagnostics:codacy": "node typescript-diagnostics/scripts/verify-codacy-compliance.js",
EOF

# Insert new scripts after the existing TypeScript scripts
sed -i '/ts:refs:generate/r package.json.update' package.json

# Remove temporary file
rm package.json.update

# Add files to git
git add typescript-diagnostics/
git add package.json
git add PR_PLAN.md

# Create commit
git commit -m "Add comprehensive TypeScript diagnostics toolkit

This commit adds a suite of TypeScript diagnostic tools to:
- Identify and categorize TypeScript errors
- Analyze lodash-to-lodash-es migration issues
- Standardize TypeScript configurations
- Provide automated fixes for common issues
- Integrate with Nx projects
- Verify Codacy compliance

The tools generate comprehensive reports and can be run individually or as a complete suite."

# Push branch (commented out for safety)
# git push -u origin feature/typescript-diagnostics

echo "PR branch created locally. Review the changes and push when ready."
echo "To push the branch: git push -u origin feature/typescript-diagnostics"
