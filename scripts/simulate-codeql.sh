#!/bin/bash
# This script simulates a CodeQL analysis run

echo "--- Setting up CodeQL analysis environment ---"
echo "Using CodeQL configuration from .github/codeql/typescript-config.yml"

# Display configuration
echo "--- Configuration Details ---"
echo "Language: javascript-typescript"
echo "Excluded directories: node_modules, dist, coverage, .pnpm-store, tmp, .nx"
echo "-----------------------------"

# Find all JS/TS files
echo "--- Scanning for JavaScript/TypeScript files ---"
find_output=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.nx/*" -not -path "*/.pnpm-store/*" -not -path "*/tmp/*" -not -path "*/coverage/*")
file_count=$(echo "$find_output" | wc -l)
echo "Found $file_count JavaScript/TypeScript files to analyze"

# Check for CDATA tags in files
echo "--- Checking for CDATA tags ---"
cdata_files=$(grep -l "<!\[CDATA\[" $(echo "$find_output"))
cdata_count=$(echo "$cdata_files" | grep -v "^$" | wc -l)

if [ "$cdata_count" -gt 0 ]; then
  echo "ERROR: Found $cdata_count files with CDATA tags"
  echo "Files with CDATA tags:"
  echo "$cdata_files"
  echo "These tags must be removed before CodeQL analysis"
else
  echo "PASS: No CDATA tags found"
fi

# Check for mixed module systems
echo "--- Checking for mixed module systems ---"
mixed_modules_count=0
mixed_modules_files=""

while IFS= read -r file; do
  if [ -n "$file" ]; then
    has_esm=$(grep -l -E "(import\s+.*\s+from\s+|export\s+\{|export\s+default\s+|export\s+const\s+|export\s+function\s+|export\s+class\s+)" "$file")
    has_cjs=$(grep -l -E "(module\.exports\s*=|exports\.\w+\s*=|require\s*\(\s*[\"\'])" "$file")
    
    if [ -n "$has_esm" ] && [ -n "$has_cjs" ] && [[ "$file" != *"fix-codeql-issues.js"* ]]; then
      mixed_modules_count=$((mixed_modules_count+1))
      mixed_modules_files="$mixed_modules_files\n$file"
    fi
  fi
done <<< "$find_output"

if [ "$mixed_modules_count" -gt 0 ]; then
  echo "WARNING: Found $mixed_modules_count files with mixed module systems"
  echo -e "Files with mixed module systems:$mixed_modules_files"
  echo "These should be consistent to avoid potential issues"
else
  echo "PASS: No mixed module systems found"
fi

# Final analysis summary
echo "--- CodeQL Analysis Summary ---"
echo "Total files analyzed: $file_count"
echo "CDATA tag issues: $cdata_count"
echo "Mixed module systems: $mixed_modules_count"

if [ "$cdata_count" -eq 0 ] && [ "$mixed_modules_count" -eq 0 ]; then
  echo "SUCCESS: CodeQL analysis should pass with no issues"
  exit 0
else
  total_issues=$((cdata_count + mixed_modules_count))
  echo "FAILURE: CodeQL analysis found $total_issues issues that need to be fixed"
  exit 1
fi
