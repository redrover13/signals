# NOTE FOR LINTERS AND CODE ANALYSIS TOOLS

This document intentionally uses technical terms such as "monorepo", "Nx", and "pnpm" as they are standard and correct in the context of this repository. Please ignore suggestions to change these terms.
# Copilot Guidance for Signals Repository

This file is intended to help GitHub Copilot and other AI coding assistants provide better support, error handling, and debugging guidance for contributors working in the Signals monorepo (a single repository containing multiple projects, managed by Nx). It outlines conventions, troubleshooting steps, and workspace-specific context to improve the quality and relevance of Copilot's suggestions.

## 1. Workspace Overview

- **Monorepo**: A single repository containing multiple projects, managed by **Nx** (see `nx.json`, `workspace.json`).
- **Nx**: A powerful build system and monorepo manager for JavaScript/TypeScript projects.
- **Package manager:** [pnpm](https://pnpm.io/) (fast, disk-efficient package manager for Node.js)
- **Languages:** TypeScript (Node.js), some shell/batch scripts, SQL, Terraform
- **Apps:** `apps/agents`, `apps/api`, `apps/web/site`
- **Libs:** `libs/agents`, `libs/gcp`
- **Infra:** `infra/terraform` (Terraform for GCP)
- **Docs:** `docs/` (architecture, CI/CD, deployment, troubleshooting, etc.)

## 2. Copilot Usage Conventions

- **Always check for existing scripts and documentation** in `docs/` and `scripts/` before suggesting new solutions.

- **For Nx-related tasks:**
  - Use Nx CLI and generators when possible.
  - Reference Nx docs and project graph for dependencies and configuration.

- **For debugging:**
  - Suggest running `pnpm install` if dependency issues arise.
  - Use `nx run <project>:<target>` for builds, tests, and linting.
  - For TypeScript errors, check `tsconfig.json` and project references.
  - For infra issues, check `infra/terraform` and related docs.

- **For CI/CD:**
  - Reference `cloudbuild.yaml` and `STEP_BY_STEP_CI.md` for pipeline details.
  - Use `check-and-fix-wif.bat` and related scripts for Workload Identity Federation setup.

## 3. Error Handling & Debugging Guidance

- **Common error sources:**
  - Outdated dependencies: run `pnpm install`.
  - Nx project misconfiguration: check `nx.json`, `project.json`, and run `nx graph`.
  - TypeScript path or type errors: check `tsconfig.json` and imports.
  - Terraform errors: check `infra/terraform/*.tf` and `terraform plan` output.
  - CI failures: review logs in `cloudbuild.yaml` and referenced scripts.

- **Troubleshooting steps:**

  1. Reproduce locally using Nx and pnpm scripts.
  2. Check relevant documentation in `docs/`.
  3. Use verbose logging (`--verbose` for Nx, `-v` for Terraform).
  4. Search for error messages in the workspace and documentation.
  5. If stuck, consult `TROUBLESHOOTING.md` or escalate in project channels.

## 4. Copilot Prompting Tips

- When asking Copilot for help, specify:
  - The affected app/lib (e.g., `apps/api`)
  - The technology (e.g., Nx, Terraform, TypeScript)
  - The error message or log snippet
  - What you have already tried

- For new features, reference or update relevant guides in `docs/`.

## 5. Additional Resources

- See `docs/ARCHITECTURE.md` for high-level design
- See `docs/DEPLOYMENT.md` for deployment steps
- See `docs/TROUBLESHOOTING.md` for common issues
- See `docs/CRITICAL_IMPROVEMENTS.md` for known gaps

---

*This file is intended to be updated as the project evolves. Please keep it current to maximize the effectiveness of Copilot and other AI tools.*
