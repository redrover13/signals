#!/bin/bash
set -e

echo "Creating comprehensive fix for GitHub workflows..."

# Update nx.json to use local task runner
echo "Updating nx.json to use local task runner..."
sed -i 's/"runner": "nx-cloud"/"runner": "@nx\/tasks-runner"/g' nx.json
sed -i '/"accessToken"/d' nx.json
sed -i '/cacheableOperations/a \ \ \ \ \ \ \ \ "parallel": 3,\n        "cacheDirectory": ".nx\/cache"' nx.json

# Find all GitHub workflows
echo "Finding and updating all GitHub workflow files..."
workflows=$(find .github/workflows -name "*.yml")

# Update all workflow files
for workflow in $workflows; do
  echo "Processing $workflow..."
  
  # Replace GitHub Actions with SHA-pinned versions
  sed -i 's/uses: actions\/checkout@v4/uses: actions\/checkout@b4ffde65f42bc1c9890d4047f6d0ff69e889a4ca # v4/g' $workflow
  sed -i 's/uses: actions\/setup-node@v4/uses: actions\/setup-node@b4ffde65f42bc1c9890d4047f6d0ff69e889a4ca # v4/g' $workflow
  sed -i 's/uses: pnpm\/action-setup@v4.1.0/uses: pnpm\/action-setup@4fe8674f344d65cf7384fc21ba97c2b05fd8df75 # v4.1.0/g' $workflow
  sed -i 's/uses: actions\/cache@v4/uses: actions\/cache@704facf57e6136b1bc63b828d79edcd491f0ee84 # v4/g' $workflow
  
  # Add parallel option to nx affected commands if not already present
  sed -i 's/nx affected --target=lint/nx affected --target=lint --parallel=3/g' $workflow
  sed -i 's/nx affected --target=build/nx affected --target=build --parallel=3/g' $workflow
  sed -i 's/nx affected --target=test/nx affected --target=test --parallel=3/g' $workflow
  
  # Special fix for pnpm lint:ci script if used
  sed -i 's/pnpm lint:ci/pnpm nx affected --target=lint --parallel=3 --max-warnings=0/g' $workflow
  sed -i 's/pnpm build/pnpm nx affected --target=build --parallel=3/g' $workflow
done

# Update package.json scripts to remove nx cloud references
echo "Updating package.json scripts..."
sed -i 's/"nx:cloud-report": "nx run-many --target=build --all --skip-nx-cache/"nx:report": "nx run-many --target=build --all/g' package.json
sed -i '/"nx:cloud-setup": "nx g @nx\/workspace:npm-scripts",/d' package.json

echo "Comprehensive fix completed successfully!"
