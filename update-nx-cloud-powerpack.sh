#!/bin/bash

# Script to update Nx Cloud configuration for Powerpack trial
set -e

echo "===== Updating nx.json to use Nx Cloud Powerpack ====="
# Create a backup of nx.json
cp nx.json nx.json.powerpack.bak

# Update the nx.json file with Powerpack configuration
sed -i 's/"accessToken": "\${NX_CLOUD_ACCESS_TOKEN}"/"accessToken": "\${NX_CLOUD_AUTH_TOKEN}",\n        "useDelegatedWorkspaces": true/' nx.json

echo "===== Updating nx-cloud-ci.yml to use Nx Cloud Powerpack ====="
# Create a backup of nx-cloud-ci.yml
cp .github/workflows/nx-cloud-ci.yml .github/workflows/nx-cloud-ci.yml.powerpack.bak

# Add NX_CLOUD_POWERPACK environment variable
sed -i '/NX_CLOUD_DISTRIBUTED_EXECUTION: .true./a\  NX_CLOUD_POWERPACK: "true"' .github/workflows/nx-cloud-ci.yml

# Check if any existing CI workflows need to be updated
for workflow in .github/workflows/ci.yml .github/workflows/enhanced-cicd.yml; do
  if [ -f "$workflow" ]; then
    echo "===== Updating $workflow to use Nx Cloud Powerpack ====="
    # Create a backup
    cp "$workflow" "${workflow}.powerpack.bak"
    
    # Add NX_CLOUD_POWERPACK environment variable if NX_CLOUD_DISTRIBUTED_EXECUTION exists
    if grep -q "NX_CLOUD_DISTRIBUTED_EXECUTION" "$workflow"; then
      sed -i '/NX_CLOUD_DISTRIBUTED_EXECUTION: .true./a\  NX_CLOUD_POWERPACK: "true"' "$workflow"
    fi
  fi
done

echo "===== Nx Cloud Powerpack configuration updated ====="
echo "The following files were updated:"
echo "- nx.json (added useDelegatedWorkspaces: true)"
echo "- .github/workflows/nx-cloud-ci.yml (added NX_CLOUD_POWERPACK: true)"

# Optional: Commit the changes
read -p "Do you want to commit these changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git add nx.json .github/workflows/
  git commit -m "chore: update Nx Cloud configuration to use Powerpack trial"
  echo "Changes committed. Use 'git push' to push to remote repository."
else
  echo "Changes not committed. Review the changes and commit manually if needed."
fi
