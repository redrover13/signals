# Dulce de Saigon F&B Data Platform - Developer Instructions

This document provides essential information for developers working on the Dulce de Saigon F&B Data Platform, focusing on the "Memory Bank" feature and overall project guidelines.

## About This Project

The "Dulce de Saigon" project is designed to be a leading Food & Beverage (F&B) data platform specifically tailored for the Vietnamese market. Its core component, the "Memory Bank," acts as a centralized repository for all F&B-related data, including menu items, pricing, customer preferences, sales analytics, and supply chain information. The primary objectives are:

*   **Data Centralization:** Consolidate data from various sources into a single, accessible location.
*   **Vietnamese Market Focus:** Tailor data structures and processes to meet unique local requirements.
*   **Google Cloud Integration:** Leverage GCP for scalable, secure, and cost-effective data solutions.
*   **Compliance:** Adherence to Vietnamese data privacy laws and regulations.
*   **Real-time Analytics:** Provide immediate insights into sales, inventory, and customer behavior.

## Core Technologies & Frameworks

The platform is built on a modern technology stack to ensure scalability, maintainability, and performance.

*   **Google Cloud Platform (GCP):** The primary cloud provider.
    *   [Cloud Run](https://cloud.google.com/run/docs): For stateless microservices and APIs.
    *   [Cloud Functions](https://cloud.google.com/functions/docs): For event-driven processing.
    *   [BigQuery](https://cloud.google.com/bigquery/docs): For analytical data warehousing.
    *   [Cloud SQL (PostgreSQL)](https://cloud.google.com/sql/docs): For transactional data.
    *   [Cloud Storage](https://cloud.google.com/storage/docs): For object storage (media, backups).
    *   [Pub/Sub](https://cloud.google.com/pubsub/docs): For asynchronous messaging.
    *   [Cloud Build](https://cloud.google.com/cloud-build/docs): For CI/CD pipelines.
    *   [Artifact Registry](https://cloud.google.com/artifact-registry/docs): For container image storage.
    *   [Terraform](https://www.terraform.io/docs): For Infrastructure as Code.
*   **Nx Monorepo:** For managing multiple applications and libraries within a single repository.
    *   [Nx Documentation](https://nx.dev/getting-started/intro)
*   **TypeScript:** Primary programming language for backend and frontend.
    *   [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
    *   Node.js: v18.x LTS (refer to `.nvmrc` for specific version).
    *   [Node.js Documentation](https://nodejs.org/docs/)
*   **PNPM:** Preferred package manager for efficiency in monorepos.
    *   [PNPM Documentation](https://pnpm.io/documentation)
*   **Frontend (Web Dashboard):** React.js.
    *   [React Documentation](https://react.dev/learn)

## Project Structure

The project follows an Nx monorepo structure, organizing code into distinct `apps/` and `libs/` directories.

*   `apps/`: Contains independent applications/microservices.
    *   `api/`: REST API services for data ingestion and management.
    *   `web/`: Web dashboard application (e.g., React-based).
    *   `mobile/`: Mobile application (if applicable).
    *   `agents/`: AI agents for data processing and automation.
*   `libs/`: Contains shared libraries and utilities used across applications.
    *   `gcp/`: Google Cloud Platform client integrations and helpers.
    *   `data-models/`: Shared data models and interfaces.
    *   `analytics/`: Utilities for analytics processing.
    *   `auth/`: Authentication and authorization logic.
    *   `vietnamese-localization/`: Components and utilities for Vietnamese language and cultural adaptations.
*   `docs/`: Comprehensive project documentation, architectural diagrams, and guides.
*   `infra/`: Terraform configurations for deploying GCP infrastructure.
*   `tests/`: End-to-end (E2E) and integration tests that span multiple services.
*   `.github/`: GitHub-specific configurations, including Copilot instructions and workflows.
*   `.codacy/`: Codacy static analysis configurations.

## Coding Style & Conventions

Adherence to consistent coding standards ensures readability, maintainability, and quality across the codebase.

*   **General Style:** Automated formatting is enforced using Prettier (`.prettierrc`) and linting with ESLint (`.eslintrc.json`). Ensure these tools are correctly configured and run before committing code.
*   **Language-Specific Guidelines:**
    *   **TypeScript/Node.js:**
        *   All asynchronous operations must use `async/await` for better readability and error handling.
        *   Prioritize immutability where possible.
        *   Ensure robust error handling for all API interactions and critical business logic.
    *   **React (if applicable):**
        *   Always use functional components and React Hooks for state management and side effects.
        *   Prefer composition over inheritance.
*   **Naming Conventions:**
    *   Use `camelCase` for attribute names (`menuItemId`, `itemName`).
    *   Use `PascalCase` for entity names (`MenuItem`, `CustomerOrder`).
    *   All internal IDs should be prefixed with `DDS-` (e.g., `DDS-MENU-`, `DDS-ORDER-`).
    *   Vietnamese characters are allowed in names and descriptions where appropriate for localization, ensuring proper UTF-8 encoding.
*   **Comments & Documentation:**
    *   Write clear, concise comments for complex logic, public APIs, and any non-obvious code.
    *   Use JSDoc for documenting functions, classes, and types where applicable.
*   **`sudo` on Windows Developer Setting:**
    *   **Purpose:** This setting specifically provides elevated privileges to access directories or files that typical user permissions might restrict on Windows. It is primarily relevant when running commands that interact with the file system on a deeper level, especially in environments involving WSL (Windows Subsystem for Linux), Docker, or global Node.js/PNPM package installations.
    *   **When to Use:** You might encounter permission errors during local development operations like:
        *   Running `pnpm install` or `pnpm store prune` if the PNPM content-addressable store is located in a privileged directory or if there are conflicts with cached packages.
        *   Interacting with certain system-level development tools that expect wider file system access.
        *   Performing operations within Docker Desktop's shared drives that require elevated permissions.
    *   **Important Note:** Use `sudo` **only when explicitly necessary** and when encountering permission errors. Avoid its blanket use for all commands, as it can mask underlying configuration issues or pose security risks by granting unnecessary privileges to processes. Always understand what a command does before executing it with `sudo`.

## CI/CD Pipeline Overview

The project incorporates a robust Continuous Integration/Continuous Deployment (CI/CD) pipeline to automate the software delivery process. (Refer to [`docs/CI_CD_WORKFLOW.md`](docs/CI_CD_WORKFLOW.md) for more details).

1.  **Code Commit:** Changes pushed to the repository trigger automated workflows.
2.  **Static Analysis:** Codacy runs various code quality and security checks ([`.codacy.yml`](.codacy.yml)).
3.  **Automated Testing:** Unit, integration, and end-to-end tests are executed. Nx's `affected` commands are used to only build and test changed projects.
4.  **Build:** Container images are built for microservices and stored in Artifact Registry.
5.  **Deployment:** Built artifacts are deployed to respective GCP services (e.g., Cloud Run, Cloud Functions, GKE) in a progressive manner.
6.  **Monitoring:** Post-deployment, Cloud Monitoring and Logging ensure the health and performance of the deployed services.

## Important Do's and Don'ts

Follow these critical guidelines to maintain code quality, security, and project integrity:

*   **DO NOT** commit API keys, secrets, or sensitive configuration data directly into the repository. Use [Google Cloud Secret Manager](https://cloud.google.com/secret-manager) and adhere to the guidelines in [`docs/SECRETS.md`](docs/SECRETS.md).
*   **DO NOT** bypass CI/CD checks without explicit approval from a lead engineer.
*   **DO NOT** introduce breaking changes to data models, APIs, or interfaces without corresponding updates to all affected services and clear documentation.
*   **DO NOT** use hardcoded values for environment-specific configurations (e.g., database URLs, API endpoints). Use environment variables or Secret Manager.
*   **ALWAYS** write comprehensive unit tests for all new utility functions, components, and critical business logic. Aim for high test coverage.
*   **ALWAYS** ensure your code is linted and properly formatted before committing. Use `pnpm lint` and `pnpm format` commands.
*   **ALWAYS** adhere strictly to Vietnamese data privacy regulations (Personal Data Protection Law). Consult [`.kilocode/rules/vietnamese-compliance.md`](.kilocode/rules/vietnamese-compliance.md) for detailed requirements regarding data residency, consent, and subject rights.
*   **ALWAYS** review and approve pull requests thoroughly before merging.
*   **ALWAYS** consider the performance and cost implications of any new features or architectural changes, especially regarding GCP resource usage (`.kilocode/rules/google-cloud-optimization.md`). Optimize for efficiency and free-tier usage where possible.