#!/usr/bin/env bash
# Deploy genai-toolbox to Cloud Run using Workload Identity Federation (WIF)
# Usage: ./scripts/deploy-toolbox.sh [project-id] [region] [tag]
# Example: ./scripts/deploy-toolbox.sh my-project us-central1 v1

set -euo pipefail

PROJECT_ID=${1:-${GCP_PROJECT_ID:-}}
REGION=${2:-${GCP_REGION:-us-central1}}
TAG=${3:-"local-$(date +%s)"}

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: GCP project id required as first arg or in GCP_PROJECT_ID env var"
  exit 2
fi

echo "Deploying genai-toolbox to project=$PROJECT_ID region=$REGION tag=$TAG"

# 1) Clone or update the toolbox source (uses github mirror if not present)
REPO_DIR="/tmp/genai-toolbox"
if [ -d "$REPO_DIR" ]; then
  echo "Updating existing repo at $REPO_DIR"
  git -C "$REPO_DIR" pull --ff-only || true
else
  git clone https://github.com/googleapis/genai-toolbox.git "$REPO_DIR"
fi

cd "$REPO_DIR"

# 2) Build and push the container image to Artifact Registry / Container Registry
IMAGE="gcr.io/${PROJECT_ID}/genai-toolbox:${TAG}"

echo "Building container image: $IMAGE"
# Use Cloud Build to build and push the image so credentials are handled by gcloud (WIF in CI).
gcloud config set project "$PROJECT_ID"
gcloud builds submit --tag "$IMAGE"

# 3) Deploy to Cloud Run
SERVICE_NAME="genai-toolbox"
echo "Deploying Cloud Run service $SERVICE_NAME"
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --no-allow-unauthenticated \
  --set-env-vars "WIF_PROVIDER=${WIF_PROVIDER:-},WIF_SERVICE_ACCOUNT=${WIF_SERVICE_ACCOUNT:-},GCP_PROJECT_ID=${PROJECT_ID}"

# 4) Grant Cloud Run invoker role to the WIF service account if needed
echo "Granting run.invoker to ${WIF_SERVICE_ACCOUNT:-}":
if [ -n "${WIF_SERVICE_ACCOUNT:-}" ]; then
  gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
    --region "$REGION" \
    --member "serviceAccount:${WIF_SERVICE_ACCOUNT}" \
    --role roles/run.invoker || true
fi

echo "Deployment complete. Check Cloud Run console or run: gcloud run services describe $SERVICE_NAME --region $REGION"
