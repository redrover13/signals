@echo off
echo Creating OIDC Provider for GitHub with fixed attributes...
echo.

gcloud iam workload-identity-pools providers create-oidc "github" ^
  --project="saigon-signals" ^
  --location="global" ^
  --workload-identity-pool="github" ^
  --display-name="GitHub Provider" ^
  --issuer-uri="https://token.actions.githubusercontent.com" ^
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" ^
  --attribute-condition="assertion.repository_owner=='redrover13'"

echo.
echo Provider creation complete!
echo.
echo Now verifying the provider was created:
echo.

gcloud iam workload-identity-pools providers describe "github" ^
  --project="saigon-signals" ^
  --location="global" ^
  --workload-identity-pool="github"

echo.
echo ===================================
echo Wait 2-3 minutes then test at:
echo https://github.com/Redrover13/Signals/actions
echo ===================================
pause