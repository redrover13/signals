# Core Infrastructure Module

This Terraform module provisions the core infrastructure for the Dulce de Saigon F&B Data Platform on Google Cloud Platform.

## Overview

This module creates a comprehensive set of GCP resources that form the foundation of the platform:

- **Service Accounts**: Dedicated service accounts for different components with least-privilege access
- **Storage Buckets**: Application data, build artifacts, and backup storage with lifecycle policies
- **Pub/Sub**: Event-driven messaging system with dead letter queues and retry policies
- **BigQuery**: Data warehousing with optimized schemas, partitioning, and clustering
- **Secret Manager**: Secure storage for sensitive configuration and credentials
- **Monitoring**: Logging metrics and uptime checks for observability

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Service       │    │   Storage       │    │   Pub/Sub       │
│   Accounts      │    │   Buckets       │    │   Topics        │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • API SA        │    │ • App Data      │    │ • Main Events   │
│ • Vertex AI SA  │    │ • Build Artifacts│   │ • Agent Orchestr│
│ • Data Proc SA  │    │ • Data Backup   │    │ • Data Process  │
│ • GitHub SA     │    │ • TF State      │    │ • Dead Letter   │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BigQuery      │    │   Secret        │    │   Monitoring    │
│   Datasets      │    │   Manager       │    │   & Alerting    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Analytics     │    │ • DB Connection │    │ • Error Metrics │
│ • Social Media  │    │ • API Keys      │    │ • Uptime Checks │
│ • CRM           │    │ • Social Creds  │    │ • Log Monitoring│
│ • Reviews       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

### Security

- **IAM Best Practices**: Least-privilege access with role-based permissions
- **Service Account Separation**: Dedicated SAs for different workloads
- **Secret Management**: Centralized credential storage with Secret Manager
- **Uniform Bucket Access**: Consistent access control across storage

### Scalability

- **BigQuery Partitioning**: Time-based partitioning for query performance
- **Storage Lifecycle**: Automatic data archival and cleanup policies
- **Pub/Sub Scaling**: Message buffering and retry policies for reliability
- **Resource Labeling**: Consistent tagging for cost allocation and management

### Observability

- **Logging Metrics**: Custom metrics for error tracking and analysis
- **Uptime Monitoring**: Health checks for critical service endpoints
- **Resource Monitoring**: Built-in GCP monitoring integration
- **Dead Letter Queues**: Message failure handling and debugging

### Compliance

- **Vietnamese Data Residency**: All resources deployed in Asia Southeast region
- **Data Retention**: Configurable retention policies for GDPR compliance
- **Audit Logging**: Full audit trail for all resource access and changes
- **Access Control**: Domain-based access controls for organizational security

## Usage

### Basic Usage

```hcl
module "core_infrastructure" {
  source = "./core-infrastructure"

  project_id   = "your-gcp-project"
  region       = "asia-southeast1"
  environment  = "prod"

  data_owner_email    = "admin@yourcompany.com"
  organization_domain = "yourcompany.com"
}
```

### Development Environment

```hcl
module "core_infrastructure" {
  source = "./core-infrastructure"

  project_id   = "your-gcp-project-dev"
  region       = "asia-southeast1"
  environment  = "dev"

  table_expiration_days = 30  # Shorter retention for dev
  enable_monitoring     = false
}
```

### Production with GitHub Actions

```hcl
module "core_infrastructure" {
  source = "./core-infrastructure"

  project_id   = "your-gcp-project-prod"
  region       = "asia-southeast1"
  environment  = "prod"

  create_github_sa      = true
  table_expiration_days = 365
  enable_monitoring     = true

  labels = {
    cost-center = "engineering"
    team        = "platform"
  }
}
```

## Inputs

| Name                  | Description                                            | Type          | Default                      | Required |
| --------------------- | ------------------------------------------------------ | ------------- | ---------------------------- | :------: |
| project_id            | The GCP project ID                                     | `string`      | `"saigon-signals"`           |    no    |
| region                | The GCP region for resources                           | `string`      | `"asia-southeast1"`          |    no    |
| environment           | Environment name (dev, staging, prod)                  | `string`      | `"prod"`                     |    no    |
| data_owner_email      | Email address of the data owner for BigQuery access    | `string`      | `"admin@saigon-signals.com"` |    no    |
| organization_domain   | Organization domain for BigQuery access                | `string`      | `"saigon-signals.com"`       |    no    |
| create_github_sa      | Whether to create a service account for GitHub Actions | `bool`        | `false`                      |    no    |
| table_expiration_days | Default table expiration in days for BigQuery tables   | `number`      | `90`                         |    no    |
| enable_monitoring     | Enable monitoring and alerting resources               | `bool`        | `true`                       |    no    |
| enable_vpc_connector  | Enable VPC connector for serverless services           | `bool`        | `false`                      |    no    |
| labels                | Additional labels to apply to all resources            | `map(string)` | `{}`                         |    no    |

## Outputs

| Name                                  | Description                                           |
| ------------------------------------- | ----------------------------------------------------- |
| api_service_account_email             | Email address of the API service account              |
| vertex_agents_service_account_email   | Email address of the Vertex AI agents service account |
| data_processing_service_account_email | Email address of the data processing service account  |
| github_actions_service_account_email  | Email address of the GitHub Actions service account   |
| app_data_bucket_name                  | Name of the application data storage bucket           |
| build_artifacts_bucket_name           | Name of the build artifacts storage bucket            |
| data_backup_bucket_name               | Name of the data backup storage bucket                |
| main_events_topic_name                | Name of the main events Pub/Sub topic                 |
| agent_orchestration_topic_name        | Name of the agent orchestration Pub/Sub topic         |
| data_processing_topic_name            | Name of the data processing Pub/Sub topic             |
| analytics_dataset_id                  | ID of the analytics BigQuery dataset                  |
| social_media_dataset_id               | ID of the social media BigQuery dataset               |
| crm_dataset_id                        | ID of the CRM BigQuery dataset                        |
| reviews_dataset_id                    | ID of the reviews BigQuery dataset                    |

## Resources Created

### Service Accounts

- `dulce-api-sa`: Main API service account
- `vertex-agents`: Vertex AI agents service account
- `data-processing-sa`: Data processing service account
- `github-actions-sa`: GitHub Actions service account (optional)

### Storage Buckets

- `{project_id}-app-data`: Application data storage
- `{project_id}-build-artifacts`: Build artifacts storage
- `{project_id}-data-backup`: Data backup storage (COLDLINE)

### Pub/Sub Topics & Subscriptions

- `dulce-main-events`: Main application events
- `agent-orchestration`: AI agent coordination
- `data-processing`: Data pipeline events
- `dead-letter-queue`: Failed message handling

### BigQuery Datasets & Tables

- **Analytics**: events, users tables with partitioning
- **Social Media**: posts table with engagement metrics
- **CRM**: customers table with preferences
- **Reviews**: customer_reviews table with sentiment analysis

### Secret Manager Secrets

- `database-connection-string`: Database credentials
- `external-api-keys`: Third-party API keys
- `social-media-api-credentials`: Social platform credentials

### Monitoring Resources

- Error count logging metric
- API uptime check configuration
- Custom monitoring dashboards (when enabled)

## Prerequisites

1. **GCP Project**: Active project with billing enabled
2. **APIs Enabled**: Required GCP APIs (automated by module)
3. **Terraform State**: GCS bucket for remote state storage
4. **Permissions**: Adequate IAM permissions for resource creation

## Required APIs

This module automatically enables the following GCP APIs:

- Cloud Functions API
- Cloud Run API
- BigQuery API
- Cloud Storage API
- Secret Manager API
- AI Platform API
- Pub/Sub API
- Cloud Scheduler API
- Cloud Build API
- Container Registry API
- IAM API
- Cloud Resource Manager API
- Cloud Monitoring API
- Cloud Logging API

## Security Considerations

### IAM Best Practices

- Service accounts follow principle of least privilege
- Separate SAs for different workloads
- No service account keys used (Workload Identity Federation recommended)

### Data Protection

- Uniform bucket-level access enabled
- Versioning enabled for critical data
- Lifecycle policies for cost optimization
- Encryption at rest (Google-managed keys)

### Network Security

- Private Google Access for serverless services
- VPC connector support (when enabled)
- Firewall rules for internal communication

## Cost Optimization

### Storage Lifecycle

- Automatic transition to NEARLINE after 30 days
- Automatic deletion after configurable retention period
- COLDLINE storage for backup data

### BigQuery Optimization

- Table partitioning by timestamp
- Clustering for query performance
- Configurable table expiration

### Compute Efficiency

- Serverless architecture with auto-scaling
- Pub/Sub message buffering
- Dead letter queues to prevent infinite retries

## Monitoring and Alerting

### Built-in Metrics

- Error count logging metric
- API uptime checks
- Resource utilization monitoring

### Custom Dashboards

- Application performance metrics
- Cost monitoring dashboards
- Security and compliance reports

### Alerting Policies

- High error rate alerts
- Service availability alerts
- Cost threshold notifications

## Disaster Recovery

### Data Backup

- Automated BigQuery exports
- Cross-region bucket replication
- Point-in-time recovery capabilities

### State Management

- Remote Terraform state in GCS
- State file versioning and locking
- Disaster recovery procedures

## Compliance

### Vietnamese Data Residency

- All resources deployed in Asia Southeast region
- Data processing within Vietnamese borders
- Compliance with local data protection laws

### GDPR Compliance

- Configurable data retention policies
- Right to erasure capabilities
- Data processing audit trails

## Troubleshooting

### Common Issues

1. **Insufficient Permissions**

   ```bash
   Error: Error creating service account: permission denied
   ```

   - Ensure your account has `resourcemanager.projects.setIamPolicy` permission

2. **Bucket Name Conflicts**

   ```bash
   Error: bucket name already exists
   ```

   - Bucket names must be globally unique, modify `project_id` variable

3. **API Not Enabled**

   ```bash
   Error: API not enabled
   ```

   - Module enables APIs automatically, but may need billing account setup

### Debugging

Enable Terraform debug logging:

```bash
export TF_LOG=DEBUG
terraform plan
```

Check GCP resource quotas:

```bash
gcloud compute project-info describe --project=PROJECT_ID
```

## Migration

### From Existing Infrastructure

1. Import existing resources using `terraform import`
2. Update variable values to match current setup
3. Run `terraform plan` to verify changes
4. Apply changes incrementally

### Between Environments

1. Use environment-specific variable files
2. Separate state files per environment
3. Use workspace-based deployments

## Contributing

1. **Code Style**: Follow Terraform best practices
2. **Documentation**: Update README for any changes
3. **Testing**: Validate with `terraform validate` and `terraform plan`
4. **Security**: Review IAM permissions and access patterns

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review GCP documentation
3. Consult Terraform Google Provider docs
4. Contact the platform team

## License

This module is part of the Dulce de Saigon platform and follows the project's licensing terms.
