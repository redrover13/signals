#!/bin/bash

# CI/CD Cleanup Script
# Removes redundant and deprecated CI/CD files

echo "🧹 Cleaning up CI/CD configuration..."

# Remove deprecated GitHub Actions workflows
echo "Removing deprecated GitHub Actions workflows..."
rm -f .github/workflows/_ci.yml
rm -f .github/workflows/_deploy-gcp.yml
rm -f .github/workflows/ci-complete.yml
rm -f .github/workflows/codacy.yml
rm -f .github/workflows/env-check.yml
rm -f .github/workflows/gitops-ci.yml
rm -f .github/workflows/pr-checks.yml
rm -f .github/workflows/self-healing.yml
rm -f .github/workflows/test-wif.yml

# Remove GitLab CI (if not using GitLab)
echo "Removing GitLab CI configuration..."
rm -f .gitlab-ci.yml

# Backup and replace Cloud Build config
echo "Backing up original cloudbuild.yaml..."
mv cloudbuild.yaml cloudbuild-original.yaml.bak
# Skipping replacement as cloudbuild-optimized.yaml does not exist
# Ensure cloudbuild.yaml is backed up only

echo "✅ CI/CD cleanup complete!"
echo ""
echo "📋 Summary of changes:"
echo "  - Removed 9 redundant GitHub Actions workflows"
echo "  - Removed GitLab CI configuration"
echo "  - Replaced complex Cloud Build with optimized version"
echo "  - New streamlined CI: .github/workflows/ci.yml"
echo "  - New PR validation: .github/workflows/pr-validation.yml"
echo ""
echo "🔧 Next steps:"
echo "  1. Update repository secrets if needed"
echo "  2. Test the new CI pipeline with a PR"
echo "  3. Remove cloudbuild-original.yaml.bak after verification"