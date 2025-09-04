# PNPM Action Version Standardization

This directory contains a script to standardize all GitHub workflow files to use the same version of pnpm/action-setup.

## Background

The repository had inconsistent versions of the pnpm/action-setup action across different workflow files:
- Some used pnpm/action-setup@v3
- Some used pnpm/action-setup@v4
- Some used pnpm/action-setup@v4.1.0 (the desired version)

## What the script does

The `fix-pnpm-action-versions.sh` script:

1. Searches for all GitHub workflow files (*.yml) in the .github/workflows directory
2. For each file, checks if it contains the pnpm/action-setup action
3. Updates any occurrences of pnpm/action-setup@v3 or pnpm/action-setup@v4 to pnpm/action-setup@v4.1.0
4. Displays a summary of which files were updated

## Usage

```bash
# Make the script executable (if not already)
chmod +x fix-pnpm-action-versions.sh

# Run the script
./fix-pnpm-action-versions.sh
```

## Benefits

Standardizing the pnpm action version across all workflows ensures:

1. Consistent behavior across all CI/CD processes
2. Easier maintenance and updates
3. Reduced risk of compatibility issues
4. Alignment with the lockfile version requirements

## Next Steps

After running this script, consider:

1. Reviewing the changes to ensure they meet your requirements
2. Running the workflows to verify they function correctly
3. Committing the changes to your repository
