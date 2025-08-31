#!/bin/bash

# Find all eslint.config.mjs files
files=$(find . -name "eslint.config.mjs")

# Loop through each file and update it
for file in $files; do
  echo "Updating $file..."
  
  # Check if the file contains the import pattern we're looking for
  if grep -q "import baseConfig from \"../\\.eslintrc.json\"" "$file" || \
     grep -q "import baseConfig from \"\\.\\./\\.eslintrc.json\"" "$file" || \
     grep -q "import baseConfig from '../\\.eslintrc.json'" "$file" || \
     grep -q "import baseConfig from '\\.\\./\\.eslintrc.json'" "$file"; then
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Rewrite the file
    sed -e 's/import baseConfig from "..\/\.eslintrc.json";/import { readFileSync } from '\''fs'\'';\n\n\/\/ Read and parse JSON configuration\nconst baseConfigStr = readFileSync('\''..\/\.eslintrc.json'\'', '\''utf8'\'');\nconst baseConfig = JSON.parse(baseConfigStr);/g' \
        -e 's/import baseConfig from "\.\.\/\.eslintrc.json";/import { readFileSync } from '\''fs'\'';\n\n\/\/ Read and parse JSON configuration\nconst baseConfigStr = readFileSync('\''..\/\.eslintrc.json'\'', '\''utf8'\'');\nconst baseConfig = JSON.parse(baseConfigStr);/g' \
        -e 's/import baseConfig from '\''..\/\.eslintrc.json'\'';/import { readFileSync } from '\''fs'\'';\n\n\/\/ Read and parse JSON configuration\nconst baseConfigStr = readFileSync('\''..\/\.eslintrc.json'\'', '\''utf8'\'');\nconst baseConfig = JSON.parse(baseConfigStr);/g' \
        -e 's/import baseConfig from '\''\.\.\/\.eslintrc.json'\'';/import { readFileSync } from '\''fs'\'';\n\n\/\/ Read and parse JSON configuration\nconst baseConfigStr = readFileSync('\''..\/\.eslintrc.json'\'', '\''utf8'\'');\nconst baseConfig = JSON.parse(baseConfigStr);/g' \
        "$file" > "$temp_file"
    
    # Replace the original file with the modified version
    mv "$temp_file" "$file"
    
    echo "Updated $file"
  else
    echo "No match found in $file, skipping..."
  fi
done

echo "Done updating ESLint config files."
