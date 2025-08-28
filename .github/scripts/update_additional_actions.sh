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
DEPENDENCY_REVIEW_ACTION_SHA="c71570703c681fc3dd2093e217e015b1588dcc50" # v3.1.4
ACTIONS_STALE_SHA="28ca1036281a5e5922ead5184a1bbf96c5320453" # v9.0.0
DEPENDABOT_FETCH_METADATA_SHA="a4e8458f2ab22bb64eaf76c405ac512a8290428a" # v2
HASHICORP_SETUP_TERRAFORM_SHA="1132c5212dd6f3331b4d72c86604f49a5d53b2e8" # v3.0.0
PEACEIRIS_ACTIONS_GH_PAGES_SHA="bae45bd7c0cd6f338596808adca97f47cf91dfac" # v3.9.3

# Function to update workflow files with additional pinned SHAs
update_additional_actions() {
  local file=$1
  echo "Updating additional actions in $file..."
  
  # Google GitHub Actions
  sed -i 's|uses: google-github-actions/auth@v2|uses: google-github-actions/auth@'"$GOOGLE_AUTH_ACTION_SHA"' # v2.1.2|g' "$file"
  sed -i 's|uses: google-github-actions/setup-gcloud@v2|uses: google-github-actions/setup-gcloud@'"$GOOGLE_SETUP_GCLOUD_SHA"' # v2.1.0|g' "$file"
  
  # GitHub CodeQL Actions
  sed -i 's|uses: github/codeql-action/init@v3|uses: github/codeql-action/init@'"$GITHUB_CODEQL_INIT_SHA"' # v3.25.6|g' "$file"
  sed -i 's|uses: github/codeql-action/analyze@v3|uses: github/codeql-action/analyze@'"$GITHUB_CODEQL_ANALYZE_SHA"' # v3.25.6|g' "$file"
  sed -i 's|uses: github/codeql-action/upload-sarif@v3|uses: github/codeql-action/upload-sarif@'"$GITHUB_CODEQL_UPLOAD_SARIF_SHA"' # v3.25.6|g' "$file"
  
  # Other Common Actions
  sed -i 's|uses: actions/github-script@v7|uses: actions/github-script@'"$ACTIONS_GITHUB_SCRIPT_SHA"' # v7.0.1|g' "$file"
  sed -i 's|uses: actions/upload-artifact@v3|uses: actions/upload-artifact@'"$ACTIONS_UPLOAD_ARTIFACT_V3_SHA"' # v3.1.3|g' "$file"
  sed -i 's|uses: actions/upload-artifact@v4|uses: actions/upload-artifact@'"$ACTIONS_UPLOAD_ARTIFACT_V4_SHA"' # v4.3.0|g' "$file"
  sed -i 's|uses: actions/dependency-review-action@v3|uses: actions/dependency-review-action@'"$DEPENDENCY_REVIEW_ACTION_SHA"' # v3.1.4|g' "$file"
  sed -i 's|uses: actions/stale@v9|uses: actions/stale@'"$ACTIONS_STALE_SHA"' # v9.0.0|g' "$file"
  sed -i 's|uses: dependabot/fetch-metadata@v2|uses: dependabot/fetch-metadata@'"$DEPENDABOT_FETCH_METADATA_SHA"' # v2|g' "$file"
  sed -i 's|uses: hashicorp/setup-terraform@v3|uses: hashicorp/setup-terraform@'"$HASHICORP_SETUP_TERRAFORM_SHA"' # v3.0.0|g' "$file"
  sed -i 's|uses: peaceiris/actions-gh-pages@v3|uses: peaceiris/actions-gh-pages@'"$PEACEIRIS_ACTIONS_GH_PAGES_SHA"' # v3.9.3|g' "$file"
  
  echo "✅ Updated additional actions in $file"
}

# Update all workflow files
for file in .github/workflows/*.yml; do
  update_additional_actions "$file"
done

echo "All workflow files have been updated with pinned GitHub Actions!"
