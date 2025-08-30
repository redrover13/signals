output "documents_bucket_name" {
  description = "Name of the documents bucket"
  value       = google_storage_bucket.documents_bucket.name
}

output "chunks_bucket_name" {
  description = "Name of the chunks bucket"
  value       = google_storage_bucket.chunks_bucket.name
}

output "dataset_id" {
  description = "ID of the BigQuery dataset"
  value       = google_bigquery_dataset.rag_dataset.dataset_id
}

output "table_id" {
  description = "ID of the BigQuery table for document chunks"
  value       = google_bigquery_table.document_chunks.table_id
}

output "function_name" {
  description = "Name of the Cloud Function"
  value       = google_cloudfunctions_function.rag_document_processor.name
}

output "processing_topic_name" {
  description = "Name of the Pub/Sub topic for document processing"
  value       = google_pubsub_topic.rag_document_processing.name
}

output "service_account_email" {
  description = "Email of the service account"
  value       = google_service_account.rag_pipeline_sa.email
}
