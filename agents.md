# Dulce de Saigon F&B Data Platform - AI Assistant Guide

This document provides comprehensive instructions for AI assistants (GitHub Copilot, Claude, etc.) to ensure they provide maximum support when working with this codebase.

## Project Overview

The "Dulce de Saigon" project is a leading Food & Beverage (F&B) data platform for the Vietnamese market. Its "Memory Bank" centralizes all F&B data, including menus, pricing, customer preferences, and sales analytics. The platform is built on Google Cloud Platform (GCP) and emphasizes scalability, real-time analytics, and compliance with Vietnamese data privacy laws.

## Technical Stack

- **Cloud Provider:** Google Cloud Platform (GCP)
- **Infrastructure as Code:** Terraform
- **Monorepo Management:** Nx
- **Programming Language:** TypeScript (Node.js v18+)
- **Package Manager:** PNPM
- **Frontend:** Next.js (React)
- **CI/CD:** GitHub Actions, Nx Cloud

## Project Structure

- `apps/`: Independent applications (API, web, mobile, agents).
- `libs/`: Shared libraries (GCP clients, data models, auth, etc.).
- `docs/`: Project documentation.
- `infra/`: Terraform configurations.
- `tests/`: End-to-end and integration tests.
- `.github/`: GitHub configurations and workflows.

## Coding Standards

- **TypeScript:** Strict mode enabled, explicit return types required for functions
- **Formatting:** Enforced by Prettier and ESLint
- **Asynchronous Operations:** Use `async/await` with proper Promise typing
- **Immutability:** Prioritize where possible
- **Naming:** `camelCase` for attributes, `PascalCase` for entities, `DDS-` prefix for internal IDs
- **Comments:** Use JSDoc for all public APIs and complex logic

## Domain-Specific Guidelines

### Nx Integration Guidelines

When working with Nx in this workspace:

- Use the nx_workspace tool to understand workspace architecture
- For questions around nx configuration or best practices, use the nx_docs tool
- If encountering configuration or project graph errors, use nx_workspace to retrieve errors
- To visualize task dependencies, use nx_visualize_graph

#### When Generating Code with Nx

1. Learn about workspace specifics using nx_workspace and nx_project_details
2. Get available generators using nx_generators
3. Choose the appropriate generator or check nx_available_plugins if none seem relevant
4. Get generator details using nx_generator_schema
5. Use nx_docs to learn more about generators if needed
6. Keep options minimalistic and intentional
7. Open generator UI using nx_open_generate_ui
8. Read generator logs with nx_read_generator_log

#### When Running Nx Tasks

1. Get running tasks with nx_current_running_tasks_details
2. Get task output with nx_current_running_task_output if needed
3. To rerun a task, use `nx run <taskId>`
4. Don't rerun continuous tasks that are already running

#### For CI Pipeline Issues

1. Retrieve CI Pipeline Executions using nx_cloud_cipe_details
2. Get logs for failed tasks with nx_cloud_fix_cipe_failure
3. Fix issues based on task logs
4. Verify fixes by running the task passed to nx_cloud_fix_cipe_failure

### Codacy Integration Guidelines

#### After File Edits

- IMMEDIATELY run codacy_cli_analyze after any successful edit_file or reapply operation:
  - Set rootPath to workspace path
  - Set file to path of edited file
  - Leave tool empty or unset
- Fix any issues found in new edits

#### For Dependency Management

- After any package management operations (npm/yarn/pnpm install, adding dependencies), run:
  - codacy_cli_analyze with rootPath set to workspace path
  - Set tool to "trivy"
  - Leave file empty or unset
- Resolve any security vulnerabilities before continuing

#### If Codacy Tool Returns 404

- Offer to run codacy_setup_repository
- If accepted, run the tool and retry the failed action once

### TypeScript Strict Mode Guidelines

- All new code should be TypeScript strict mode compliant
- Use utility types from `/libs/utils/common-types/src/index.ts` for common patterns
- Avoid using `any` type; prefer `unknown` with type guards when necessary
- Use proper nullable types with `| null | undefined` when applicable
- For third-party libraries without type definitions, create custom type definitions in a `types.d.ts` file

### GCP Integration Guidelines

- Follow the principle of least privilege for all GCP service accounts
- Use environment variables for all GCP configuration
- Store sensitive credentials in Secret Manager
- Follow the project's logging standards for consistent monitoring
- Implement appropriate retry policies for GCP API calls

## Vietnamese Compliance Requirements

- All data storage must comply with Vietnamese data privacy regulations
- Personal data must be properly encrypted and anonymized
- Audit logs must be maintained for all data access
- Applications must support Vietnamese language for all user-facing components
- Follow Vietnamese tax reporting requirements for financial data

## Performance Guidelines

- Optimize for GCP cost efficiency
- Use appropriate caching strategies
- Implement proper indexing for database queries
- Consider serverless options where appropriate
- Use tree-shakable imports for frontend code (lodash-es instead of lodash)
- Implement proper code splitting for frontend applications

## Security Guidelines

- Follow OWASP security practices
- Implement proper input validation
- Use content security policies
- Implement rate limiting for API endpoints
- Use HTTPS for all communications
- Validate and sanitize all user inputs

## Required Practices

- **ALWAYS** write comprehensive unit tests
- **ALWAYS** adhere to Vietnamese data privacy regulations
- **ALWAYS** optimize for performance and cost on GCP
- **ALWAYS** provide proper typing for TypeScript code
- **ALWAYS** follow the established project structure
- **ALWAYS** check for and fix security vulnerabilities in dependencies

## Automated Workflow Support

The AI assistant should support the following workflows:

1. **PR Review Support:** Analyze pull requests for code quality, performance issues, and compliance with project guidelines
2. **Dependency Management:** Identify and fix security vulnerabilities in dependencies
3. **TypeScript Migration:** Help migrate JavaScript code to TypeScript with proper typing
4. **Performance Optimization:** Identify and fix performance bottlenecks
5. **Bug Investigation:** Help diagnose and fix bugs by analyzing logs and code
6. **Feature Implementation:** Assist in implementing new features according to project guidelines

## Technical Configuration Reference

### GitHub Copilot Configuration

GitHub Copilot is configured with:

- Firewall exceptions for Nx Cloud services via `.github/copilot/actions-setup-steps.yml`
- General agent settings via `.github/copilot-agent.yml`
- Domain-specific instructions in `.github/instructions/` (transitioning to this centralized document)

### Agent Maestro

Agent Maestro is a headless VS Code AI integration that works with the MCP servers in our project:

- **Configuration:** `.agent-maestro.json` and settings in `.vscode/settings.json`
- **Documentation:** See [AGENT_MAESTRO.md](docs/AGENT_MAESTRO.md) for setup and usage
- **Example Commands:** See [agent-maestro-examples.js](docs/agent-maestro-examples.js) for example prompts
- **Integration:** Works with our existing MCP servers (Codacy, Nx, etc.)
- **Requirements:** Requires environment variables for authentication tokens

### MCP Servers

The following Model Context Protocol (MCP) servers are configured:

- **Codacy:** Provides code quality analysis integration
- **Nx:** Provides Nx monorepo tooling integration
- **Gemini:** Acts as an orchestrator for the MCP protocol, coordinating various AI agents and tool interactions
- **Google genai-toolbox:** Deployed on Cloud Run, provides access to BigQuery, AlloyDB, and other database tools via MCP
- **Cloud Run MCP:** Hosting pattern for deploying custom MCP servers on Google Cloud Run

## Related Documentation

- [TYPESCRIPT_STRICT_GUIDELINES.md](docs/TYPESCRIPT_STRICT_GUIDELINES.md) - Comprehensive TypeScript guidelines
- [CI_CD_WORKFLOW.md](docs/CI_CD_WORKFLOW.md) - CI/CD pipeline documentation
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture documentation
- [DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md) - Deployment checklist

## Transition Notes

This document centralizes and enhances instructions previously scattered across:

- `.github/copilot-instructions.md`
- `.github/instructions/codacy.instructions.md`
- `.github/instructions/nx.instructions.md`

During the transition period, both this centralized document and the individual instruction files will be maintained. Eventually, the individual files will be deprecated in favor of this single source of truth.
