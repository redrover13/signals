# IAM permissions for MCP Service Account

resource "google_project_iam_member" "mcp_bigquery_editor" {
  project = var.gcp_project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "mcp_cloudsql_client" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "mcp_run_admin" {
  project = var.gcp_project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "mcp_secretmanager_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "mcp_aiplatform_user" {
  project = var.gcp_project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "mcp_bigquery_job_user" {
  project = var.gcp_project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}
