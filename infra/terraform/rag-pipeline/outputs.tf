output "documents_bucket_name" {
  description = "Name of the bucket for storing documents"
  value       = google_storage_bucket.rag_documents.name
}

output "chunks_bucket_name" {
  description = "Name of the bucket for storing processed chunks"
  value       = google_storage_bucket.rag_chunks.name
}

output "search_engine_id" {
  description = "ID of the Vertex AI Search engine"
  value       = google_discovery_engine_search_engine.rag_search_engine.engine_id
}

output "datastore_id" {
  description = "ID of the Vertex AI Search data store"
  value       = google_discovery_engine_data_store.rag_datastore.data_store_id
}

output "processor_function_name" {
  description = "Name of the document processor Cloud Function"
  value       = google_cloudfunctions2_function.rag_processor.name
}

output "processing_topic_name" {
  description = "Name of the Pub/Sub topic for document processing"
  value       = google_pubsub_topic.rag_document_processing.name
}

output "service_account_email" {
  description = "Email of the RAG pipeline service account"
  value       = google_service_account.rag_pipeline_sa.email
}