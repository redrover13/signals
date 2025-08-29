#!/bin/bash
# Script to track which workflows have been updated

# Make sure the docs directory exists
mkdir -p docs/github

REPORT_FILE="docs/github/workflow_update_report.md"

# Create a header for the report
echo "# GitHub Workflow Update Report" > $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "## Workflows Updated" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "| Workflow File | Actions Pinned | PNPM Standardized |" >> $REPORT_FILE
echo "| ------------- | -------------- | ----------------- |" >> $REPORT_FILE

# Check each workflow file
for file in .github/workflows/*.yml; do
  filename=$(basename "$file")
  
  # Check if actions are pinned (using commit hashes)
  if grep -q "@[a-f0-9]\{40\}" "$file"; then
    actions_pinned="✅"
  else
    actions_pinned="❌"
  fi
  
  # Check if pnpm setup is standardized
  if grep -q "STORE_PATH:" "$file" && grep -q "pnpm-store-" "$file"; then
    pnpm_standardized="✅"
  else
    pnpm_standardized="❌"
  fi
  
  # Add to report
  echo "| $filename | $actions_pinned | $pnpm_standardized |" >> $REPORT_FILE
done

echo "" >> $REPORT_FILE
echo "## Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Count workflows that need attention
total_workflows=$(find .github/workflows -name "*.yml" | wc -l)
pinned_workflows=$(grep -l "@[a-f0-9]\{40\}" .github/workflows/*.yml | wc -l)
standardized_workflows=$(grep -l "STORE_PATH:" .github/workflows/*.yml | wc -l)

echo "- Total workflows: $total_workflows" >> $REPORT_FILE
echo "- Workflows with pinned actions: $pinned_workflows" >> $REPORT_FILE
echo "- Workflows with standardized pnpm setup: $standardized_workflows" >> $REPORT_FILE
echo "- Workflows needing action pinning: $((total_workflows - pinned_workflows))" >> $REPORT_FILE
echo "- Workflows needing pnpm standardization: $((total_workflows - standardized_workflows))" >> $REPORT_FILE

echo "## Scripts Used" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "For future reference, the following scripts were created to help maintain GitHub workflow consistency:" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "1. [Update GitHub Actions with Pinned SHAs](../../.github/scripts/update_additional_actions.sh) - Pins GitHub Actions to specific commit SHAs for security and stability." >> $REPORT_FILE
echo "2. [Standardize PNPM Setup](../../.github/scripts/standardize_pnpm_setup.sh) - Ensures consistent PNPM caching and installation across workflows." >> $REPORT_FILE
echo "3. [Track Workflow Updates](../../.github/scripts/track_workflow_updates.sh) - Generates this report to track which workflows need updates." >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "## Best Practices" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "- Always pin GitHub Actions to specific commit SHAs rather than version tags." >> $REPORT_FILE
echo "- Use consistent caching strategies for package managers across all workflows." >> $REPORT_FILE
echo "- Ensure all workflows follow the same patterns for common tasks like dependency installation." >> $REPORT_FILE

echo "Report generated at $REPORT_FILE"
