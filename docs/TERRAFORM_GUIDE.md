# Terraform Infrastructure Management Guide

This guide explains how to use Terraform to manage the infrastructure for the Dulce de Saigon F&B Data Platform.

## Overview

We use Terraform to define and provision our infrastructure as code (IaC). This approach ensures consistency, repeatability, and version control for all our infrastructure components.

## Directory Structure

Our Terraform code is organized as follows:

```
infra/
├── modules/             # Reusable infrastructure modules
│   ├── gcp-project/     # GCP project setup
│   ├── networking/      # VPC, subnets, firewalls
│   ├── compute/         # Compute Engine, GKE
│   ├── storage/         # Cloud Storage, BigQuery
│   └── monitoring/      # Monitoring, logging, alerting
├── environments/        # Environment-specific configurations
│   ├── dev/             # Development environment
│   ├── uat/             # User Acceptance Testing
│   └── prod/            # Production environment
├── scripts/             # Helper scripts
└── README.md            # Documentation
```

## Module Design

Each module follows these design principles:

1. **Encapsulation**: Modules should encapsulate a specific piece of infrastructure
2. **Reusability**: Modules should be reusable across environments
3. **Configurability**: Modules should be configurable via variables
4. **Outputs**: Modules should provide outputs for integration with other modules

## GCP Project Structure

We use the following GCP project structure:

- **Host Project**: Contains shared infrastructure (VPC, subnets)
- **Service Projects**: For specific services (API, Analytics, Storage)
- **Development Projects**: For development and testing environments

## Security Considerations

Our infrastructure follows these security principles:

1. **Least Privilege**: Service accounts have minimal permissions
2. **Network Segmentation**: Services are isolated in appropriate subnets
3. **Encryption**: Data at rest and in transit is encrypted
4. **Audit Logging**: All infrastructure actions are logged

## State Management

We store Terraform state in a Cloud Storage bucket with versioning enabled:

```hcl
terraform {
  backend "gcs" {
    bucket = "dulce-de-saigon-terraform-state"
    prefix = "environments/dev"
  }
}
```

## Environment Management

Each environment has its own Terraform configuration, with shared modules:

```
environments/dev/
├── main.tf       # Main configuration
├── variables.tf  # Environment-specific variables
├── outputs.tf    # Environment outputs
└── terraform.tfvars # Variable values (not committed)
```

## Common Workflows

### Setting up a new environment

```bash
# Initialize Terraform
cd infra/environments/dev
terraform init

# Create an execution plan
terraform plan -out=plan.out

# Apply the plan
terraform apply plan.out
```

### Making infrastructure changes

1. Modify the relevant Terraform files
2. Run `terraform plan` to see the changes
3. Review the plan carefully
4. Apply the changes with `terraform apply`
5. Commit the changes to version control

### Destroying resources

```bash
# Create a destroy plan
terraform plan -destroy -out=destroy.out

# Apply the destroy plan
terraform apply destroy.out
```

## Best Practices

1. **Version Control**: Always commit Terraform code to version control
2. **Code Review**: All infrastructure changes should be reviewed
3. **Testing**: Test changes in development before applying to production
4. **Documentation**: Document the purpose of each module and variable
5. **State Locking**: Use state locking to prevent concurrent modifications
6. **Tagging**: Tag all resources for billing and organization

## Terraform Version Management

We use `tfenv` to manage Terraform versions:

```bash
# Install a specific version
tfenv install 1.3.0

# Use a specific version
tfenv use 1.3.0
```

## Resource Naming Conventions

We follow this naming convention for resources:

```
{project}-{environment}-{resource-type}-{purpose}
```

Example:
```
dds-prod-gcs-data-lake
```

## Additional Resources

- [Terraform GCP Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Resource Hierarchy](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Terrascan for Security Checks](https://github.com/accurics/terrascan)
