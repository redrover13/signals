#!/bin/bash
# Script to check for outdated or deprecated GitHub Actions

echo "# GitHub Actions Deprecation Check" > deprecated_actions_report.md
echo "Generated on: $(date)" >> deprecated_actions_report.md
echo "" >> deprecated_actions_report.md
echo "This report identifies potentially outdated or deprecated GitHub Actions in your workflows." >> deprecated_actions_report.md
echo "" >> deprecated_actions_report.md

# Create headers for the report
echo "## Findings" >> deprecated_actions_report.md
echo "" >> deprecated_actions_report.md
echo "| Workflow | Action | Current Version | Recommended Version |" >> deprecated_actions_report.md
echo "| -------- | ------ | --------------- | ------------------- |" >> deprecated_actions_report.md

# List of known deprecated actions and their recommended replacements
declare -A DEPRECATED_ACTIONS
DEPRECATED_ACTIONS["actions/cache@v1"]="actions/cache@v4 (commit: 13aacd865c20de90d75de3b17b4d668cea53b85f)"
DEPRECATED_ACTIONS["actions/cache@v2"]="actions/cache@v4 (commit: 13aacd865c20de90d75de3b17b4d668cea53b85f)"
DEPRECATED_ACTIONS["actions/cache@v3"]="actions/cache@v4 (commit: 13aacd865c20de90d75de3b17b4d668cea53b85f)"
DEPRECATED_ACTIONS["actions/upload-artifact@v1"]="actions/upload-artifact@v4 (commit: 0ad4c6ed3e171a3811d54af8513112f386372766)"
DEPRECATED_ACTIONS["actions/upload-artifact@v2"]="actions/upload-artifact@v4 (commit: 0ad4c6ed3e171a3811d54af8513112f386372766)"
DEPRECATED_ACTIONS["actions/download-artifact@v1"]="actions/download-artifact@v4 (commit: 694a571876d6598ad8b4a2365a1d88cd1a5c6473)"
DEPRECATED_ACTIONS["actions/download-artifact@v2"]="actions/download-artifact@v4 (commit: 694a571876d6598ad8b4a2365a1d88cd1a5c6473)"
DEPRECATED_ACTIONS["actions/setup-node@v1"]="actions/setup-node@v4 (commit: c4c9e84c7b9465a335b762113626741ec8e95c00)"
DEPRECATED_ACTIONS["actions/setup-node@v2"]="actions/setup-node@v4 (commit: c4c9e84c7b9465a335b762113626741ec8e95c00)"
DEPRECATED_ACTIONS["actions/checkout@v1"]="actions/checkout@v4 (commit: b4ffde65f46336ab88eb53be808477a3936bae11)"
DEPRECATED_ACTIONS["actions/checkout@v2"]="actions/checkout@v4 (commit: b4ffde65f46336ab88eb53be808477a3936bae11)"

# Check for deprecated references in workflow files
found_deprecated=false

for file in .github/workflows/*.yml; do
  filename=$(basename "$file")
  
  # Check for known deprecated actions
  for action in "${!DEPRECATED_ACTIONS[@]}"; do
    if grep -q "uses: $action" "$file"; then
      echo "| $filename | $action | Deprecated | ${DEPRECATED_ACTIONS[$action]} |" >> deprecated_actions_report.md
      found_deprecated=true
    fi
  done
  
  # Check for non-pinned actions (using @ without a full commit hash)
  # Exclude commented lines (lines with # before uses:)
  if grep -E "uses: [a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-]+@v[0-9]+" "$file" | grep -v -E "@[a-f0-9]{40}" | grep -v "^\s*#" > /dev/null; then
    while read -r line; do
      # Extract the action reference
      action=$(echo "$line" | grep -o -E "[a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-]+@v[0-9]+" | head -1)
      if [ ! -z "$action" ]; then
        # Check if this is a commented line
        if ! echo "$line" | grep -q "^\s*#"; then
          echo "| $filename | $action | Not pinned to SHA | Pin to specific commit SHA |" >> deprecated_actions_report.md
          found_deprecated=true
        fi
      fi
    done < <(grep -E "uses: [a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-]+@v[0-9]+" "$file" | grep -v -E "@[a-f0-9]{40}" | grep -v "^\s*#")
  fi
done

if [ "$found_deprecated" = false ]; then
  echo "| - | No deprecated actions found | - | - |" >> deprecated_actions_report.md
fi

echo "" >> deprecated_actions_report.md
echo "## Recommendations" >> deprecated_actions_report.md
echo "" >> deprecated_actions_report.md
echo "1. **Pin all GitHub Actions to specific commit SHAs** for improved security and stability." >> deprecated_actions_report.md
echo "2. **Update deprecated actions** to their recommended versions." >> deprecated_actions_report.md
echo "3. **Regularly check for updates** to GitHub Actions and update the pinned SHAs when necessary." >> deprecated_actions_report.md
echo "" >> deprecated_actions_report.md
echo "## Tools" >> deprecated_actions_report.md
echo "" >> deprecated_actions_report.md
echo "Use the following tools in the \`.github/scripts\` directory to maintain your workflows:" >> deprecated_actions_report.md
echo "" >> deprecated_actions_report.md
echo "- \`update_additional_actions.sh\`: Update GitHub Actions to use pinned commit SHAs" >> deprecated_actions_report.md
echo "- \`update_cache_action.sh\`: Update deprecated cache actions" >> deprecated_actions_report.md
echo "- \`standardize_pnpm_setup.sh\`: Standardize pnpm setup across workflows" >> deprecated_actions_report.md

# Move the report to the docs directory
mkdir -p docs/github
mv deprecated_actions_report.md docs/github/deprecated_actions_report.md

echo "Report generated at docs/github/deprecated_actions_report.md"
