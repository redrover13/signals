#!/bin/bash
# Script to update GitHub workflow files with standardized pnpm setup

# Define the pinned commit SHAs for GitHub Actions
PNPM_ACTION_SHA="8095b2b9580c96f4e9a8177bec82d79210851024" # v4.0.0
CHECKOUT_ACTION_SHA="b4ffde65f46336ab88eb53be808477a3936bae11" # v4.1.1
SETUP_NODE_ACTION_SHA="c4c9e84c7b9465a335b762113626741ec8e95c00" # v4.0.1

# Function to update workflow files
update_workflow_file() {
  local file=$1
  echo "Updating $file..."
  
  # Replace pnpm/action-setup versions with pinned SHA
  sed -i 's|uses: pnpm/action-setup@v2|uses: pnpm/action-setup@'"$PNPM_ACTION_SHA"' # v4.0.0|g' "$file"
  sed -i 's|uses: pnpm/action-setup@v3|uses: pnpm/action-setup@'"$PNPM_ACTION_SHA"' # v4.0.0|g' "$file"
  sed -i 's|uses: pnpm/action-setup@v4|uses: pnpm/action-setup@'"$PNPM_ACTION_SHA"' # v4.0.0|g' "$file"
  
  # Replace actions/checkout with pinned SHA
  sed -i 's|uses: actions/checkout@v4|uses: actions/checkout@'"$CHECKOUT_ACTION_SHA"' # v4.1.1|g' "$file"
  
  # Replace actions/setup-node with pinned SHA
  sed -i 's|uses: actions/setup-node@v4|uses: actions/setup-node@'"$SETUP_NODE_ACTION_SHA"' # v4.0.1|g' "$file"
  
  # Ensure cache: 'pnpm' is set for Node.js setup
  sed -i '/node-version:/!s/node-version: .*$/&\n          cache: '"'pnpm'"'/g' "$file"
  
  echo "✅ Updated $file"
}

# Update all workflow files
for file in .github/workflows/*.yml; do
  update_workflow_file "$file"
done

echo "All workflow files have been updated with standardized pnpm setup!"
