#!/bin/bash

# Script to enhance Nx Cloud Powerpack configuration
set -e

echo "===== Enhancing Nx Cloud Powerpack Configuration ====="

# Backup current nx.json if not already backed up
if [ ! -f "nx.json.powerpack.bak" ]; then
  echo "Creating backup of nx.json..."
  cp nx.json nx.json.powerpack.bak
fi

# Enhance nx.json with additional Powerpack optimizations
echo "Enhancing nx.json with additional Powerpack optimizations..."

# Adjust the maxParallel setting for better performance
sed -i 's/"maxParallel": 5/"maxParallel": 8/' nx.json

# Add distributed execution configuration if not already present
if ! grep -q "distributedCacheEnabled" nx.json; then
  sed -i '/"remoteCache": {/,/}/c\        "remoteCache": {\n          "enabled": true,\n          "optimizeYourTerminal": true\n        },\n        "distributedCacheEnabled": true,\n        "distributedExecutionEnabled": true' nx.json
fi

# Add smart rebuilds configuration if not already present
if ! grep -q "rebuildOptimizations" nx.json; then
  sed -i '/"distributedExecutionEnabled": true/a\        "rebuildOptimizations": true' nx.json
fi

# Add CI specific configuration
echo "Enhancing CI workflows with Powerpack optimizations..."

# Function to update CI workflow files
update_workflow() {
  local workflow=$1
  if [ -f "$workflow" ]; then
    echo "Updating $workflow..."
    
    # Create backup if not already backed up
    local backup="${workflow}.powerpack.bak"
    if [ ! -f "$backup" ]; then
      cp "$workflow" "$backup"
    fi
    
    # Add Powerpack environment variables
    if grep -q "NX_CLOUD_DISTRIBUTED_EXECUTION" "$workflow"; then
      if ! grep -q "NX_CLOUD_POWERPACK" "$workflow"; then
        sed -i '/NX_CLOUD_DISTRIBUTED_EXECUTION: .true./a\  NX_CLOUD_POWERPACK: "true"' "$workflow"
      fi
      
      # Add additional Powerpack optimizations
      if ! grep -q "NX_CLOUD_SMART_REBUILDS" "$workflow"; then
        sed -i '/NX_CLOUD_POWERPACK: "true"/a\  NX_CLOUD_SMART_REBUILDS: "true"' "$workflow"
      fi
    fi
  fi
}

# Update all relevant workflow files
update_workflow ".github/workflows/nx-cloud-ci.yml"
update_workflow ".github/workflows/ci.yml"
update_workflow ".github/workflows/enhanced-cicd.yml"

# Update package.json scripts for Powerpack support
echo "Updating package.json scripts for Powerpack support..."

# Add nx-cloud setup script if not already present
if ! grep -q "\"nx:cloud-setup\":" "package.json"; then
  sed -i '/  "scripts": {/a\    "nx:cloud-setup": "nx g @nx/workspace:npm-scripts",' package.json
fi

# Add command to view Nx Cloud reports
if ! grep -q "\"nx:cloud-report\":" "package.json"; then
  sed -i '/  "scripts": {/a\    "nx:cloud-report": "nx run-many --target=build --all --skip-nx-cache --configuration=production --with-deps",' package.json
fi

echo "===== Nx Cloud Powerpack enhancements complete ====="
echo "The following changes were made:"
echo "- Enhanced nx.json with optimized Powerpack configuration"
echo "- Updated CI workflows with additional Powerpack optimizations"
echo "- Added new Nx Cloud scripts to package.json"
echo ""
echo "Next steps:"
echo "1. Review the changes with 'git diff'"
echo "2. Commit the changes with 'git commit -am \"chore: enhance Nx Cloud Powerpack configuration\"'"
echo "3. Push the changes with 'git push'"
