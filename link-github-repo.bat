@echo off
echo Linking GitHub repository to Workload Identity Federation...
echo.

echo Running the critical linking command...
gcloud iam service-accounts add-iam-policy-binding github-actions@saigon-signals.iam.gserviceaccount.com --project="saigon-signals" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/871192566066/locations/global/workloadIdentityPools/github/attribute.repository/redrover13/signals"

echo.
echo ===================================
echo IMPORTANT: This is the most critical step!
echo If successful, wait 1-2 minutes then test at:
echo https://github.com/Redrover13/Signals/actions
echo ===================================
pause