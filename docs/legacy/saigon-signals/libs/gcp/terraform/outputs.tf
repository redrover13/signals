/**
 * @fileoverview This file defines the outputs of the Terraform configuration.
 * @description Outputs are used to expose information about the created
 *              resources. This is useful for referencing created resources
 *              in other parts of the infrastructure or for querying with
 *              the `terraform output` command.
 */
output "raw_bucket_name" {
  description = "The name of the raw data bucket."
  value       = google_storage_bucket.raw_bucket.name
}

output "processed_bucket_name" {
  description = "The name of the processed data bucket."
  value       = google_storage_bucket.processed_bucket.name
}
output "staging_dataset_id" {
  description = "The ID of the staging BigQuery dataset."
  value       = google_bigquery_dataset.staging_dataset.dataset_id
}

output "production_dataset_id" {
  description = "The ID of the production BigQuery dataset."
  value       = google_bigquery_dataset.production_dataset.dataset_id
}
output "sales_ingestion_topic_name" {
  description = "The name of the sales ingestion Pub/Sub topic."
  value       = google_pubsub_topic.sales_ingestion_topic.name
}