# Pub/Sub topic for agent tasks
resource "google_pubsub_topic" "agents" {
  name = "dulce.agents"
}

# BigQuery table for agent runs
resource "google_bigquery_table" "agent_runs" {
  dataset_id = google_bigquery_dataset.dulce.dataset_id
  table_id   = "agent_runs"
  schema     = <<EOF
[
  {"name": "id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "ts", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "task", "type": "STRING", "mode": "NULLABLE"},
  {"name": "tools_used", "type": "STRING", "mode": "REPEATED"},
  {"name": "result", "type": "STRING", "mode": "NULLABLE"},
  {"name": "raw", "type": "JSON", "mode": "NULLABLE"}
]
EOF
}

# BigQuery table for raw data ingestion
resource "google_bigquery_table" "raw_data" {
  dataset_id = google_bigquery_dataset.dulce.dataset_id
  table_id   = "raw_data"
  schema     = <<EOF
[
  {"name": "id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "payload", "type": "JSON", "mode": "NULLABLE"}
]
EOF
}
