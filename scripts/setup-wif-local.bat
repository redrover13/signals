@echo off
REM Setup WIF for GitHub Actions - Windows Local Google Cloud SDK
REM Run this from your local terminal with gcloud authenticated

echo Setting up Workload Identity Federation for saigon-signals...

REM Configuration - UPDATE THESE VALUES
set PROJECT_ID=saigon-signals
set GITHUB_ORG=YOUR_GITHUB_ORG
set GITHUB_REPO=YOUR_REPO_NAME
set REGION=asia-southeast1

REM Set project
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo Enabling required APIs...
gcloud services enable iamcredentials.googleapis.com cloudresourcemanager.googleapis.com sts.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

REM Create Workload Identity Pool
echo Creating Workload Identity Pool...
gcloud iam workload-identity-pools create "github" --project="%PROJECT_ID%" --location="global" --display-name="GitHub Actions Pool"

REM Create OIDC Provider
echo Creating OIDC Provider...
gcloud iam workload-identity-pools providers create-oidc "github" --project="%PROJECT_ID%" --location="global" --workload-identity-pool="github" --display-name="GitHub provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" --issuer-uri="https://token.actions.githubusercontent.com"

REM Create service accounts
echo Creating service accounts...
gcloud iam service-accounts create github-actions --project="%PROJECT_ID%" --display-name="GitHub Actions Service Account"
gcloud iam service-accounts create dulce-api-sa --project="%PROJECT_ID%" --display-name="Dulce API Service Account"
gcloud iam service-accounts create dulce-web-sa --project="%PROJECT_ID%" --display-name="Dulce Web Service Account"
gcloud iam service-accounts create dulce-agents-sa --project="%PROJECT_ID%" --display-name="Dulce Agents Service Account"

REM Grant permissions
echo Granting permissions...
gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:github-actions@%PROJECT_ID%.iam.gserviceaccount.com" --role="roles/run.developer"
gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:github-actions@%PROJECT_ID%.iam.gserviceaccount.com" --role="roles/storage.admin"
gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:github-actions@%PROJECT_ID%.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:github-actions@%PROJECT_ID%.iam.gserviceaccount.com" --role="roles/cloudbuild.builds.editor"
gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:github-actions@%PROJECT_ID%.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"

REM Get project number
for /f "tokens=*" %%i in ('gcloud projects describe %PROJECT_ID% --format="value(projectNumber)"') do set PROJECT_NUMBER=%%i

echo.
echo ========================================
echo IMPORTANT: Save these values for GitHub Secrets:
echo.
echo GCP_PROJECT_ID: %PROJECT_ID%
echo WIF_PROVIDER: projects/%PROJECT_NUMBER%/locations/global/workloadIdentityPools/github/providers/github
echo WIF_SERVICE_ACCOUNT: github-actions@%PROJECT_ID%.iam.gserviceaccount.com
echo.
echo ========================================
echo.
echo Now run this command with your GitHub details:
echo.
echo gcloud iam service-accounts add-iam-policy-binding github-actions@%PROJECT_ID%.iam.gserviceaccount.com --project="%PROJECT_ID%" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/%PROJECT_NUMBER%/locations/global/workloadIdentityPools/github/attribute.repository/%GITHUB_ORG%/%GITHUB_REPO%"
echo.
pause