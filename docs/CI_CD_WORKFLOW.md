# CI/CD Workflow for Dulce de Saigon

## Overview

This document provides a comprehensive overview of the CI/CD pipeline for the Dulce de Saigon project. The pipeline is designed to be secure, efficient, and fully automated, ensuring that all code changes are thoroughly tested and safely deployed to Google Cloud Platform (GCP).

## Architecture

The CI/CD pipeline is orchestrated by GitHub Actions and executed by Google Cloud Build. This hybrid approach combines the developer-friendly workflow of GitHub with the power and security of GCP's native build service.

- **GitHub Actions:** Serves as the trigger and orchestrator for the pipeline. It authenticates to GCP using Workload Identity Federation (WIF) and initiates the build process.
- **Google Cloud Build:** Executes the core CI/CD tasks, including dependency installation, testing, container building, security scanning, and deployment.

## Key Features

### 1. GitOps-Driven Workflow

The pipeline is triggered automatically on every pull request and push to the `main` branch. This GitOps approach ensures that all changes are validated before being merged and deployed, providing a single source of truth for our infrastructure and application code.

### 2. Secure by Design

- **Workload Identity Federation (WIF):** We use WIF to authenticate from GitHub Actions to GCP, eliminating the need for long-lived service account keys and enhancing security.
- **Principle of Least Privilege:** Dedicated service accounts with fine-grained permissions are used for all deployments, minimizing the attack surface.
- **Container Vulnerability Scanning:** Docker images are scanned for known vulnerabilities using Trivy before being pushed to Artifact Registry.

### 3. Efficiency and Self-Healing

- **Targeted Execution:** The pipeline uses Nx's `affected` commands to run tests and builds only for the projects impacted by a given change, significantly reducing execution time.
- **Automated Retries:** Network-dependent steps are configured with automatic retries to handle transient failures, making the pipeline more resilient.

### 4. Compliance and Governance

- **Vietnamese Data Residency:** All resources are deployed to the `asia-southeast1` region, in compliance with Vietnamese data protection laws.
- **Static Code Analysis:** The pipeline includes a linting step to enforce code quality and catch potential issues early.
- **Infrastructure Validation:** Terraform configurations are automatically validated on every run, ensuring the integrity of our infrastructure as code.

## Pipeline Steps

1.  **Checkout:** The source code is checked out from the repository.
2.  **Authentication:** GitHub Actions authenticates to GCP using WIF.
3.  **Setup:** Node.js, pnpm, and the gcloud SDK are set up.
4.  **Install Dependencies:** All project dependencies are installed using pnpm.
5.  **Lint:** Static code analysis is performed on the affected projects.
6.  **Test:** Unit tests are run on the affected projects.
7.  **Terraform Validate:** The Terraform configuration is validated.
8.  **Build Container:** The Docker image for the `agent-runner` service is built.
9.  **Scan Container:** The Docker image is scanned for vulnerabilities.
10. **Push to Artifact Registry:** The container image is pushed to Google Artifact Registry.
11. **Deploy:** The Cloud Function and Cloud Run services are deployed.

## Conclusion

This CI/CD pipeline provides a robust, secure, and efficient foundation for the development and deployment of the Dulce de Saigon platform. By automating the entire process, we can ensure that all code is delivered quickly and safely, while maintaining full compliance with all relevant regulations.