# GitHub Workflow Update Report
Generated on: Thu Aug 28 08:00:49 +07 2025

## Workflows Updated

| Workflow File | Actions Pinned | PNPM Standardized |
| ------------- | -------------- | ----------------- |
| ai-models-validation.yml | ✅ | ✅ |
| api-docs.yml | ✅ | ✅ |
| auto-label-prs.yml | ✅ | ✅ |
| bundle-size.yml | ✅ | ✅ |
| ci.yml | ✅ | ✅ |
| codacy-analysis.yml | ✅ | ❌ |
| codeql.yml | ✅ | ✅ |
| commitlint.yml | ✅ | ✅ |
| container-security.yml | ✅ | ❌ |
| db-migration-verification.yml | ✅ | ✅ |
| dependabot-auto-merge.yml | ✅ | ❌ |
| dependency-review.yml | ✅ | ❌ |
| deploy.yml | ✅ | ✅ |
| gcp-cost-estimation.yml | ✅ | ❌ |
| license-compliance.yml | ✅ | ✅ |
| localization-validation.yml | ✅ | ❌ |
| monitoring.yml | ✅ | ✅ |
| multi-env-test.yml | ✅ | ✅ |
| nx-cache-warming.yml | ✅ | ❌ |
| performance-benchmark.yml | ✅ | ✅ |
| pr-validation.yml | ✅ | ❌ |
| release.yml | ✅ | ✅ |
| stale-pr.yml | ✅ | ❌ |
| stale.yml | ✅ | ❌ |

## Summary

- Total workflows: 24
- Workflows with pinned actions: 24
- Workflows with standardized pnpm setup: 18
- Workflows needing action pinning: 0
- Workflows needing pnpm standardization: 6

## Scripts Used

For future reference, the following scripts were created to help maintain GitHub workflow consistency:

1. [Update GitHub Actions with Pinned SHAs](./.github/scripts/update_additional_actions.sh) - Pins GitHub Actions to specific commit SHAs for security and stability.
2. [Standardize PNPM Setup](./.github/scripts/standardize_pnpm_setup.sh) - Ensures consistent PNPM caching and installation across workflows.
3. [Track Workflow Updates](./.github/scripts/track_workflow_updates.sh) - Generates this report to track which workflows need updates.

## Best Practices

- Always pin GitHub Actions to specific commit SHAs rather than version tags.
- Use consistent caching strategies for package managers across all workflows.
- Ensure all workflows follow the same patterns for common tasks like dependency installation.
