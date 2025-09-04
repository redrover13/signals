#!/bin/bash

# This script updates all pnpm/action-setup versions to v4.1.0 in GitHub workflow files

# Find all workflow files
WORKFLOW_FILES=$(find .github/workflows -name "*.yml")

# Loop through each file and update the pnpm/action-setup version
for file in $WORKFLOW_FILES; do
  echo "Processing $file..."
  
  # Check if the file contains pnpm/action-setup
  if grep -q "pnpm/action-setup@" "$file"; then
    # Update pnpm/action-setup@v3 to v4.1.0
    sed -i 's/pnpm\/action-setup@v3/pnpm\/action-setup@v4.1.0/g' "$file"
    
    # Update pnpm/action-setup@v4 to v4.1.0
    sed -i 's/pnpm\/action-setup@v4$/pnpm\/action-setup@v4.1.0/g' "$file"
    sed -i 's/pnpm\/action-setup@v4 /pnpm\/action-setup@v4.1.0 /g' "$file"
    
    echo "✅ Updated pnpm action version in $file"
  else
    echo "⏭️ No pnpm action setup found in $file, skipping"
  fi
done

echo "✨ All pnpm action versions have been updated to v4.1.0"
