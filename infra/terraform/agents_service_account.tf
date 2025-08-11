# Service account for agents Cloud Run service
resource "google_service_account" "agents_sa" {
  account_id   = "dulce-agents-sa"
  display_name = "Dulce Agents Service Account"
}

# Grant Pub/Sub Subscriber on dulce.agents topic
resource "google_pubsub_subscription" "agents_sub" {
  name  = "dulce-agents-sub"
  topic = google_pubsub_topic.agents.name
}

resource "google_project_iam_member" "agents_pubsub_subscriber" {
  project = var.gcp_project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.agents_sa.email}"
}

# Grant BigQuery Data Editor on agent_runs table
resource "google_bigquery_table_iam_member" "agents_bq_editor" {
  project    = var.gcp_project_id
  dataset_id = google_bigquery_dataset.dulce.dataset_id
  table_id   = google_bigquery_table.agent_runs.table_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.agents_sa.email}"
}

# Grant logging write permissions
resource "google_project_iam_member" "agents_logging" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.agents_sa.email}"
}