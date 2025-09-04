#!/bin/bash

# Script to fix GitHub workflows with missing STORE_PATH step
echo "Checking for workflow files with missing STORE_PATH initialization..."

# Find all workflow files with STORE_PATH: '' but missing the Get pnpm store directory step
for file in $(grep -l "STORE_PATH: ''" .github/workflows/*.yml); do
  if ! grep -q "Get pnpm store directory" "$file"; then
    echo "Fixing $file..."
    
    # Use sed to add the missing step after the Setup pnpm step
    sed -i '/Setup pnpm/,/run_install: false/!b;/run_install: false/a\
\
      - name: Get pnpm store directory\
        shell: bash\
        run: |\
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV' "$file"
    
    echo "✅ Fixed $file"
  else
    echo "✓ $file already has the required step"
  fi
done

echo "Done!"
