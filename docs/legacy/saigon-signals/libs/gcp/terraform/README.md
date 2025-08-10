# Saigon Signals - Terraform Infrastructure

This directory contains the Terraform configuration for the Saigon Signals data platform on Google Cloud.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) installed
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A Google Cloud project

## Deployment

1.  **Initialize Terraform:**
    Navigate to this directory in your terminal and run `terraform init`.

2.  **Create a `.tfvars` file:**
    Create a file named `terraform.tfvars` and add your project ID:
    ```
    gcp_project_id = "your-gcp-project-id"
    ```

3.  **Plan the deployment:**
    Run `terraform plan` to preview the changes.

4.  **Apply the configuration:**
    Run `terraform apply` to create the resources.