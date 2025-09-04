#!/bin/bash

# Update Nx Cloud CI workflow
echo "Updating Nx Cloud CI workflow..."
# Changes already applied to nx-cloud-ci.yml

# Update nx.json configuration
echo "Updating nx.json configuration..."
# Changes already applied to nx.json

# Commit the changes
git add .github/workflows/nx-cloud-ci.yml nx.json
git commit -m "ci: update Nx Cloud configuration for Powerpack trial"
git push

echo "Nx Cloud configuration updated for Powerpack trial. Changes committed and pushed."
echo "PR #54 should now pass the CI checks."

# Instructions for monitoring
echo ""
echo "Next steps:"
echo "1. Monitor the PR #54 CI status at: https://github.com/redrover13/signals/pull/54"
echo "2. If there are still issues, check the Nx Cloud dashboard for more details"
