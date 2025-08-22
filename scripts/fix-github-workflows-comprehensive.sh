#!/bin/bash

# Fix monitoring workflow with all the needed changes
WORKFLOW_FILE="/home/g_nelson/signals-1/.github/workflows/monitoring.yml"

# 1. Fix the steps referencing variable
sed -i 's/${steps.cloud-run.outputs.failed_services}/${process.env.FAILED_CLOUD_RUN}/g' "$WORKFLOW_FILE"
sed -i 's/${steps.cloud-functions.outputs.failed_functions}/${process.env.FAILED_CLOUD_FUNCTIONS}/g' "$WORKFLOW_FILE"

# 2. Fix the auth issues (manually for each occurrence)
sed -i '/service_account: \${{ secrets.WIF_SERVICE_ACCOUNT }}/a\          create_credentials_file: true\n          cleanup_credentials: true' "$WORKFLOW_FILE"

# 3. Add checkout steps for every job
for LINE_NUM in $(grep -n "steps:" "$WORKFLOW_FILE" | cut -d: -f1); do
  # Only add if not already present
  NEXT_LINE=$((LINE_NUM + 1))
  if ! grep -A1 "steps:" "$WORKFLOW_FILE" | grep -q "Checkout code"; then
    sed -i "${NEXT_LINE}i\\      - name: Checkout code\\n        uses: actions/checkout@v4" "$WORKFLOW_FILE"
  fi
done

echo "Comprehensive fixes applied to monitoring workflow"
