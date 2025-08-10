# Critical Infra & Automation Enhancements

1. **Workload Identity Federation for CI/CD**
   - Avoids storing service account keys in Cloud Build.
   - Terraform stub can be added in `infra/terraform/wif.tf`.

2. **Centralized Secret Manager Loader**
   - `libs/gcp` util to fetch secrets at runtime for all services.
   - Prevents hardcoded secrets in env files.

3. **Automated BigQuery Schema Validator**
   - Cloud Function triggered on table schema changes to validate against expected fields.

4. **Error Alerting via Cloud Monitoring**
   - Uptime checks for API and Web endpoints.
   - Pub/Sub subscription error alert policies.

5. **Backup & Export of Critical Tables**
   - Scheduled BigQuery export to GCS for `dulce.events` and `dulce.agent_runs`.
   - Retains 30-day rolling backups.
