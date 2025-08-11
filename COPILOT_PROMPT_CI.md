# Copilot Prompt: CI/CD (Cloud Build)

## Purpose
This file provides Copilot and contributors with targeted context for CI/CD, especially Google Cloud Build and related scripts. It addresses real pain points and project-specific quirks.

## Key Points
- **Pipeline Definition:**
  - Main pipeline is defined in `cloudbuild.yaml`.
  - Step-by-step instructions in `STEP_BY_STEP_CI.md`.
- **Workload Identity Federation (WIF):**
  - Setup and troubleshooting scripts: `check-and-fix-wif.bat`, `fix-wif-windows.ps1`, `setup-wif-local.bat`.
  - See `docs/WIF_SETUP_GUIDE.md` for details.
- **Secrets & Service Accounts:**
  - Managed via Terraform (`infra/terraform/secrets.tf`).
  - Ensure secrets are available in Cloud Build environment.
- **Common Errors:**
  - WIF auth failures: rerun setup scripts and check service account permissions.
  - Missing environment variables: check `cloudbuild.yaml` and referenced scripts.
  - CI step failures: see logs and referenced troubleshooting docs.
- **Docs:**
  - See `docs/STEP_BY_STEP_CI.md`, `docs/TROUBLESHOOTING.md`, and `docs/DEPLOYMENT.md`.

---
*Update this file if CI/CD workflows or pain points change.*
