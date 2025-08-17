#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "GCP_PROJECT_ID env var is required"; exit 1
fi

APIS=(
  bigquery.googleapis.com
  pubsub.googleapis.com
  storage.googleapis.com
  secretmanager.googleapis.com
  run.googleapis.com
  compute.googleapis.com
  iam.googleapis.com
  iamcredentials.googleapis.com
  cloudbuild.googleapis.com
  cloudresourcemanager.googleapis.com
  serviceusage.googleapis.com
  aiplatform.googleapis.com
  firestore.googleapis.com
  firebase.googleapis.com
  logging.googleapis.com
  monitoring.googleapis.com
)

echo "Enabling APIs for project: $GCP_PROJECT_ID"
for api in "${APIS[@]}"; do
  echo "→ $api"
  gcloud services enable "$api" --project "$GCP_PROJECT_ID"
done

echo "Done."
