# Enhanced CI/CD Pipeline Documentation

## Overview

This document describes the enhanced CI/CD pipeline for the Dulce de Saigon F&B Data Platform, including comprehensive infrastructure provisioning, load testing, and multi-environment deployment capabilities.

## Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Pull Request   │    │   Staging       │    │   Production    │
│  Validation     │    │   Deployment    │    │   Deployment    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Build & Test  │    │ • Auto Deploy   │    │ • Manual Gate   │
│ • Security Scan │    │ • Load Testing  │    │ • Health Checks │
│ • Static Analysis│    │ • Health Checks │    │ • Release Tag   │
│ • TF Validation │    │ • Performance   │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
    [Code Quality]         [Performance Gate]      [Production Ready]
```

## Enhanced CI/CD Workflow

### 1. Enhanced Pipeline Features

The new pipeline (`enhanced-cicd.yml`) includes:

- **Multi-scenario Load Testing**: Smoke, load, stress, and spike tests
- **Staging → Production Flow**: Automated staging with manual production approval
- **Performance Validation**: Response time and error rate thresholds
- **Comprehensive Health Checks**: Post-deployment validation
- **Rollback Capabilities**: Automatic rollback on failure
- **Infrastructure as Code**: Complete Terraform infrastructure provisioning

### 2. Core Infrastructure Module

The new `core-infrastructure` Terraform module provides:

#### Service Accounts
- **API Service Account**: Main application services
- **Vertex AI Service Account**: AI agents and ML workloads
- **Data Processing Service Account**: ETL and data pipeline operations
- **GitHub Actions Service Account**: CI/CD automation

#### Storage Infrastructure
- **Application Data Bucket**: Runtime application data with lifecycle policies
- **Build Artifacts Bucket**: CI/CD build outputs and deployment packages
- **Data Backup Bucket**: Long-term data archival (COLDLINE storage)
- **Terraform State Bucket**: Infrastructure state management

#### Pub/Sub Messaging
- **Main Events Topic**: Application-wide event streaming
- **Agent Orchestration Topic**: AI agent coordination
- **Data Processing Topic**: ETL pipeline messaging
- **Dead Letter Queue**: Failed message handling with retry policies

#### BigQuery Data Warehouse
- **Analytics Dataset**: Core business intelligence data
- **Social Media Dataset**: Social platform engagement metrics
- **CRM Dataset**: Customer relationship data
- **Reviews Dataset**: Customer feedback and sentiment analysis

#### Security & Monitoring
- **Secret Manager**: Secure credential storage
- **Logging Metrics**: Custom error tracking and analysis
- **Uptime Monitoring**: Service health and availability checks
- **IAM Policies**: Least-privilege access controls

### 3. Load Testing Framework

The pipeline includes comprehensive load testing with k6:

#### Test Scenarios
- **Smoke Test**: Single user validation (1 minute)
- **Load Test**: Average expected traffic (5 minutes at 10 VUs)
- **Stress Test**: Above-normal conditions (up to 30 VUs)
- **Spike Test**: Sudden traffic surges (50 VU spike)

#### Performance Thresholds
- **Response Time**: 95% under 500ms, 99% under 1s
- **Error Rate**: Less than 5% failures
- **API Performance**: 95% under 300ms average
- **Health Checks**: 95% under 100ms

#### Test Coverage
- Health endpoint validation
- API endpoint testing
- Database connectivity
- Performance regression detection

### 4. Multi-Environment Strategy

#### Environment Configuration
```yaml
Staging:
  - Project: saigon-signals-staging
  - Auto-deployment from develop/staging branches
  - Load testing enabled
  - Shorter data retention (60 days)

Production:
  - Project: saigon-signals
  - Manual approval required
  - Full monitoring enabled
  - Extended data retention (365 days)
```

#### Deployment Flow
1. **Code Push**: Triggers validation pipeline
2. **Staging Deployment**: Automatic deployment to staging
3. **Load Testing**: Comprehensive performance testing
4. **Manual Approval**: Production deployment gate
5. **Production Deployment**: Approved release
6. **Health Validation**: Post-deployment verification

## Usage

### 1. Pipeline Triggers

#### Automatic Triggers
- **Pull Requests**: Validation only (no deployment)
- **Push to develop/staging**: Deploy to staging with load tests
- **Push to main**: Deploy to production (with approval)

#### Manual Triggers
```yaml
workflow_dispatch:
  inputs:
    environment: [staging, production]
    run_load_tests: [true, false]
    force_deploy: [true, false]
```

### 2. Environment Variables Required

#### GitHub Secrets
```yaml
GCP_WIF_PROVIDER: # Workload Identity Federation provider
GCP_SERVICE_ACCOUNT: # Service account for GCP access
```

#### Environment-Specific Secrets
```yaml
# Staging Environment
GCP_PROJECT_ID: saigon-signals-staging

# Production Environment  
GCP_PROJECT_ID: saigon-signals
```

### 3. Infrastructure Deployment

#### New Deployment (Clean Environment)
```bash
# 1. Configure Terraform variables
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 2. Deploy core infrastructure
terraform init
terraform plan
terraform apply

# 3. Trigger CI/CD pipeline
git push origin main
```

#### Migration from Legacy Modules
```bash
# 1. Enable legacy mode temporarily
enable_legacy_modules = true

# 2. Import existing resources
terraform import module.core_infrastructure.google_storage_bucket.app_data existing-bucket-name

# 3. Disable legacy modules
enable_legacy_modules = false

# 4. Apply changes
terraform apply
```

## Infrastructure Configuration

### 1. Core Infrastructure Variables

```hcl
# Required Variables
project_id = "saigon-signals"
region = "asia-southeast1"
environment = "prod"

# Data Access
data_owner_email = "admin@saigon-signals.com"
organization_domain = "saigon-signals.com"

# Features
enable_monitoring = true
enable_legacy_modules = false
table_expiration_days = 90

# Service Accounts
create_github_sa = true
```

### 2. Environment-Specific Configurations

#### Development
```hcl
project_id = "saigon-signals-dev"
environment = "dev"
table_expiration_days = 30
enable_monitoring = false
```

#### Staging
```hcl
project_id = "saigon-signals-staging"
environment = "staging"
table_expiration_days = 60
enable_monitoring = true
```

#### Production
```hcl
project_id = "saigon-signals"
environment = "prod"
table_expiration_days = 365
enable_monitoring = true
```

## Monitoring and Observability

### 1. Built-in Monitoring

#### Infrastructure Metrics
- Resource utilization across all services
- Cost tracking and optimization alerts
- Security compliance monitoring
- Performance baseline establishment

#### Application Metrics
- API response times and error rates
- Database query performance
- Pub/Sub message processing rates
- Load balancing and auto-scaling metrics

### 2. Alerting Policies

#### Critical Alerts
- Service unavailability (>1 minute)
- Error rate >5% (>5 minutes)
- Response time >1s 95th percentile

#### Warning Alerts
- Response time >500ms 95th percentile
- Error rate >1% (>10 minutes)
- Resource utilization >80%

### 3. Performance Dashboards

#### Real-time Monitoring
- Live service health status
- Current traffic and load metrics
- Error rates and response times
- Infrastructure resource usage

#### Historical Analysis
- Performance trends over time
- Capacity planning metrics
- Cost optimization opportunities
- Security incident tracking

## Security Considerations

### 1. Access Control

#### Identity & Access Management
- Workload Identity Federation for GitHub Actions
- Service account separation by function
- Least-privilege permission model
- Regular access review and rotation

#### Network Security
- Private Google Access for serverless
- VPC connector support (when enabled)
- Firewall rules for internal communication
- SSL/TLS encryption for all connections

### 2. Data Protection

#### Encryption
- Encryption at rest (Google-managed keys)
- Encryption in transit (TLS 1.3)
- Secret Manager for sensitive data
- BigQuery encryption with customer keys (optional)

#### Compliance
- Vietnamese data residency requirements
- GDPR compliance with data retention policies
- Audit logging for all resource access
- Data lineage and governance controls

### 3. Secret Management

#### Secret Manager Integration
```bash
# Database credentials
gcloud secrets create database-connection-string --data-file=db-config.json

# API keys
gcloud secrets create external-api-keys --data-file=api-keys.json

# Social media credentials
gcloud secrets create social-media-api-credentials --data-file=social-creds.json
```

## Disaster Recovery

### 1. Backup Strategy

#### Data Backups
- Automated BigQuery exports to Cloud Storage
- Cross-region bucket replication
- Point-in-time recovery capabilities
- Regular backup validation and testing

#### Infrastructure Backups
- Terraform state versioning and locking
- Infrastructure configuration in Git
- Disaster recovery runbooks
- Regular DR drills and validation

### 2. Recovery Procedures

#### Service Recovery
1. **Identify Impact**: Assess scope and affected services
2. **Activate DR Plan**: Follow documented procedures
3. **Restore Services**: Priority-based service restoration
4. **Validate Recovery**: Comprehensive testing and validation
5. **Post-Incident Review**: Lessons learned and improvements

#### Data Recovery
1. **Assess Data Loss**: Determine scope and timeframe
2. **Select Recovery Method**: Point-in-time or full restore
3. **Execute Recovery**: Restore from validated backups
4. **Verify Integrity**: Data consistency and completeness checks
5. **Resume Operations**: Gradual service restoration

## Cost Optimization

### 1. Automated Cost Controls

#### Storage Optimization
- Lifecycle policies for automatic archival
- Intelligent tiering based on access patterns
- Compression and deduplication
- Regular cleanup of unused resources

#### Compute Optimization
- Serverless auto-scaling
- Right-sizing based on usage patterns
- Reserved capacity for predictable workloads
- Spot instances for batch processing

### 2. Cost Monitoring

#### Budget Alerts
- Project-level budget notifications
- Service-specific cost tracking
- Anomaly detection for unusual spending
- Regular cost optimization reviews

#### Resource Optimization
- Unused resource identification
- Right-sizing recommendations
- Reserved capacity analysis
- Performance-cost trade-off optimization

## Troubleshooting

### 1. Common Issues

#### Deployment Failures
```bash
# Check pipeline logs
gh run list --workflow=enhanced-cicd.yml
gh run view <run-id>

# Validate Terraform configuration
cd infra/terraform
terraform validate
terraform plan

# Check service account permissions
gcloud projects get-iam-policy PROJECT_ID
```

#### Load Test Failures
```bash
# Review load test results
cat load-test-results.json | jq '.metrics'

# Check application logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Validate performance thresholds
# Adjust thresholds in comprehensive-load-test.js if needed
```

#### Infrastructure Issues
```bash
# Check resource status
gcloud compute instances list
gcloud run services list
gcloud functions list

# Validate monitoring
gcloud monitoring policies list
gcloud monitoring uptime list
```

### 2. Debug Mode

#### Enable Debug Logging
```bash
# Terraform debug
export TF_LOG=DEBUG

# GitHub Actions debug
# Add ACTIONS_STEP_DEBUG=true to repository secrets

# k6 debug mode
k6 run --verbose comprehensive-load-test.js
```

### 3. Support Escalation

#### Internal Support
1. Check troubleshooting documentation
2. Review monitoring dashboards
3. Consult team knowledge base
4. Escalate to platform team

#### External Support
1. Google Cloud Support (for infrastructure)
2. GitHub Support (for CI/CD issues)
3. Community forums and documentation
4. Third-party tool vendor support

## Migration Guide

### 1. From Legacy Infrastructure

#### Pre-Migration Checklist
- [ ] Backup existing configuration
- [ ] Document current resource state
- [ ] Plan migration timeline
- [ ] Coordinate with stakeholders

#### Migration Steps
1. **Assessment**: Inventory existing resources
2. **Planning**: Create migration plan and timeline
3. **Preparation**: Set up new infrastructure (parallel)
4. **Migration**: Gradual service migration
5. **Validation**: Comprehensive testing and validation
6. **Cleanup**: Remove legacy resources

### 2. From Manual Processes

#### Process Automation
- Infrastructure as Code adoption
- CI/CD pipeline implementation
- Automated testing integration
- Monitoring and alerting setup

#### Team Training
- Terraform best practices
- GitHub Actions workflows
- Load testing methodologies
- Incident response procedures

## Best Practices

### 1. Development Workflow

#### Code Quality
- Pre-commit hooks for validation
- Automated testing in pipeline
- Code review requirements
- Security scanning integration

#### Infrastructure Changes
- Terraform plan review before apply
- Gradual rollout for major changes
- Rollback procedures documented
- Change management process

### 2. Operational Excellence

#### Monitoring
- Comprehensive observability
- Proactive alerting and response
- Regular performance reviews
- Capacity planning and optimization

#### Security
- Regular security assessments
- Vulnerability scanning and patching
- Access review and rotation
- Incident response procedures

### 3. Continuous Improvement

#### Performance Optimization
- Regular load testing and benchmarking
- Performance tuning based on metrics
- Capacity planning and resource optimization
- User experience monitoring

#### Process Enhancement
- Regular retrospectives and improvements
- Automation of manual processes
- Knowledge sharing and documentation
- Training and skill development

## Contributing

### 1. Pipeline Development

#### Adding New Tests
1. Create test in appropriate directory (`tests/`)
2. Update pipeline configuration
3. Add documentation
4. Test in development environment

#### Infrastructure Changes
1. Update Terraform modules
2. Run validation tests
3. Update documentation
4. Test deployment pipeline

### 2. Documentation

#### Update Requirements
- New feature documentation
- Configuration changes
- Troubleshooting guides
- Best practice updates

#### Review Process
- Technical review by team
- Documentation review
- Testing validation
- Stakeholder approval

## Support and Maintenance

### 1. Regular Maintenance

#### Infrastructure Updates
- Terraform provider updates
- Security patch application
- Performance optimization
- Cost review and optimization

#### Pipeline Maintenance
- GitHub Actions updates
- Load test scenario updates
- Monitoring configuration updates
- Documentation maintenance

### 2. Incident Response

#### On-Call Procedures
- Escalation matrix and contacts
- Incident response playbooks
- Communication templates
- Post-incident procedures

#### Recovery Procedures
- Service restoration priorities
- Data recovery procedures
- Communication protocols
- Lessons learned process