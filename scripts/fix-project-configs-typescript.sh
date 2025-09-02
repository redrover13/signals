#!/bin/bash

# Script to fix the update-project-configs.ts file, which seems to have severe syntax errors

echo "Fixing errors in update-project-configs.ts..."

# Path to the file
CONFIG_FILE="/home/g_nelson/signals-1/tools/scripts/update-project-configs.ts"

# Create a backup
cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"

# Fix the config.targets?. issues - replace with proper conditional checks
sed -i 's/config.targets?.\\["build"\\]/config.targets \&\& config.targets["build"]/g' "$CONFIG_FILE"
sed -i 's/config.targets?.\\["lint"\\]/config.targets \&\& config.targets["lint"]/g' "$CONFIG_FILE"
sed -i 's/config.targets?.\\["test"\\]/config.targets \&\& config.targets["test"]/g' "$CONFIG_FILE"

# Fix the type annotations in the file
sed -i 's/string || undefined/string | undefined/g' "$CONFIG_FILE"
sed -i 's/any || undefined/any | undefined/g' "$CONFIG_FILE"

echo "Fixed errors in update-project-configs.ts."
