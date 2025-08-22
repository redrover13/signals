# MCP Google Tooling (Toolbox & Cloud Run)

This document explains how to configure and deploy two recommended MCP components for the Signals project:

- `toolbox` — Google `genai-toolbox` (MCP Toolbox for Databases)
- `cloudrun` — Cloud Run MCP deployment pattern (host any MCP server on Cloud Run)

Purpose: provide a minimal, secure, and reproducible pattern to expose database tools to MCP clients using WIF and Secret Manager.

Prerequisites
- GCP project configured and `WIF_PROVIDER` + `WIF_SERVICE_ACCOUNT` set in environment or Secret Manager.
- `gcloud` CLI installed and configured for the target project/region.
- Secrets stored in Secret Manager (API keys or service account keys only when strictly required).

Toolbox (genai-toolbox)
- Repo: https://github.com/googleapis/genai-toolbox
- What it does: Provides an MCP server that exposes curated database tools (BigQuery, AlloyDB, etc.) using a `tools.yaml` configuration.

Quick start (high-level):
1. Create a `tools.yaml` that defines the tools you want to expose (BigQuery, SQL adapters, etc.).
2. Build / run Toolbox locally for testing using a WIF-backed service account or local ADC.
3. Deploy Toolbox to Cloud Run for staging/production.

Security notes:
- Prefer Workload Identity Federation (WIF) with short-lived credentials.
- Store any required secrets (e.g., API tokens) in Secret Manager and reference by name in `mcp-servers.config.json` via `serverOverrides.<env>.<server>.auth.secretName`.
- Give the Toolbox service account the minimum IAM roles necessary (e.g., BigQuery Data Viewer / Job User for read-only queries).

Cloud Run MCP (deployment pattern)
- Repo: https://github.com/GoogleCloudPlatform/cloud-run-mcp
- What it does: Provides a pattern to host MCP servers on Cloud Run and best practices to deploy with IAM and environment variables.

Deployment summary:
1. Build and containerize the MCP server you will run (Toolbox or custom server).
2. Deploy to Cloud Run with `gcloud run deploy` and set `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_REGION` env vars.
3. Use IAM to grant the calling service account permission to invoke the Cloud Run service.

Example `serverOverrides` (add to `mcp-servers.config.json` under environment.serverOverrides)

Toolbox (staging example):

```
"toolbox": {
  "connection": {
    "endpoint": "https://toolbox-staging-<id>-a.run.app",
    "timeout": 30000
  },
  "auth": {
    "type": "wif",
    "serviceAccount": "${WIF_SERVICE_ACCOUNT}",
    "secretName": "toolbox-service-account-key-staging"
  },
  "options": {
    "toolsConfig": "gs://my-config-bucket/tools.yaml"
  }
}
```

Cloud Run (production example):

```
"cloudrun": {
  "connection": {
    "endpoint": "https://mcp-prod-<id>-a.run.app",
    "timeout": 30000
  },
  "auth": {
    "type": "wif",
    "serviceAccount": "${WIF_SERVICE_ACCOUNT}",
    "secretName": "cloudrun-invoker-sa-key-prod"
  }
}
```

Verification
- Use `/health` and `/ready` endpoints configured in our monitoring to verify the deployed service responds.
- Use a simple MCP client call to request a small tool operation (e.g., list datasets) to validate IAM and Toolbox configuration.

Next steps (optional)
- I can add the `serverOverrides` templates directly into `mcp-servers.config.json` for `development/staging/production` with placeholder secret names (I will not add actual secrets).
- I can attempt to deploy a local instance of Toolbox if you provide GCP credentials or allow me to run `gcloud` here.

Notes
- All sensitive credentials must live in Secret Manager and be referenced by secret name only. Do not embed keys in repository files.
