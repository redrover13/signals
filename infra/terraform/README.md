# Terraform Infrastructure for Saigon Signals

This directory contains Terraform configurations for deploying the complete Saigon Signals infrastructure on Google Cloud Platform.

## 🏗️ Architecture Overview

The infrastructure is organized into modular components:

- **Root Module** (`./`): Core setup, APIs, and state management
- **BigQuery** (`./bigquery/`): Data warehousing and analytics datasets
- **Functions** (`./functions/`): Cloud Functions and Cloud Run services
- **Vertex Agents** (`./vertex-agents/`): AI agents and orchestration
- **RAG Pipeline** (`./rag-pipeline/`): Retrieval-Augmented Generation data ingestion
- **Looker** (`./looker/`): Business intelligence and reporting

## 🚀 Quick Start

### Prerequisites

1. **Google Cloud Project**: Ensure you have a GCP project (`saigon-signals`)
2. **Authentication**: Set up authentication using one of:
   - Workload Identity Federation (WIF) - Recommended for CI/CD
   - Service Account Key
   - Application Default Credentials

3. **Required Tools**:
   ```bash
   # Install Terraform
   curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
   sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
   sudo apt-get update && sudo apt-get install terraform

   # Install Google Cloud SDK
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

### Setup

1. **Clone and Navigate**:
   ```bash
   cd infra/terraform
   ```

2. **Run Setup Script**:
   ```bash
   ./setup.sh
   ```

   Or manually:

3. **Manual Setup**:
   ```bash
   # Copy configuration files
   cp terraform.tfvars.example terraform.tfvars
   cp bigquery/terraform.tfvars.example bigquery/terraform.tfvars
   cp functions/terraform.tfvars.example functions/terraform.tfvars
   cp vertex-agents/terraform.tfvars.example vertex-agents/terraform.tfvars
   cp looker/terraform.tfvars.example looker/terraform.tfvars

   # Initialize and apply root configuration
   terraform init
   terraform plan
   terraform apply

   # Apply each module
   cd bigquery && terraform init && terraform apply
   cd ../functions && terraform init && terraform apply
   cd ../vertex-agents && terraform init && terraform apply
   cd ../looker && terraform init && terraform apply
   ```

## 📁 Module Details

### Root Module
- **Purpose**: Foundation setup, API enablement, state management
- **Resources**: 
  - GCS bucket for Terraform state
  - Required API enablement
  - Optional GitHub Actions service account

### BigQuery Module
- **Purpose**: Data warehousing and analytics
- **Resources**:
  - Analytics, Social Media, CRM, and Reviews datasets
  - Pre-configured tables with schemas
  - Data transfer configurations
- **Key Outputs**: Dataset and table IDs

### Functions Module
- **Purpose**: Serverless compute and APIs
- **Resources**:
  - Cloud Functions for each API (social, CRM, CMS, reviews)
  - Cloud Run service for frontend
  - Service accounts and IAM bindings
  - Source code storage bucket
- **Key Outputs**: Function URLs and service account

### Vertex Agents Module
- **Purpose**: AI agents and orchestration
- **Resources**:
  - Cloud Functions for each agent
  - Pub/Sub topics for communication
  - Cloud Scheduler for automation
  - Vertex AI endpoints (optional)
- **Key Outputs**: Agent URLs and orchestration topic

### Looker Module
- **Purpose**: Business intelligence and reporting
- **Resources**:
  - Looker integration function
  - Secret Manager for API credentials
  - BigQuery views for reporting
  - Scheduled report generation
- **Key Outputs**: Integration URL and export bucket

### RAG Pipeline Module
- **Purpose**: Retrieval-Augmented Generation data ingestion
- **Resources**:
  - Vertex AI Search data store and engine
  - Cloud Function for document processing
  - Cloud Storage buckets for documents and chunks
  - Pub/Sub for event-driven processing
  - Service accounts with appropriate IAM permissions
- **Key Outputs**: Search engine ID, storage bucket names, processor function

## 🔧 Configuration

### Environment Variables

Each module supports these common variables:

```hcl
project_id  = "saigon-signals"
region      = "us-central1"
environment = "prod"
```

### Secrets Management

The following secrets need to be configured in Secret Manager:

```bash
# Looker API credentials
gcloud secrets create looker-client-id --data-file=client-id.txt
gcloud secrets create looker-client-secret --data-file=client-secret.txt
gcloud secrets create looker-base-url --data-file=base-url.txt
```

### Workload Identity Federation

If using WIF (recommended), ensure your GitHub Actions workflow has:

```yaml
- name: Authenticate to GCP
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
```

## 🚀 Deployment

### CI/CD Integration

The infrastructure integrates with your GitHub Actions workflow:

1. **Terraform Plan**: Runs on PRs to preview changes
2. **Terraform Apply**: Runs on main branch merges
3. **Application Deployment**: Follows infrastructure deployment

### Manual Deployment

```bash
# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# View outputs
terraform output
```

### Destroy Infrastructure

⚠️ **Warning**: This will destroy all resources!

```bash
# Destroy in reverse order
cd looker && terraform destroy
cd ../vertex-agents && terraform destroy
cd ../functions && terraform destroy
cd ../bigquery && terraform destroy
cd .. && terraform destroy
```

## 📊 Monitoring and Maintenance

### State Management

- **Backend**: Google Cloud Storage
- **Bucket**: `saigon-signals-terraform-state`
- **Locking**: Automatic via GCS
- **Versioning**: Enabled with lifecycle policies

### Cost Optimization

- **Function Scaling**: Min instances set to 0
- **Storage Lifecycle**: Automatic cleanup policies
- **BigQuery**: Table expiration configured
- **Monitoring**: Built-in GCP monitoring

### Security

- **IAM**: Principle of least privilege
- **Service Accounts**: Dedicated per service
- **Secrets**: Stored in Secret Manager
- **Network**: Private where possible

## 🔍 Troubleshooting

### Common Issues

1. **API Not Enabled**:
   ```bash
   gcloud services enable <service-name>
   ```

2. **Permission Denied**:
   ```bash
   gcloud auth application-default login
   ```

3. **State Lock**:
   ```bash
   terraform force-unlock <lock-id>
   ```

4. **Resource Already Exists**:
   ```bash
   terraform import <resource-type>.<name> <resource-id>
   ```

### Validation

```bash
# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Check for security issues
terraform plan | grep -i "warning\|error"
```

## 📚 Additional Resources

- [Terraform Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Google Cloud Terraform Samples](https://github.com/terraform-google-modules)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

## 🤝 Contributing

1. Make changes in feature branches
2. Run `terraform plan` to validate
3. Submit PR with plan output
4. Apply changes after approval

## 📞 Support

For infrastructure issues:
1. Check the troubleshooting section
2. Review Terraform and GCP logs
3. Create an issue with full error details