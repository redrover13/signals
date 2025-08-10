@echo off
echo Setting up Workload Identity Federation for saigon-signals...
echo.

echo Step 1: Creating Workload Identity Pool...
gcloud iam workload-identity-pools create "github" --project="saigon-signals" --location="global" --display-name="GitHub Actions Pool"
if %errorlevel% neq 0 echo Pool might already exist, continuing...
echo.

echo Step 2: Creating OIDC Provider...
gcloud iam workload-identity-pools providers create-oidc "github" --project="saigon-signals" --location="global" --workload-identity-pool="github" --display-name="GitHub Provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" --issuer-uri="https://token.actions.githubusercontent.com"
if %errorlevel% neq 0 echo Provider might already exist, continuing...
echo.

echo Step 3: Creating Service Account...
gcloud iam service-accounts create github-actions --project="saigon-signals" --display-name="GitHub Actions Service Account"
if %errorlevel% neq 0 echo Service account might already exist, continuing...
echo.

echo Step 4: Granting Artifact Registry permissions...
gcloud projects add-iam-policy-binding saigon-signals --member="serviceAccount:github-actions@saigon-signals.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
echo.

echo Step 5: Granting Cloud Run permissions...
gcloud projects add-iam-policy-binding saigon-signals --member="serviceAccount:github-actions@saigon-signals.iam.gserviceaccount.com" --role="roles/run.developer"
echo.

echo Step 6: Linking GitHub repository (MOST IMPORTANT)...
gcloud iam service-accounts add-iam-policy-binding github-actions@saigon-signals.iam.gserviceaccount.com --project="saigon-signals" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/871192566066/locations/global/workloadIdentityPools/github/attribute.repository/redrover13/signals"
echo.

echo ===================================
echo Setup complete!
echo.
echo Please wait 1-2 minutes for changes to propagate, then test at:
echo https://github.com/Redrover13/Signals/actions
echo ===================================
pause