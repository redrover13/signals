# Qodo AI Assistant - Enhanced Project Instructions

This document provides comprehensive instructions for the Qodo AI assistant to ensure it provides maximum support and leverages the full potential of the configured MCP servers for the "Dulce de Saigon" F&B Data Platform.

## 1. About This Project

The "Dulce de Saigon" project is a leading Food & Beverage (F&B) data platform for the Vietnamese market. Its "Memory Bank" centralizes all F&B data, including menus, pricing, customer preferences, and sales analytics. The platform is built on Google Cloud Platform (GCP) and emphasizes scalability, real-time analytics, and compliance with Vietnamese data privacy laws.

## 2. Core Technologies & Frameworks

- **Cloud Provider:** Google Cloud Platform (GCP)
- **Infrastructure as Code:** Terraform
- **Monorepo Management:** Nx
- **Programming Language:** TypeScript (Node.js v18+)
- **Package Manager:** PNPM
- **Frontend:** Next.js (React)
- **CI/CD:** GitHub Actions, Nx Cloud

## 3. Project Structure

- `apps/`: Independent applications (API, web, mobile, agents).
- `libs/`: Shared libraries (GCP clients, data models, auth, etc.).
- `docs/`: Project documentation.
- `infra/`: Terraform configurations.
- `tests/`: End-to-end and integration tests.
- `.github/`: GitHub configurations, including these instructions.

## 4. Coding Style & Conventions

- **Formatting:** Enforced by Prettier and ESLint.
- **Asynchronous Operations:** Use `async/await`.
- **Immutability:** Prioritize where possible.
- **Naming:** `camelCase` for attributes, `PascalCase` for entities, `DDS-` prefix for internal IDs.
- **Comments:** Use JSDoc for all public APIs and complex logic.

## 5. MCP Server Integration: Guidelines for Qodo

Note: The set of available MCP servers varies by environment and repository configuration. Use these guidelines for supported servers only.

- Current availability and setup instructions: see docs/mcp/INDEX.md
- To request or add a new MCP server: open an issue using the "MCP Server Request" template and link proposed provisioning/config files.

The following guidance describes how to use commonly supported servers when they are available.
## 6. Important Do's and Don'ts

- **DO NOT** commit secrets. Use Google Cloud Secret Manager.
- **DO NOT** use placeholder or sample secrets in code or docs (e.g., "secret123"); use environment references and redacted examples.
- **ALWAYS** ensure logs and error messages do not contain secrets or PII; scrub before persisting.
- **ALWAYS** rotate credentials immediately upon suspected exposure and update Secret Manager versions accordingly.
- **ALWAYS** write comprehensive unit tests.
- **ALWAYS** adhere to Vietnamese data privacy regulations.
- **ALWAYS** optimize for performance and cost on GCP.