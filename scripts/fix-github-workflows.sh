#!/bin/bash

# Update monitoring workflow with fixes
WORKFLOW_FILE=".github/workflows/monitoring.yml"

# Make a backup of the original file
cp "$WORKFLOW_FILE" "${WORKFLOW_FILE}.bak"

# Add checkout steps where missing
sed -i '60i\      - name: Checkout code\n        uses: actions/checkout@v4' "$WORKFLOW_FILE"
sed -i '221i\      - name: Checkout code\n        uses: actions/checkout@v4' "$WORKFLOW_FILE"
sed -i '336i\      - name: Checkout code\n        uses: actions/checkout@v4' "$WORKFLOW_FILE"
sed -i '456i\      - name: Checkout code\n        uses: actions/checkout@v4' "$WORKFLOW_FILE"

# Update authentication steps with create_credentials_file
sed -i 's/workload_identity_provider: \${{ secrets.WIF_PROVIDER }}\n          service_account: \${{ secrets.WIF_SERVICE_ACCOUNT }}/workload_identity_provider: \${{ secrets.WIF_PROVIDER }}\n          service_account: \${{ secrets.WIF_SERVICE_ACCOUNT }}\n          create_credentials_file: true\n          cleanup_credentials: true/g' "$WORKFLOW_FILE"

echo "Monitoring workflow updated with fixes"
