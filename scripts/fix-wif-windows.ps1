# WIF Setup Script for PowerShell
# This script debugs, skips, or fixes each step as needed.

$ProjectId = "saigon-signals"
$Pool = "github"
$Provider = "github"
$Location = "global"
$ServiceAccount = "github-actions@saigon-signals.iam.gserviceaccount.com"
$Repo = "redrover13/signals"

# Get project number
Write-Host "Getting project number for $ProjectId ..."
$ProjectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
if (-not $ProjectNumber) {
    Write-Host "ERROR: Could not get project number. Exiting."
    exit 1
}
Write-Host "Project number: $ProjectNumber"

# 1. Create WIF pool if not exists
Write-Host "Checking if pool exists..."
$poolExists = gcloud iam workload-identity-pools describe $Pool --project=$ProjectId --location=$Location 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Pool $Pool already exists. Skipping."
} else {
    Write-Host "Creating pool $Pool ..."
    gcloud iam workload-identity-pools create $Pool --project=$ProjectId --location=$Location --display-name="GitHub Actions Pool"
}

# 2. Create OIDC provider if not exists
Write-Host "Checking if provider exists..."
$providerExists = gcloud iam workload-identity-pools providers describe $Provider --project=$ProjectId --location=$Location --workload-identity-pool=$Pool 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Provider $Provider already exists. Skipping."
} else {
    Write-Host "Creating provider $Provider ..."
    gcloud iam workload-identity-pools providers create-oidc $Provider --project=$ProjectId --location=$Location --workload-identity-pool=$Pool --display-name="GitHub Provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" --issuer-uri="https://token.actions.githubusercontent.com"
}

# 3. Remove incorrect (mixed-case) binding if present
Write-Host "Checking for incorrect (mixed-case) binding..."
$incorrectBinding = gcloud iam service-accounts get-iam-policy $ServiceAccount --project=$ProjectId --format=json | Select-String "Redrover13/Signals"
if ($incorrectBinding) {
    Write-Host "Removing incorrect binding..."
    gcloud iam service-accounts remove-iam-policy-binding $ServiceAccount --project=$ProjectId --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/$ProjectNumber/locations/global/workloadIdentityPools/$Pool/attribute.repository/Redrover13/Signals"
} else {
    Write-Host "No incorrect binding found. Skipping."
}

# 4. Add correct (lowercase) binding if not present
Write-Host "Checking for correct (lowercase) binding..."
$correctBinding = gcloud iam service-accounts get-iam-policy $ServiceAccount --project=$ProjectId --format=json | Select-String $Repo
if ($correctBinding) {
    Write-Host "Correct binding already exists. Skipping."
} else {
    Write-Host "Adding correct binding..."
    gcloud iam service-accounts add-iam-policy-binding $ServiceAccount --project=$ProjectId --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/$ProjectNumber/locations/global/workloadIdentityPools/$Pool/attribute.repository/$Repo"
}

Write-Host "WIF setup complete."
