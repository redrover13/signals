output "looker_service_account" {
  description = "The email of the Looker integration service account"
  value       = google_service_account.looker_sa.email
}

output "looker_exports_bucket" {
  description = "The name of the Looker exports bucket"
  value       = data.google_storage_bucket.looker_exports.name
}

output "looker_integration_url" {
  description = "The URL of the Looker integration function"
  value       = google_cloudfunctions2_function.looker_integration.service_config[0].uri
}

output "looker_events_topic" {
  description = "The name of the Looker events Pub/Sub topic"
  value       = google_pubsub_topic.looker_events.name
}

output "social_media_summary_view" {
  description = "The ID of the social media summary view"
  value       = google_bigquery_table.social_media_summary_view.table_id
}

output "customer_insights_view" {
  description = "The ID of the customer insights view"
  value       = google_bigquery_table.customer_insights_view.table_id
}