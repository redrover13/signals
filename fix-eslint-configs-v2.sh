#!/bin/bash

# Find all eslint.config.mjs files
files=$(find . -name "eslint.config.mjs")

# Loop through each file and update it
for file in $files; do
  echo "Checking $file..."
  
  # Read the file content
  content=$(cat "$file")
  
  # Check if it contains an import from .eslintrc.json
  if [[ $content =~ import[[:space:]]+baseConfig[[:space:]]+from[[:space:]]+[\"\']\.\./\.eslintrc\.json[\"\'] || 
        $content =~ import[[:space:]]+baseConfig[[:space:]]+from[[:space:]]+[\"\']\.\.\/\.\.\/\.eslintrc\.json[\"\'] ]]; then
    
    # Extract the relative path
    if [[ $content =~ import[[:space:]]+baseConfig[[:space:]]+from[[:space:]]+[\"\'](\.\..*\.eslintrc\.json)[\"\'] ]]; then
      path="${BASH_REMATCH[1]}"
      echo "Found import with path: $path"
      
      # Create the replacement
      replacement="import { readFileSync } from 'fs';\n\n// Read and parse JSON configuration\nconst baseConfigStr = readFileSync('$path', 'utf8');\nconst baseConfig = JSON.parse(baseConfigStr);"
      
      # Create a temporary file
      temp_file=$(mktemp)
      
      # Replace the import line
      perl -pe "s/import\s+baseConfig\s+from\s+['\"]$path['\"]\s*;/$replacement/g" "$file" > "$temp_file"
      
      # Move the temp file back
      mv "$temp_file" "$file"
      
      echo "Updated $file"
    else
      echo "Import found but couldn't extract path. Skipping $file"
    fi
  else
    echo "No matching import found in $file. Skipping..."
  fi
done

echo "Done updating ESLint config files."
