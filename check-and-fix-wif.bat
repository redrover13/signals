@echo off
echo Checking and fixing WIF setup...
echo.

echo Step 1: Checking if pool exists...
gcloud iam workload-identity-pools describe "github" --project="saigon-signals" --location="global" >nul 2>&1
if %errorlevel% neq 0 (
    echo Pool doesn't exist, creating...
    gcloud iam workload-identity-pools create "github" --project="saigon-signals" --location="global" --display-name="GitHub Actions Pool"
) else (
    echo Pool exists!
)
echo.

echo Step 2: Checking if provider exists...
gcloud iam workload-identity-pools providers describe "github" --project="saigon-signals" --location="global" --workload-identity-pool="github" >nul 2>&1
if %errorlevel% neq 0 (
    echo Provider doesn't exist, creating...
    gcloud iam workload-identity-pools providers create-oidc "github" --project="saigon-signals" --location="global" --workload-identity-pool="github" --display-name="GitHub Provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" --issuer-uri="https://token.actions.githubusercontent.com"
) else (
    echo Provider exists!
)
echo.

echo Step 3: Verifying service account exists...
gcloud iam service-accounts describe github-actions@saigon-signals.iam.gserviceaccount.com --project="saigon-signals" >nul 2>&1
if %errorlevel% neq 0 (
    echo Service account doesn't exist, creating...
    gcloud iam service-accounts create github-actions --project="saigon-signals" --display-name="GitHub Actions Service Account"
) else (
    echo Service account exists!
)
echo.

echo Step 4: Getting current provider configuration...
echo.
gcloud iam workload-identity-pools providers describe "github" --project="saigon-signals" --location="global" --workload-identity-pool="github"
echo.

echo ===================================
echo Setup check complete!
echo Please share any errors above.
echo ===================================
pause