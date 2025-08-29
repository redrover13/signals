#!/bin/bash

# Comprehensive workflow fix script

WORKFLOW_DIR="/home/runner/work/signals/signals/.github/workflows"

echo "Adding proper STORE_PATH setup to workflow files..."

# Files that need the STORE_PATH fix
FILES_TO_FIX=(
    "performance-benchmark.yml"
    "api-docs.yml"
    "bundle-size.yml"
    "multi-env-test.yml"
    "license-compliance.yml"
)

for file in "${FILES_TO_FIX[@]}"; do
    filepath="$WORKFLOW_DIR/$file"
    if [ -f "$filepath" ]; then
        echo "Processing $file..."
        
        # Check if it has pnpm setup but missing proper STORE_PATH setup
        if grep -q "Setup pnpm" "$filepath" && grep -q 'STORE_PATH: ""' "$filepath" && ! grep -q "Get pnpm store directory" "$filepath"; then
            echo "Adding STORE_PATH setup to $file"
            
            # Add the store path setup after Setup pnpm
            sed -i '/Setup pnpm/,/version: 10.0.0/a\\n      - name: Get pnpm store directory\n        shell: bash\n        run: |\n          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV' "$filepath"
            
            # Fix the cache path format
            sed -i 's|path: |\n          ${{ env.STORE_PATH }}|path: ${{ env.STORE_PATH }}|g' "$filepath"
        fi
    fi
done

echo "Workflow fixes completed!"