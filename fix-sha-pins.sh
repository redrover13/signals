#!/bin/bash

# Script to replace SHA pinned GitHub Actions with their version tags

# Find all workflow files
workflow_files=$(find .github/workflows -name "*.yml")

for file in $workflow_files; do
  echo "Processing $file..."
  
  # Create a temporary file
  temp_file="${file}.tmp"
  
  # Process the file: Replace SHA pins with version tags
  # This sed command looks for lines with SHA pins and version comments, and replaces with just the version
  sed -E 's|uses: ([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)@[0-9a-f]{40} # (v[0-9]+\.[0-9]+\.[0-9]+)|uses: \1@\2|g' "$file" > "$temp_file"
  
  # Replace the original file with the processed one
  mv "$temp_file" "$file"
  
  echo "Completed processing $file"
done

echo "All workflow files updated!"
