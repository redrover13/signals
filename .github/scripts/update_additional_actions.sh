#!/bin/bash
# Script to pin additional GitHub Actions to commit SHAs

# Define the pinned commit SHAs for GitHub Actions
GOOGLE_AUTH_ACTION_SHA="55bd3a7c6e2ae7e6884bfe4c7bf685fe519a5a36" # v2.1.2
GOOGLE_SETUP_GCLOUD_SHA="e2ab1afc8b16a89a5bc7eac718364352c9ebb8d6" # v2.1.0
GITHUB_CODEQL_INIT_SHA="5b6282e9b4faa8c74e62906ca462e4fdffe9e1a2" # v3.25.6
GITHUB_CODEQL_ANALYZE_SHA="5b6282e9b4faa8b74e62906ca462e4fdffe9e1a2" # v3.25.6
GITHUB_CODEQL_UPLOAD_SARIF_SHA="5b6282e9b4faa8b74e62906ca462e4fdffe9e1a2" # v3.25.6
ACTIONS_GITHUB_SCRIPT_SHA="60a0d83039c74a4aee543508d9ffb3087d91ff2b" # v7.0.1
ACTIONS_UPLOAD_ARTIFACT_V3_SHA="65462800fd989acb0a041134ae4f56cd2c52d1a8" # v3.1.3
ACTIONS_UPLOAD_ARTIFACT_V4_SHA="0ad4c6ed3e171a3811d54af8513112f386372766" # v4.3.0
ACTIONS_DOWNLOAD_ARTIFACT_V4_SHA="694a571876d6598ad8b4a2365a1d88cd1a5c6473" # v4.0.0
DEPENDENCY_REVIEW_ACTION_SHA="c71570703c681fc3dd2093e217e015b1588dcc50" # v3.1.4
ACTIONS_STALE_SHA="28ca1036281a5e5922ead5184a1bbf96c5320453" # v9.0.0
DEPENDABOT_FETCH_METADATA_SHA="a4e8458f2ab22bb64eaf76c405ac512a8290428a" # v2
HASHICORP_SETUP_TERRAFORM_SHA="1132c5212dd6f3331b4d72c86604f49a5d53b2e8" # v3.0.0
PEACEIRIS_ACTIONS_GH_PAGES_SHA="bae45bd7c0cd6f338596808adca97f47cf91dfac" # v3.9.3
ACTIONS_CREATE_RELEASE_SHA="5b78d9bfd51970a06a83574aaea8d585d1fe8fd1" # v1.1.4
DOCKER_SETUP_BUILDX_ACTION_SHA="2b51285786e4a1181b7a0b3a6f50d8390f18b788" # v3.2.0
GITLEAKS_ACTION_SHA="c1d738a51fa598f273a26bed229b2ecd53177205" # v2.3.2
AMANNN_SEMANTIC_PR_SHA="c3dd2c1cb7502571eec2d79827d0449af3fded7b" # v5.4.0
GOOGLE_DEPLOY_CLOUDFUNCTIONS_SHA="e9c908f92a2374208c315607f51f2285c59ca4eb" # v2.1.2
GOOGLE_DEPLOY_CLOUDRUN_SHA="97a9e1c83a2a3d2476a25be6bd83aefa1ee8ade5" # v2.1.0
FOUNTAINHEAD_WAIT_FOR_CHECK_SHA="2b3d73762755cd85a72a8c8de76ca84df5bf7a6d" # v1.2.0
PNPM_ACTION_SETUP_SHA="b8c4212bc8178b24a6daf5e3da8ac9dd35e3bab9" # v4.0.2

# Function to update workflow files with additional pinned SHAs
update_additional_actions() {
  local file=$1
  echo "Updating additional actions in $file..."
  
  # Google GitHub Actions
  sed -i 's|uses: google-github-actions/auth@v2|uses: google-github-actions/auth@'"$GOOGLE_AUTH_ACTION_SHA"' # v2.1.2|g' "$file"
  sed -i 's|uses: google-github-actions/setup-gcloud@v2|uses: google-github-actions/setup-gcloud@'"$GOOGLE_SETUP_GCLOUD_SHA"' # v2.1.0|g' "$file"
  sed -i 's|uses: google-github-actions/deploy-cloudfunctions@v2|uses: google-github-actions/deploy-cloudfunctions@'"$GOOGLE_DEPLOY_CLOUDFUNCTIONS_SHA"' # v2.1.2|g' "$file"
  sed -i 's|uses: google-github-actions/deploy-cloudrun@v2|uses: google-github-actions/deploy-cloudrun@'"$GOOGLE_DEPLOY_CLOUDRUN_SHA"' # v2.1.0|g' "$file"
  
  # GitHub CodeQL Actions
  sed -i 's|uses: github/codeql-action/init@v3|uses: github/codeql-action/init@'"$GITHUB_CODEQL_INIT_SHA"' # v3.25.6|g' "$file"
  sed -i 's|uses: github/codeql-action/analyze@v3|uses: github/codeql-action/analyze@'"$GITHUB_CODEQL_ANALYZE_SHA"' # v3.25.6|g' "$file"
  sed -i 's|uses: github/codeql-action/upload-sarif@v3|uses: github/codeql-action/upload-sarif@'"$GITHUB_CODEQL_UPLOAD_SARIF_SHA"' # v3.25.6|g' "$file"
  
  # Other Common Actions
  sed -i 's|uses: actions/github-script@v7|uses: actions/github-script@'"$ACTIONS_GITHUB_SCRIPT_SHA"' # v7.0.1|g' "$file"
  sed -i 's|uses: actions/upload-artifact@v3|uses: actions/upload-artifact@'"$ACTIONS_UPLOAD_ARTIFACT_V3_SHA"' # v3.1.3|g' "$file"
  sed -i 's|uses: actions/upload-artifact@v4|uses: actions/upload-artifact@'"$ACTIONS_UPLOAD_ARTIFACT_V4_SHA"' # v4.3.0|g' "$file"
  sed -i 's|uses: actions/download-artifact@v4|uses: actions/download-artifact@'"$ACTIONS_DOWNLOAD_ARTIFACT_V4_SHA"' # v4.0.0|g' "$file"
  sed -i 's|uses: actions/dependency-review-action@v3|uses: actions/dependency-review-action@'"$DEPENDENCY_REVIEW_ACTION_SHA"' # v3.1.4|g' "$file"
  sed -i 's|uses: actions/stale@v9|uses: actions/stale@'"$ACTIONS_STALE_SHA"' # v9.0.0|g' "$file"
  sed -i 's|uses: dependabot/fetch-metadata@v2|uses: dependabot/fetch-metadata@'"$DEPENDABOT_FETCH_METADATA_SHA"' # v2|g' "$file"
  sed -i 's|uses: hashicorp/setup-terraform@v3|uses: hashicorp/setup-terraform@'"$HASHICORP_SETUP_TERRAFORM_SHA"' # v3.0.0|g' "$file"
  sed -i 's|uses: peaceiris/actions-gh-pages@v3|uses: peaceiris/actions-gh-pages@'"$PEACEIRIS_ACTIONS_GH_PAGES_SHA"' # v3.9.3|g' "$file"
  sed -i 's|uses: actions/create-release@v1|uses: actions/create-release@'"$ACTIONS_CREATE_RELEASE_SHA"' # v1.1.4|g' "$file"
  sed -i 's|uses: docker/setup-buildx-action@v3|uses: docker/setup-buildx-action@'"$DOCKER_SETUP_BUILDX_ACTION_SHA"' # v3.2.0|g' "$file"
  sed -i 's|uses: gitleaks/gitleaks-action@v2|uses: gitleaks/gitleaks-action@'"$GITLEAKS_ACTION_SHA"' # v2.3.2|g' "$file"
  sed -i 's|uses: amannn/action-semantic-pull-request@v5|uses: amannn/action-semantic-pull-request@'"$AMANNN_SEMANTIC_PR_SHA"' # v5.4.0|g' "$file"
  sed -i 's|uses: fountainhead/action-wait-for-check@v1|uses: fountainhead/action-wait-for-check@'"$FOUNTAINHEAD_WAIT_FOR_CHECK_SHA"' # v1.2.0|g' "$file"
  sed -i 's|uses: pnpm/action-setup@v4|uses: pnpm/action-setup@'"$PNPM_ACTION_SETUP_SHA"' # v4.0.2|g' "$file"
  
  echo "✅ Updated additional actions in $file"
}

# Update all workflow files
for file in .github/workflows/*.yml; do
  update_additional_actions "$file"
done

echo "All workflow files have been updated with pinned GitHub Actions!"
