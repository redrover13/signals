#!/bin/bash
set -e

# Create a temporary main branch if it doesn't exist
if ! git show-ref --quiet refs/heads/main; then
  echo "Creating temporary main branch for CI/CD..."
  # Get the current branch
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  
  # Create a new main branch at the same commit
  git branch main
  
  echo "Temporary main branch created"
fi

# Run the command that was passed
"$@"

# Clean up if we created the main branch
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "Cleaning up temporary main branch..."
  git branch -D main 2>/dev/null || true
fi
