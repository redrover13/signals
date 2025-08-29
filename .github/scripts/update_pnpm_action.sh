#!/bin/bash

# Script to update pnpm/action-setup to a working commit SHA
# This script addresses the error: "An action could not be found at the URI 'https://api.github.com/repos/pnpm/action-setup/tarball/8095b2b9580c96f4e9a8177bec82d79210851024'"

echo "Updating pnpm/action-setup references in GitHub workflows..."

# The current non-working SHA
OLD_SHA="8095b2b9580c96f4e9a8177bec82d79210851024"

# The new working SHA for pnpm/action-setup v4.0.2
# Using the latest commit SHA from the v4 branch as of August 28, 2025
NEW_SHA="b8c4212bc8178b24a6daf5e3da8ac9dd35e3bab9"
NEW_VERSION="v4.0.2"

# Find all workflow files
workflow_files=$(find /home/g_nelson/signals-1/.github/workflows -name "*.yml" -o -name "*.yaml")

# Keep track of modified files
modified_files=()

for file in $workflow_files; do
  # Check if the file contains the old SHA
  if grep -q "pnpm/action-setup@$OLD_SHA" "$file"; then
    # Replace the old SHA with the new one, updating the version comment as well
    sed -i "s|pnpm/action-setup@$OLD_SHA # v4.0.0|pnpm/action-setup@$NEW_SHA # $NEW_VERSION|g" "$file"
    modified_files+=("$file")
    echo "Updated pnpm/action-setup reference in $file"
  fi
done

# Also update the reference in the update_additional_actions.sh script if it exists
if [ -f "/home/g_nelson/signals-1/.github/scripts/update_additional_actions.sh" ]; then
  if grep -q "pnpm/action-setup.*$OLD_SHA" "/home/g_nelson/signals-1/.github/scripts/update_additional_actions.sh"; then
    sed -i "s|$OLD_SHA.*# v4.0.0|$NEW_SHA # $NEW_VERSION|g" "/home/g_nelson/signals-1/.github/scripts/update_additional_actions.sh"
    modified_files+=("/home/g_nelson/signals-1/.github/scripts/update_additional_actions.sh")
    echo "Updated pnpm/action-setup reference in .github/scripts/update_additional_actions.sh"
  fi
fi

# Generate a summary
echo -e "\nSummary:"
echo "Updated pnpm/action-setup from commit $OLD_SHA (v4.0.0) to $NEW_SHA ($NEW_VERSION)"
echo "Modified ${#modified_files[@]} files:"
for file in "${modified_files[@]}"; do
  echo "  - ${file#/home/g_nelson/signals-1/}"
done

echo -e "\nComplete! Please commit these changes and push them to resolve the release preparation issue."
