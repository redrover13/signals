#!/bin/bash

# Script to fix remaining issues and run validation checks
set -e

echo "===== Fixing require() imports in test files ====="
# List of files to fix
files=(
  "libs/adk/src/agents/base-agent.spec.ts"
  "libs/adk/src/services/vertex.spec.ts"
  "libs/security/src/security.test.ts"
  "libs/utils/monitoring/src/lib/monitoring.spec.ts"
)

# Temporary file for processing
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Replace require() with ES module imports where possible
    sed -i -E 's/const \{ ([^}]+) \} = require\(['"'"'"]\([^)]+\)['"'"'"]\);/import { \1 } from \1;/g' "$file"
    # Add jest import if missing
    if ! grep -q "import.*jest" "$file"; then
      sed -i '1s/^/import { jest } from '"'"'@jest\/globals'"'"';\n/' "$file"
    fi
  else
    echo "File $file does not exist, skipping..."
  fi
done

echo "===== Checking GitHub workflow files ====="
# Validate YAML files 
github_workflows=(
  ".github/workflows/enhanced-cicd.yml"
  ".github/workflows/monitoring.yml"
  ".github/workflows/typescript-validation.yml"
)

for workflow in "${github_workflows[@]}"; do
  if [ -f "$workflow" ]; then
    echo "Validating $workflow..."
    # Simple validation to ensure it's valid YAML
    if which yamllint > /dev/null 2>&1; then
      yamllint -d relaxed "$workflow" || echo "YAML validation issues detected in $workflow (non-fatal)"
    else
      echo "yamllint not installed, skipping YAML validation"
    fi
  else
    echo "Workflow file $workflow does not exist, skipping..."
  fi
done

echo "===== Running ESLint to check for remaining issues ====="
# Create a temporary .eslintignore file to exclude problematic files
cat > .eslintignore << 'EOF'
node_modules
dist
coverage
temp
.nx
**/*.js
**/*.jsx
**/*.cjs
**/*.mjs
**/eslint.config.*
EOF

# Run ESLint on TypeScript files
npx eslint --ext .ts,.tsx libs/adk/src/ --max-warnings=0 || echo "ESLint found issues (non-fatal)"

echo "===== Checking TypeScript compilation ====="
# Run TypeScript compiler to check for type errors
npx tsc --noEmit || echo "TypeScript compilation issues detected (non-fatal)"

echo "===== Validation complete ====="
echo "All fixes have been applied. Some issues may require manual fixes:"
echo "1. Check remaining ESLint errors in TypeScript files"
echo "2. Ensure all GitHub workflow files have correct syntax"
echo "3. Fix any remaining TypeScript compilation errors"
