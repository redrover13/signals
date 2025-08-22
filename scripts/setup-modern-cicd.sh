#!/bin/bash

# Modern CI/CD Pipeline Setup Script
# This script sets up the complete CI/CD pipeline for the Dulce de Saigon platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${PROJECT_ID:-saigon-signals}"
REGION="${REGION:-asia-southeast1}"
GITHUB_ORG="${GITHUB_ORG:-}"
GITHUB_REPO="${GITHUB_REPO:-signals}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gcloud is installed and authenticated
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Not authenticated with gcloud. Please run 'gcloud auth login'"
        exit 1
    fi
    
    # Check if project exists
    if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        log_error "Project $PROJECT_ID does not exist or you don't have access"
        exit 1
    fi
    
    # Set project
    gcloud config set project "$PROJECT_ID"
    
    log_success "Prerequisites check passed"
}

enable_apis() {
    log_info "Enabling required Google Cloud APIs..."
    
    local apis=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "cloudfunctions.googleapis.com"
        "artifactregistry.googleapis.com"
        "secretmanager.googleapis.com"
        "bigquery.googleapis.com"
        "storage.googleapis.com"
        "iam.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        log_info "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID"
    done
    
    log_success "All APIs enabled"
}

setup_artifact_registry() {
    log_info "Setting up Artifact Registry..."
    
    # Create repository if it doesn't exist
    if ! gcloud artifacts repositories describe dulce \
        --location="$REGION" \
        --project="$PROJECT_ID" &> /dev/null; then
        
        log_info "Creating Artifact Registry repository..."
        gcloud artifacts repositories create dulce \
            --repository-format=docker \
            --location="$REGION" \
            --description="Container images for Dulce de Saigon platform" \
            --project="$PROJECT_ID"
    else
        log_info "Artifact Registry repository already exists"
    fi
    
    log_success "Artifact Registry setup complete"
}

setup_service_accounts() {
    log_info "Setting up service accounts..."
    
    local service_accounts=(
        "github-actions:GitHub Actions CI/CD"
        "dulce-api-sa:Dulce API Service Account"
        "agent-runner-sa:Agent Runner Service Account"
        "event-parser-sa:Event Parser Service Account"
    )
    
    for sa_info in "${service_accounts[@]}"; do
        IFS=':' read -r sa_name sa_description <<< "$sa_info"
        
        if ! gcloud iam service-accounts describe "${sa_name}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --project="$PROJECT_ID" &> /dev/null; then
            
            log_info "Creating service account: $sa_name"
            gcloud iam service-accounts create "$sa_name" \
                --display-name="$sa_description" \
                --description="$sa_description" \
                --project="$PROJECT_ID"
        else
            log_info "Service account $sa_name already exists"
        fi
    done
    
    log_success "Service accounts setup complete"
}

setup_iam_permissions() {
    log_info "Setting up IAM permissions..."
    
    # GitHub Actions service account permissions
    local github_roles=(
        "roles/cloudbuild.builds.editor"
        "roles/run.admin"
        "roles/cloudfunctions.admin"
        "roles/artifactregistry.admin"
        "roles/secretmanager.secretAccessor"
        "roles/storage.admin"
        "roles/bigquery.admin"
        "roles/monitoring.viewer"
        "roles/logging.viewer"
    )
    
    for role in "${github_roles[@]}"; do
        log_info "Granting $role to github-actions service account"
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="$role" \
            --quiet
    done
    
    # API service account permissions
    local api_roles=(
        "roles/bigquery.dataEditor"
        "roles/secretmanager.secretAccessor"
        "roles/storage.objectAdmin"
        "roles/pubsub.publisher"
    )
    
    for role in "${api_roles[@]}"; do
        log_info "Granting $role to dulce-api-sa service account"
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:dulce-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="$role" \
            --quiet
    done
    
    # Agent Runner service account permissions
    local agent_roles=(
        "roles/bigquery.dataEditor"
        "roles/secretmanager.secretAccessor"
        "roles/pubsub.subscriber"
        "roles/storage.objectAdmin"
    )
    
    for role in "${agent_roles[@]}"; do
        log_info "Granting $role to agent-runner-sa service account"
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:agent-runner-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="$role" \
            --quiet
    done
    
    log_success "IAM permissions setup complete"
}

setup_workload_identity_federation() {
    log_info "Setting up Workload Identity Federation..."
    
    # Create workload identity pool
    if ! gcloud iam workload-identity-pools describe github \
        --location=global \
        --project="$PROJECT_ID" &> /dev/null; then
        
        log_info "Creating workload identity pool..."
        gcloud iam workload-identity-pools create github \
            --location=global \
            --display-name="GitHub Actions Pool" \
            --description="Workload Identity Pool for GitHub Actions" \
            --project="$PROJECT_ID"
    else
        log_info "Workload identity pool already exists"
    fi
    
    # Create workload identity provider
    if ! gcloud iam workload-identity-pools providers describe github \
        --workload-identity-pool=github \
        --location=global \
        --project="$PROJECT_ID" &> /dev/null; then
        
        log_info "Creating workload identity provider..."
        gcloud iam workload-identity-pools providers create-oidc github \
            --workload-identity-pool=github \
            --location=global \
            --issuer-uri="https://token.actions.githubusercontent.com" \
            --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
            --project="$PROJECT_ID"
    else
        log_info "Workload identity provider already exists"
    fi
    
    # Get project number
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
    
    # Bind service account to workload identity
    if [ -n "$GITHUB_ORG" ] && [ -n "$GITHUB_REPO" ]; then
        log_info "Binding service account to workload identity..."
        gcloud iam service-accounts add-iam-policy-binding \
            "github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
            --project="$PROJECT_ID" \
            --role="roles/iam.workloadIdentityUser" \
            --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}"
    else
        log_warning "GITHUB_ORG and GITHUB_REPO not set. You'll need to bind the service account manually."
    fi
    
    log_success "Workload Identity Federation setup complete"
}

setup_secrets() {
    log_info "Setting up Secret Manager secrets..."
    
    local secrets=(
        "dulce-db-url:Database connection URL"
        "agents-api-key:API key for agents"
        "jwt-secret:JWT signing secret"
        "encryption-key:Data encryption key"
    )
    
    for secret_info in "${secrets[@]}"; do
        IFS=':' read -r secret_name secret_description <<< "$secret_info"
        
        if ! gcloud secrets describe "$secret_name" \
            --project="$PROJECT_ID" &> /dev/null; then
            
            log_info "Creating secret: $secret_name"
            gcloud secrets create "$secret_name" \
                --replication-policy="automatic" \
                --project="$PROJECT_ID"
            
            # Add placeholder version
            echo "PLACEHOLDER_VALUE_CHANGE_ME" | gcloud secrets versions add "$secret_name" \
                --data-file=- \
                --project="$PROJECT_ID"
        else
            log_info "Secret $secret_name already exists"
        fi
    done
    
    log_success "Secret Manager setup complete"
}

setup_bigquery() {
    log_info "Setting up BigQuery datasets..."
    
    # Create main dataset
    if ! bq show --dataset "${PROJECT_ID}:dulce" &> /dev/null; then
        log_info "Creating BigQuery dataset: dulce"
        bq mk --dataset \
            --location="$REGION" \
            --description="Primary dataset for Dulce de Saigon platform" \
            "${PROJECT_ID}:dulce"
    else
        log_info "BigQuery dataset already exists"
    fi
    
    log_success "BigQuery setup complete"
}

setup_pubsub() {
    log_info "Setting up Pub/Sub topics..."
    
    local topics=(
        "dulce.agents:Agent execution events"
        "dulce.notifications:System notifications"
    )
    
    for topic_info in "${topics[@]}"; do
        IFS=':' read -r topic_name topic_description <<< "$topic_info"
        
        if ! gcloud pubsub topics describe "$topic_name" \
            --project="$PROJECT_ID" &> /dev/null; then
            
            log_info "Creating Pub/Sub topic: $topic_name"
            gcloud pubsub topics create "$topic_name" \
                --project="$PROJECT_ID"
        else
            log_info "Pub/Sub topic $topic_name already exists"
        fi
    done
    
    log_success "Pub/Sub setup complete"
}

setup_storage() {
    log_info "Setting up Cloud Storage buckets..."
    
    local buckets=(
        "${PROJECT_ID}-build-artifacts:Build artifacts storage"
        "${PROJECT_ID}-data-exports:Data export storage"
        "${PROJECT_ID}-backups:Backup storage"
    )
    
    for bucket_info in "${buckets[@]}"; do
        IFS=':' read -r bucket_name bucket_description <<< "$bucket_info"
        
        if ! gsutil ls "gs://$bucket_name" &> /dev/null; then
            log_info "Creating storage bucket: $bucket_name"
            gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$bucket_name"
            
            # Set lifecycle policy for build artifacts
            if [[ "$bucket_name" == *"build-artifacts"* ]]; then
                gsutil lifecycle set - "gs://$bucket_name" << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF
            fi
        else
            log_info "Storage bucket $bucket_name already exists"
        fi
    done
    
    log_success "Cloud Storage setup complete"
}

setup_monitoring() {
    log_info "Setting up monitoring and alerting..."
    
    # Create notification channel (placeholder)
    log_info "Monitoring setup would include:"
    log_info "- Uptime checks for Cloud Run services"
    log_info "- Error rate alerts"
    log_info "- Performance monitoring"
    log_info "- Resource utilization alerts"
    
    log_warning "Manual setup required for monitoring notification channels"
    log_success "Monitoring setup complete"
}

display_configuration() {
    log_info "Displaying configuration for GitHub secrets..."
    
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
    
    echo ""
    echo "=== GitHub Repository Secrets ==="
    echo "Add these secrets to your GitHub repository:"
    echo ""
    echo "GCP_PROJECT_ID: $PROJECT_ID"
    echo "WIF_PROVIDER: projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github"
    echo "WIF_SERVICE_ACCOUNT: github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
    echo ""
    echo "=== Optional Secrets ==="
    echo "CODECOV_TOKEN: <your-codecov-token>"
    echo "CODACY_PROJECT_TOKEN: <your-codacy-token>"
    echo "GITGUARDIAN_API_KEY: <your-gitguardian-key>"
    echo "NX_CLOUD_ACCESS_TOKEN: <your-nx-cloud-token>"
    echo ""
    echo "=== Manual Steps Required ==="
    echo "1. Update Secret Manager secrets with actual values"
    echo "2. Configure monitoring notification channels"
    echo "3. Set up external service integrations (Codecov, Codacy, etc.)"
    echo "4. Configure branch protection rules in GitHub"
    echo ""
    
    if [ -z "$GITHUB_ORG" ] || [ -z "$GITHUB_REPO" ]; then
        echo "=== Workload Identity Binding ==="
        echo "Run this command with your actual GitHub org and repo:"
        echo ""
        echo "gcloud iam service-accounts add-iam-policy-binding \\"
        echo "  github-actions@${PROJECT_ID}.iam.gserviceaccount.com \\"
        echo "  --project=\"$PROJECT_ID\" \\"
        echo "  --role=\"roles/iam.workloadIdentityUser\" \\"
        echo "  --member=\"principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO\""
        echo ""
    fi
}

main() {
    log_info "Starting Modern CI/CD Pipeline Setup"
    log_info "Project: $PROJECT_ID"
    log_info "Region: $REGION"
    
    if [ -n "$GITHUB_ORG" ] && [ -n "$GITHUB_REPO" ]; then
        log_info "GitHub Repository: $GITHUB_ORG/$GITHUB_REPO"
    fi
    
    echo ""
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Setup cancelled"
        exit 0
    fi
    
    check_prerequisites
    enable_apis
    setup_artifact_registry
    setup_service_accounts
    setup_iam_permissions
    setup_workload_identity_federation
    setup_secrets
    setup_bigquery
    setup_pubsub
    setup_storage
    setup_monitoring
    
    log_success "Modern CI/CD Pipeline setup complete!"
    echo ""
    display_configuration
}

# Help function
show_help() {
    echo "Modern CI/CD Pipeline Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --project PROJECT_ID    Google Cloud Project ID (default: saigon-signals)"
    echo "  -r, --region REGION          Google Cloud Region (default: asia-southeast1)"
    echo "  -o, --github-org ORG         GitHub Organization"
    echo "  -g, --github-repo REPO       GitHub Repository (default: signals)"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  PROJECT_ID                   Google Cloud Project ID"
    echo "  REGION                       Google Cloud Region"
    echo "  GITHUB_ORG                   GitHub Organization"
    echo "  GITHUB_REPO                  GitHub Repository"
    echo ""
    echo "Examples:"
    echo "  $0 -p my-project -o myorg -g myrepo"
    echo "  PROJECT_ID=my-project GITHUB_ORG=myorg $0"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -o|--github-org)
            GITHUB_ORG="$2"
            shift 2
            ;;
        -g|--github-repo)
            GITHUB_REPO="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main