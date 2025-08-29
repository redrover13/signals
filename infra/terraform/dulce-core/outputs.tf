output "events_topic_name" {
  description = "Name of the events Pub/Sub topic"
  value       = google_pubsub_topic.events.name
}

output "agents_topic_name" {
  description = "Name of the agents Pub/Sub topic"
  value       = google_pubsub_topic.agents.name
}

output "dulce_dataset_id" {
  description = "ID of the dulce BigQuery dataset"
  value       = google_bigquery_dataset.dulce.dataset_id
}

output "events_table_id" {
  description = "ID of the events BigQuery table"
  value       = google_bigquery_table.events.table_id
}

output "agent_runs_table_id" {
  description = "ID of the agent_runs BigQuery table"
  value       = google_bigquery_table.agent_runs.table_id
}

output "agents_subscription_name" {
  description = "Name of the agents Pub/Sub subscription"
  value       = google_pubsub_subscription.agents_subscription.name
}

output "agent_runner_service_account" {
  description = "Email of the agent runner service account"
  value       = google_service_account.agent_runner.email
}

output "agent_runner_service_url" {
  description = "URL of the agent runner Cloud Run service"
  value       = google_cloud_run_v2_service.agent_runner.uri
}