@echo off
echo Creating OIDC Provider for GitHub...
echo.

gcloud iam workload-identity-pools providers create-oidc "github" --project="saigon-signals" --location="global" --workload-identity-pool="github" --display-name="GitHub Provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" --issuer-uri="https://token.actions.githubusercontent.com"

echo.
echo Provider creation complete!
echo.
echo Now let's check if it was created successfully:
echo.

gcloud iam workload-identity-pools providers describe "github" --project="saigon-signals" --location="global" --workload-identity-pool="github"

echo.
echo ===================================
echo If successful, wait 2-3 minutes then test at:
echo https://github.com/Redrover13/Signals/actions
echo ===================================
pause