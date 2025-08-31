#!/bin/bash

# Script to update GitHub Actions SHA references to tag-based versions
echo "Updating GitHub Actions references..."

# Replace actions/cache SHA with tag version
find .github/workflows -type f -name "*.yml" -exec sed -i 's/actions\/cache@13aacd865c20de90d75de3b17b4d668cea53b85f # v4.0.0/actions\/cache@v4/g' {} \;

# Replace actions/setup-node SHA with tag version
find .github/workflows -type f -name "*.yml" -exec sed -i 's/actions\/setup-node@c4c9e84c7b9465a335b762113626741ec8e95c00 # v4.0.1/actions\/setup-node@v4/g' {} \;

echo "All GitHub Actions references have been updated!"
