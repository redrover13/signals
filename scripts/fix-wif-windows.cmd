@echo off
REM === WIF Setup Script for Windows CMD ===
REM This script will debug, skip, or fix each step as needed.

setlocal enabledelayedexpansion

REM Set variables
set PROJECT_ID=saigon-signals
set POOL=github
set PROVIDER=github
set LOCATION=global
set SA=github-actions@saigon-signals.iam.gserviceaccount.com
set REPO=redrover13/signals
set PROJECT_NUMBER=

REM Get project number
echo Getting project number for %PROJECT_ID% ...
for /f "delims=" %%i in ('gcloud projects describe %PROJECT_ID% --format="value(projectNumber)"') do set PROJECT_NUMBER=%%i
if "%PROJECT_NUMBER%"=="" (
  echo ERROR: Could not get project number. Exiting.
  exit /b 1
)
echo Project number: %PROJECT_NUMBER%

REM 1. Create WIF pool if not exists
echo Checking if pool exists...
gcloud iam workload-identity-pools describe %POOL% --project=%PROJECT_ID% --location=%LOCATION% >nul 2>&1
if %errorlevel%==0 (
  echo Pool %POOL% already exists. Skipping.
) else (
  echo Creating pool %POOL% ...
  gcloud iam workload-identity-pools create %POOL% --project=%PROJECT_ID% --location=%LOCATION% --display-name="GitHub Actions Pool"
)

REM 2. Create OIDC provider if not exists
echo Checking if provider exists...
gcloud iam workload-identity-pools providers describe %PROVIDER% --project=%PROJECT_ID% --location=%LOCATION% --workload-identity-pool=%POOL% >nul 2>&1
if %errorlevel%==0 (
  echo Provider %PROVIDER% already exists. Skipping.
) else (
  echo Creating provider %PROVIDER% ...
  gcloud iam workload-identity-pools providers create-oidc %PROVIDER% --project=%PROJECT_ID% --location=%LOCATION% --workload-identity-pool=%POOL% --display-name="GitHub Provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" --issuer-uri="https://token.actions.githubusercontent.com"
)

REM 3. Remove incorrect (mixed-case) binding if present
echo Checking for incorrect (mixed-case) binding...
gcloud iam service-accounts get-iam-policy %SA% --project=%PROJECT_ID% --format=json | findstr /i "Redrover13/Signals" >nul
if %errorlevel%==0 (
  echo Removing incorrect binding...
  gcloud iam service-accounts remove-iam-policy-binding %SA% --project=%PROJECT_ID% --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/%PROJECT_NUMBER%/locations/global/workloadIdentityPools/%POOL%/attribute.repository/Redrover13/Signals"
) else (
  echo No incorrect binding found. Skipping.
)

REM 4. Add correct (lowercase) binding if not present
echo Checking for correct (lowercase) binding...
gcloud iam service-accounts get-iam-policy %SA% --project=%PROJECT_ID% --format=json | findstr /i "%REPO%" >nul
if %errorlevel%==0 (
  echo Correct binding already exists. Skipping.
) else (
  echo Adding correct binding...
  gcloud iam service-accounts add-iam-policy-binding %SA% --project=%PROJECT_ID% --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/%PROJECT_NUMBER%/locations/global/workloadIdentityPools/%POOL%/attribute.repository/%REPO%"
)

echo WIF setup complete.
endlocal
