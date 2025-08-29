#!/bin/bash
# Script to update the deprecated actions/cache reference

CACHE_ACTION_V4_SHA="13aacd865c20de90d75de3b17b4d668cea53b85f" # v4.0.0

echo "Updating deprecated actions/cache references in GitHub workflows..."

# Find all workflow files
for file in .github/workflows/*.yml; do
  echo "Checking $file..."
  
  # Check if the file contains the deprecated actions/cache reference
  if grep -q "actions/cache@704facf57e6136b1bc63b828d79edcd491f0ee84" "$file"; then
    echo "Updating actions/cache in $file..."
    
    # Replace the deprecated reference with the new one
    sed -i 's|actions/cache@704facf57e6136b1bc63b828d79edcd491f0ee84 # v3.3.2|actions/cache@13aacd865c20de90d75de3b17b4d668cea53b85f # v4.0.0|g' "$file"
    
    echo "✅ Updated actions/cache in $file"
  fi
done

echo "All workflows have been updated!"
