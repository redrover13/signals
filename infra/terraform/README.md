# Terraform Infrastructure for Dulce de Saigon

This directory contains the Terraform configuration for the Dulce de Saigon data platform infrastructure on Google Cloud Platform (GCP).

## Remote State Backend

The Terraform state is managed remotely using a Google Cloud Storage (GCS) backend. This ensures that the state is stored securely and can be accessed by authorized team members, which is critical for collaborative development and CI/CD pipelines.

### Configuration

The backend is defined in the `backend.tf` file. The specific configuration values for the GCS bucket are provided through the `backend.tfvars` file.

-   **`terraform_state_bucket`**: The name of the GCS bucket where the Terraform state file is stored.
-   **`terraform_state_prefix`**: The path within the bucket where the state file is located.

To initialize the backend, run the following command, ensuring you have the necessary permissions to access the GCS bucket:

```shell
terraform init -backend-config=backend.tfvars
```

This setup ensures a consistent and secure state management process, adhering to our Google-first architecture and security protocols.