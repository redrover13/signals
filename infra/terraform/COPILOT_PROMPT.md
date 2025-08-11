# Copilot Prompt: Infrastructure (Terraform)

## Purpose
This file provides Copilot and contributors with targeted context for the `infra/terraform` directory. It addresses common pain points and real project-specific quirks.

## Key Points
- **State Management:**
  - State files are not committed. Use remote state (see `backend` block in main.tf if present).
  - If you see state errors, check for lock files or backend misconfiguration.
- **Variable Files:**
  - Use `saigon-signals.auto.tfvars` for local development.
  - CI/CD pipelines may inject variables differently (see `cloudbuild.yaml`).
- **Provider Setup:**
  - GCP provider is configured for Workload Identity Federation (see `wif.tf`).
  - For local runs, ensure you have the correct gcloud credentials or use the setup scripts in `scripts/`.
- **Common Errors:**
  - Permission denied: check service account roles and secrets in `secrets.tf`.
  - Resource already exists: check for manual changes in the GCP console.
  - Plan/apply drift: always run `terraform plan` before `apply`.
- **Docs:**
  - See `docs/DEPLOYMENT.md` and `docs/TROUBLESHOOTING.md` for more.

---
*Update this file if infra workflows or pain points change.*
