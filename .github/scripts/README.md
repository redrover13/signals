# GitHub Workflow Maintenance Scripts

This directory contains scripts for maintaining and standardizing GitHub workflow files.

## Available Scripts

### `update_additional_actions.sh`

This script updates GitHub Actions to use pinned commit SHAs instead of version tags for improved security and stability.

**Usage:**
```bash
./update_additional_actions.sh
```

### `standardize_pnpm_setup.sh`

This script standardizes the PNPM setup across all workflows, ensuring consistent caching and installation practices.

**Usage:**
```bash
./standardize_pnpm_setup.sh
```

### `track_workflow_updates.sh`

This script generates a report on the status of workflow updates, tracking which workflows have been properly configured.

**Usage:**
```bash
./track_workflow_updates.sh
```

## Best Practices

1. **Pin GitHub Actions to Commit SHAs** - Always use specific commit SHAs rather than version tags (e.g., `@5b6282e9b4faa8b74e62906ca462e4fdffe9e1a2` instead of `@v3`).
   
2. **Standardize Package Manager Setup** - Use consistent caching and installation patterns for package managers across all workflows.
   
3. **Regularly Update Pinned Versions** - Periodically check for updates to GitHub Actions and update the pinned SHAs when necessary.
   
4. **Run the Tracking Script** - Run the tracking script before merging workflow changes to ensure all standards are met.

## Why Pin GitHub Actions?

Using version tags like `@v3` can lead to unexpected behavior if the action is updated without your knowledge. Pinning to specific commit SHAs ensures you always use the exact same version of the action, preventing potential security or compatibility issues.
