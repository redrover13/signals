#!/bin/bash
set -e

# Script to combine and process coverage reports for Codecov

echo "Creating combined coverage directory..."
mkdir -p ./coverage/combined

echo "Finding all lcov.info files..."
LCOV_FILES=$(find ./coverage -name "lcov.info" -not -path "./coverage/combined/*")

echo "Combining lcov.info files..."
if [ -n "$LCOV_FILES" ]; then
  # Create an empty lcov.info file in the combined directory
  > ./coverage/combined/lcov.info
  
  # Append each lcov.info file to the combined file
  for file in $LCOV_FILES; do
    echo "Processing $file..."
    cat "$file" >> ./coverage/combined/lcov.info
  done
  
  echo "Combined lcov.info created at ./coverage/combined/lcov.info"
else
  echo "No lcov.info files found!"
  exit 1
fi

# If nyc is available, also create a JSON report
if command -v npx &> /dev/null; then
  echo "Creating JSON report with nyc..."
  npx nyc merge ./coverage ./coverage/combined/coverage.json
  npx nyc report --reporter=lcov --report-dir=./coverage/combined --temp-dir=./coverage/combined
fi

echo "Coverage report preparation complete!"
