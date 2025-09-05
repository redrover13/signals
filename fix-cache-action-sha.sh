#!/bin/bash
set -e

echo "Updating GitHub Actions cache SHA pins..."

# Find all GitHub workflows
echo "Finding and updating all GitHub workflow files..."
workflows=$(find .github/workflows -name "*.yml")

# Update all workflow files
for workflow in $workflows; do
  echo "Processing $workflow..."
  
  # Replace deprecated cache action SHA with the correct one
  sed -i 's/actions\/cache@0c45773b623bea8c8e75f6c82b208c3cf94ea4f9/actions\/cache@704facf57e6136b1bc63b828d79edcd491f0ee84/g' $workflow
  
  # Also check for any other cache versions that need SHA pins
  sed -i 's/actions\/cache@v3/actions\/cache@704facf57e6136b1bc63b828d79edcd491f0ee84 # v4/g' $workflow
  sed -i 's/actions\/cache@v2/actions\/cache@704facf57e6136b1bc63b828d79edcd491f0ee84 # v4/g' $workflow
  sed -i 's/actions\/cache@v1/actions\/cache@704facf57e6136b1bc63b828d79edcd491f0ee84 # v4/g' $workflow
done

echo "Cache action SHA updates completed successfully!"
