# GitHub Actions Deprecation Check
Generated on: Thu Aug 28 08:10:39 +07 2025

This report identifies potentially outdated or deprecated GitHub Actions in your workflows.

## Findings

| Workflow | Action | Current Version | Recommended Version |
| -------- | ------ | --------------- | ------------------- |
| - | No deprecated actions found | - | - |

## Recommendations

1. **Pin all GitHub Actions to specific commit SHAs** for improved security and stability.
2. **Update deprecated actions** to their recommended versions.
3. **Regularly check for updates** to GitHub Actions and update the pinned SHAs when necessary.

## Tools

Use the following tools in the `.github/scripts` directory to maintain your workflows:

- `update_additional_actions.sh`: Update GitHub Actions to use pinned commit SHAs
- `update_cache_action.sh`: Update deprecated cache actions
- `standardize_pnpm_setup.sh`: Standardize pnpm setup across workflows
