terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Service Account for RAG Pipeline
resource "google_service_account" "rag_pipeline_sa" {
  account_id   = "rag-pipeline-sa"
  display_name = "RAG Pipeline Service Account"
  description  = "Service account for RAG pipeline operations"
}

# IAM roles for the service account
resource "google_project_iam_member" "rag_sa_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

resource "google_project_iam_member" "rag_sa_bigquery_user" {
  project = var.project_id
  role    = "roles/bigquery.user"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

resource "google_project_iam_member" "rag_sa_bigquery_data_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

resource "google_project_iam_member" "rag_sa_functions_admin" {
  project = var.project_id
  role    = "roles/cloudfunctions.admin"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

resource "google_project_iam_member" "rag_sa_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}

# Cloud Storage Buckets
resource "google_storage_bucket" "documents_bucket" {
  name          = "${var.project_id}-rag-documents"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket" "chunks_bucket" {
  name          = "${var.project_id}-rag-chunks"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# BigQuery dataset for storing document chunks and metadata
resource "google_bigquery_dataset" "rag_dataset" {
  dataset_id    = "rag_dataset"
  friendly_name = "RAG Pipeline Dataset"
  description   = "Dataset for storing RAG pipeline data"
  location      = var.region

  labels = {
    environment = "production"
  }
}

# BigQuery table for document chunks
resource "google_bigquery_table" "document_chunks" {
  dataset_id = google_bigquery_dataset.rag_dataset.dataset_id
  table_id   = "document_chunks"

  schema = <<EOF
[
  {
    "name": "document_id",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Unique identifier for the document"
  },
  {
    "name": "chunk_id",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Unique identifier for the chunk"
  },
  {
    "name": "content",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Text content of the chunk"
  },
  {
    "name": "metadata",
    "type": "JSON",
    "mode": "NULLABLE",
    "description": "Additional metadata for the chunk"
  },
  {
    "name": "created_at",
    "type": "TIMESTAMP",
    "mode": "REQUIRED",
    "description": "Timestamp when the chunk was created"
  }
]
EOF

  clustering = ["document_id"]
  labels = {
    environment = "production"
  }
}

# Pub/Sub Topic for document processing
resource "google_pubsub_topic" "rag_document_processing" {
  name                       = "rag-document-processing"
  message_retention_duration = "86400s"  # 24 hours
}

# Cloud Function for document processing
resource "google_cloudfunctions_function" "rag_document_processor" {
  name                  = "rag-document-processor"
  description           = "Processes documents for RAG pipeline"
  runtime               = "nodejs18"
  available_memory_mb   = 1024
  source_archive_bucket = google_storage_bucket.documents_bucket.name
  source_archive_object = google_storage_bucket_object.function_source.name
  trigger_http          = true
  entry_point           = "processDocument"
  service_account_email = google_service_account.rag_pipeline_sa.email

  environment_variables = {
    DOCUMENTS_BUCKET = google_storage_bucket.documents_bucket.name
    CHUNKS_BUCKET    = google_storage_bucket.chunks_bucket.name
    DATASET_ID       = google_bigquery_dataset.rag_dataset.dataset_id
    TABLE_ID         = google_bigquery_table.document_chunks.table_id
    PROJECT_ID       = var.project_id
    REGION           = var.region
  }

  depends_on = [
    google_storage_bucket_object.function_source,
    google_project_iam_member.rag_sa_storage_admin,
    google_project_iam_member.rag_sa_functions_admin,
    google_project_iam_member.rag_sa_bigquery_user,
    google_project_iam_member.rag_sa_bigquery_data_editor
  ]
}

# Cloud Function source code (placeholder - will be uploaded separately)
resource "google_storage_bucket_object" "function_source" {
  name   = "function-source.zip"
  bucket = google_storage_bucket.documents_bucket.name
  source = "/home/g_nelson/signals-1/apps/cloud-functions/rag-processor/function-source.zip"
}

# IAM for Cloud Function to be invoked via HTTP
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = var.project_id
  region         = var.region
  cloud_function = google_cloudfunctions_function.rag_document_processor.name
  role           = "roles/cloudfunctions.invoker"
  member         = "serviceAccount:${google_service_account.rag_pipeline_sa.email}"
}
