# Quick WIF Setup Guide for saigon-signals

## Step 1: Run Setup Script in Cloud Shell

Open Google Cloud Shell and run:

```bash
# Download the setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/scripts/setup-wif-github.sh

# Make it executable
chmod +x setup-wif-github.sh

# Edit to add your GitHub details
nano setup-wif-github.sh
# Change line 9: GITHUB_ORG="YOUR_GITHUB_ORG"
# Change line 10: GITHUB_REPO="YOUR_REPO_NAME"

# Run the script
./setup-wif-github.sh
```

## Step 2: Complete Repository Binding

After the script runs, you'll see a command. Run it with your actual GitHub details:

```bash
# Replace YOUR_GITHUB_ORG and YOUR_REPO with your actual values
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@saigon-signals.iam.gserviceaccount.com \
  --project="saigon-signals" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO"
```

## Step 3: Get Values for GitHub Secrets

The script will output values like:

```
GCP_PROJECT_ID: saigon-signals
WIF_PROVIDER: projects/123456789/locations/global/workloadIdentityPools/github/providers/github
WIF_SERVICE_ACCOUNT: github-actions@saigon-signals.iam.gserviceaccount.com
```

## Step 4: Add to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:
   - Name: `GCP_PROJECT_ID`, Value: `saigon-signals`
   - Name: `WIF_PROVIDER`, Value: (the full path from step 3)
   - Name: `WIF_SERVICE_ACCOUNT`, Value: `github-actions@saigon-signals.iam.gserviceaccount.com`

## Step 5: Update Secrets in Secret Manager

In your Google Cloud Console with Secret Manager open:

1. Click on `dulce-db-url` secret
2. Add new version with your actual database URL:

   ```
   postgresql://user:password@/dulce?host=/cloudsql/saigon-signals:asia-southeast1:dulce-db
   ```

3. Click on `agents-api-key` secret
4. Add new version with your actual API key

## Step 6: Test the Setup

1. Commit and push the test workflow:

   ```bash
   git add .github/workflows/test-wif.yml
   git commit -m "test: Add WIF authentication test"
   git push
   ```

2. Go to GitHub Actions tab
3. Find "Test WIF Authentication" workflow
4. Click "Run workflow"
5. Check the logs - you should see successful authentication!

## Troubleshooting

### If authentication fails:

1. Check the repository path matches exactly in the IAM binding
2. Ensure the workflow has `id-token: write` permission
3. Verify all three secrets are set correctly in GitHub

### Quick verification in Cloud Shell:

```bash
# Check workload identity pool
gcloud iam workload-identity-pools describe github --location=global

# Check service account
gcloud iam service-accounts get-iam-policy github-actions@saigon-signals.iam.gserviceaccount.com

# List all bindings
gcloud projects get-iam-policy saigon-signals \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@"
```

## Security Notes

- ✅ No service account keys are stored
- ✅ Tokens expire after 1 hour
- ✅ Access limited to specific repository
- ✅ Minimal permissions granted
- ✅ Separate service accounts for each app

Your CI/CD pipeline is now secure and ready to deploy to Google Cloud! 🚀
