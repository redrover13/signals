#!/bin/bash

# Script to fix common GitHub workflow issues

echo "Fixing GitHub workflow files..."

WORKFLOW_DIR="/home/runner/work/signals/signals/.github/workflows"

# Function to fix pnpm version in a file
fix_pnpm_version() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Fixing pnpm version in $(basename "$file")..."
        sed -i 's/version: 8$/version: 10.0.0/' "$file"
    fi
}

# Function to fix STORE_PATH environment variable
fix_store_path() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Fixing STORE_PATH in $(basename "$file")..."
        sed -i 's/STORE_PATH: \$(pnpm store path)/STORE_PATH: ""/' "$file"
    fi
}

# Function to add proper pnpm store setup
add_store_setup() {
    local file="$1"
    if [ -f "$file" ] && grep -q "STORE_PATH" "$file" && ! grep -q "Get pnpm store directory" "$file"; then
        echo "Adding store setup to $(basename "$file")..."
        # This is a basic approach - in practice, you'd want more sophisticated text processing
        # For now, we'll handle this manually for the specific files that need it
    fi
}

# Process all workflow files
for file in "$WORKFLOW_DIR"/*.yml; do
    if [ -f "$file" ]; then
        echo "Processing $(basename "$file")..."
        fix_pnpm_version "$file"
        fix_store_path "$file"
    fi
done

echo "Workflow files updated!"