terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
    # The bucket name should be provided via a backend configuration file or CLI argument,
    # and should be parameterized to include the project_id to avoid conflicts.
    # Example: bucket = "<your-project-id>-terraform-state"
    prefix = "rag-pipeline"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "aiplatform" {
  service = "aiplatform.googleapis.com"
  
  disable_dependent_services = true
}

resource "google_project_service" "discoveryengine" {
  service = "discoveryengine.googleapis.com"
  
  disable_dependent_services = true
}

resource "google_project_service" "storage" {
  service = "storage.googleapis.com"
  
  disable_dependent_services = true
}

resource "google_project_service" "cloudfunctions" {
  service = "cloudfunctions.googleapis.com"
  
  disable_dependent_services = true
}

resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
  
  disable_dependent_services = true
}

# Storage bucket for documents
resource "google_storage_bucket" "rag_documents" {
  name          = "${var.project_id}-rag-documents"
  location      = var.region
  storage_class = "STANDARD"
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "rag-documents"
    managed_by  = "terraform"
  }
}

# Storage bucket for processed chunks
resource "google_storage_bucket" "rag_chunks" {
  name          = "${var.project_id}-rag-chunks"
  location      = var.region
  storage_class = "STANDARD"
  
  uniform_bucket_level_access = true
  
  labels = {
    environment = var.environment
    purpose     = "rag-chunks"
    managed_by  = "terraform"
  }
}

# Vertex AI Search data store
resource "google_discovery_engine_data_store" "rag_datastore" {
  location         = var.region
  data_store_id    = "rag-documents-${var.environment}"
  display_name     = "RAG Documents Data Store"
  industry_vertical = "GENERIC"
  content_config   = "CONTENT_REQUIRED"
  solution_types   = ["SOLUTION_TYPE_SEARCH"]
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Vertex AI Search engine
resource "google_discovery_engine_search_engine" "rag_search_engine" {
  engine_id    = "rag-search-engine-${var.environment}"
  location     = var.region
  display_name = "RAG Search Engine"
  
  data_store_ids = [google_discovery_engine_data_store.rag_datastore.data_store_id]
  
  search_engine_config {
    search_tier = "SEARCH_TIER_STANDARD"
    search_add_ons = ["SEARCH_ADD_ON_LLM"]
  }
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Service account for RAG pipeline
resource "google_service_account" "rag_pipeline_sa" {
  account_id   = "rag-pipeline-${var.environment}"
  display_name = "RAG Pipeline Service Account"
  description  = "Service account for RAG document processing pipeline"
}

# IAM bindings for the service account
resource "google_project_iam_member" "rag_pipeline_aiplatform" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

resource "google_project_iam_member" "rag_pipeline_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

resource "google_project_iam_member" "rag_pipeline_discoveryengine" {
  project = var.project_id
  role    = "roles/discoveryengine.editor"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

# Cloud Function source bucket
resource "google_storage_bucket" "rag_function_source" {
  name          = "${var.project_id}-rag-function-source"
  location      = var.region
  storage_class = "STANDARD"
  
  uniform_bucket_level_access = true
  
  labels = {
    environment = var.environment
    purpose     = "cloud-function-source"
    managed_by  = "terraform"
  }
}

# Pub/Sub topic for document processing
resource "google_pubsub_topic" "rag_document_processing" {
  name = "rag-document-processing-${var.environment}"
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Pub/Sub subscription for document processing
resource "google_pubsub_subscription" "rag_document_processing" {
  name  = "rag-document-processing-sub-${var.environment}"
  topic = google_pubsub_topic.rag_document_processing.name
  
  ack_deadline_seconds = 600
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Cloud Function for document processing
resource "google_cloudfunctions2_function" "rag_processor" {
  name     = "rag-document-processor-${var.environment}"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "processDocument"
    
    environment_variables = {
      NODE_ENV = var.environment
    }
    
    source {
      storage_source {
        bucket = google_storage_bucket.rag_function_source.name
        object = "rag-processor-source.zip"
      }
    }
  }
  
  service_config {
    max_instance_count = 10
    min_instance_count = 0
    available_memory   = "1Gi"
    timeout_seconds    = 540
    
    environment_variables = {
      PROJECT_ID           = var.project_id
      REGION              = var.region
      DOCUMENTS_BUCKET    = google_storage_bucket.rag_documents.name
      CHUNKS_BUCKET       = google_storage_bucket.rag_chunks.name
      SEARCH_ENGINE_ID    = google_discovery_engine_search_engine.rag_search_engine.engine_id
      DATASTORE_ID        = google_discovery_engine_data_store.rag_datastore.data_store_id
    }
    
    service_account_email = google_service_account.rag_pipeline_sa.email
  }
  
  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.rag_document_processing.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
  
  depends_on = [
    google_project_service.cloudfunctions,
    google_project_service.cloudbuild
  ]
}

# Storage notification for automatic processing
resource "google_storage_notification" "rag_document_upload" {
  bucket         = google_storage_bucket.rag_documents.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.rag_document_processing.id
  event_types    = ["OBJECT_FINALIZE"]
  
  depends_on = [google_pubsub_topic_iam_member.rag_storage_publisher]
}

# IAM for storage to publish to Pub/Sub
data "google_storage_project_service_account" "gcs_account" {
}

resource "google_pubsub_topic_iam_member" "rag_storage_publisher" {
  topic  = google_pubsub_topic.rag_document_processing.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${data.google_storage_project_service_account.gcs_account.email_address}"
}