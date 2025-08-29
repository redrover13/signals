terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "saigon-signals-terraform-state"
    prefix = "core-infrastructure"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "bigquery.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "aiplatform.googleapis.com",
    "pubsub.googleapis.com",
    "cloudscheduler.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com"
  ])
  
  service = each.value
  disable_dependent_services = true
}

# ============================================================================
# SERVICE ACCOUNTS
# ============================================================================

# Main API service account
resource "google_service_account" "api_service_account" {
  account_id   = "dulce-api-sa"
  display_name = "Dulce API Service Account"
  description  = "Service account for Dulce de Saigon API services"
}

# Vertex AI agents service account
resource "google_service_account" "vertex_agents_sa" {
  account_id   = "vertex-agents"
  display_name = "Vertex AI Agents Service Account"
  description  = "Service account for Vertex AI agents and orchestration"
}

# Data processing service account
resource "google_service_account" "data_processing_sa" {
  account_id   = "data-processing-sa"
  display_name = "Data Processing Service Account"
  description  = "Service account for data processing and ETL operations"
}

# GitHub Actions service account (conditional)
resource "google_service_account" "github_actions_sa" {
  count = var.create_github_sa ? 1 : 0
  
  account_id   = "github-actions-sa"
  display_name = "GitHub Actions Service Account"
  description  = "Service account for GitHub Actions CI/CD"
}

# ============================================================================
# IAM PERMISSIONS
# ============================================================================

# API service account permissions
resource "google_project_iam_member" "api_sa_permissions" {
  for_each = toset([
    "roles/bigquery.user",
    "roles/bigquery.dataEditor",
    "roles/storage.objectViewer",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.api_service_account.email}"
}

# Vertex AI agents service account permissions
resource "google_project_iam_member" "vertex_sa_permissions" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/storage.objectViewer",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber",
    "roles/bigquery.user",
    "roles/bigquery.dataEditor",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.vertex_agents_sa.email}"
}

# Data processing service account permissions
resource "google_project_iam_member" "data_processing_sa_permissions" {
  for_each = toset([
    "roles/bigquery.admin",
    "roles/storage.admin",
    "roles/pubsub.admin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.data_processing_sa.email}"
}

# GitHub Actions service account permissions (conditional)
resource "google_project_iam_member" "github_actions_permissions" {
  for_each = var.create_github_sa ? toset([
    "roles/cloudfunctions.admin",
    "roles/run.admin",
    "roles/storage.admin",
    "roles/bigquery.admin",
    "roles/secretmanager.admin",
    "roles/aiplatform.admin",
    "roles/pubsub.admin",
    "roles/cloudscheduler.admin",
    "roles/iam.serviceAccountUser",
    "roles/cloudbuild.builds.editor",
    "roles/monitoring.editor",
    "roles/logging.admin"
  ]) : toset([])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_actions_sa[0].email}"
}

# ============================================================================
# STORAGE BUCKETS
# ============================================================================

# Main storage bucket for application data
resource "google_storage_bucket" "app_data" {
  name     = "${var.project_id}-app-data"
  location = var.region

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

  lifecycle_rule {
    condition {
      age                = 30
      matches_storage_class = ["STANDARD"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "app-data"
  }
}

# Build artifacts storage bucket
resource "google_storage_bucket" "build_artifacts" {
  name     = "${var.project_id}-build-artifacts"
  location = var.region

  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "build-artifacts"
  }
}

# Data backup storage bucket
resource "google_storage_bucket" "data_backup" {
  name     = "${var.project_id}-data-backup"
  location = var.region
  storage_class = "COLDLINE"

  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "data-backup"
  }
}

# Terraform state storage bucket (reference existing)
data "google_storage_bucket" "terraform_state" {
  name = "saigon-signals-terraform-state"
}

# ============================================================================
# PUB/SUB TOPICS AND SUBSCRIPTIONS
# ============================================================================

# Main events topic
resource "google_pubsub_topic" "main_events" {
  name = "dulce-main-events"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "main-events"
  }

  message_retention_duration = "86400s" # 24 hours
}

# Agent orchestration topic
resource "google_pubsub_topic" "agent_orchestration" {
  name = "agent-orchestration"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "agent-orchestration"
  }

  message_retention_duration = "3600s" # 1 hour
}

# Data processing topic
resource "google_pubsub_topic" "data_processing" {
  name = "data-processing"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "data-processing"
  }

  message_retention_duration = "86400s" # 24 hours
}

# Dead letter topic
resource "google_pubsub_topic" "dead_letter" {
  name = "dead-letter-queue"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "dead-letter"
  }

  message_retention_duration = "604800s" # 7 days
}

# Main events subscription
resource "google_pubsub_subscription" "main_events_sub" {
  name  = "main-events-subscription"
  topic = google_pubsub_topic.main_events.name

  ack_deadline_seconds = 300

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Agent orchestration subscription
resource "google_pubsub_subscription" "agent_orchestration_sub" {
  name  = "agent-orchestration-subscription"
  topic = google_pubsub_topic.agent_orchestration.name

  ack_deadline_seconds = 180

  retry_policy {
    minimum_backoff = "5s"
    maximum_backoff = "300s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 3
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Data processing subscription
resource "google_pubsub_subscription" "data_processing_sub" {
  name  = "data-processing-subscription"
  topic = google_pubsub_topic.data_processing.name

  ack_deadline_seconds = 600

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# ============================================================================
# BIGQUERY DATASETS AND TABLES
# ============================================================================

# Analytics dataset
resource "google_bigquery_dataset" "analytics" {
  dataset_id                  = "analytics"
  friendly_name              = "Analytics Dataset"
  description                = "Core analytics data for the Dulce de Saigon platform"
  location                   = var.region
  default_table_expiration_ms = var.table_expiration_days * 24 * 60 * 60 * 1000

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }

  access {
    role   = "WRITER"
    special_group = "projectWriters"
  }
}

# Social media dataset
resource "google_bigquery_dataset" "social_media" {
  dataset_id                  = "social_media"
  friendly_name              = "Social Media Dataset"
  description                = "Social media analytics and engagement data"
  location                   = var.region
  default_table_expiration_ms = var.table_expiration_days * 24 * 60 * 60 * 1000

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }
}

# CRM dataset
resource "google_bigquery_dataset" "crm" {
  dataset_id                  = "crm"
  friendly_name              = "CRM Dataset"
  description                = "Customer relationship management data"
  location                   = var.region
  default_table_expiration_ms = var.table_expiration_days * 24 * 60 * 60 * 1000

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }
}

# Reviews dataset
resource "google_bigquery_dataset" "reviews" {
  dataset_id                  = "reviews"
  friendly_name              = "Reviews Dataset"
  description                = "Customer reviews and sentiment analysis data"
  location                   = var.region
  default_table_expiration_ms = var.table_expiration_days * 24 * 60 * 60 * 1000

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }
}

# Events table in analytics dataset
resource "google_bigquery_table" "events" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "events"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "event_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "event_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "user_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "session_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "properties"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "source"
      type = "STRING"
      mode = "REQUIRED"
    }
  ])

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  clustering = ["event_type", "source"]
}

# Users table in analytics dataset
resource "google_bigquery_table" "users" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "users"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "user_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "email"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "properties"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])
}

# Social media posts table
resource "google_bigquery_table" "social_posts" {
  dataset_id = google_bigquery_dataset.social_media.dataset_id
  table_id   = "posts"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "post_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "platform"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "content"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "engagement_metrics"
      type = "RECORD"
      mode = "NULLABLE"
      fields = [
        {
          name = "likes"
          type = "INTEGER"
          mode = "NULLABLE"
        },
        {
          name = "shares"
          type = "INTEGER"
          mode = "NULLABLE"
        },
        {
          name = "comments"
          type = "INTEGER"
          mode = "NULLABLE"
        },
        {
          name = "reach"
          type = "INTEGER"
          mode = "NULLABLE"
        }
      ]
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  clustering = ["platform"]
}

# Customer reviews table
resource "google_bigquery_table" "customer_reviews" {
  dataset_id = google_bigquery_dataset.reviews.dataset_id
  table_id   = "customer_reviews"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "review_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "customer_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "rating"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "review_text"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "sentiment_score"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "sentiment_label"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "source"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  clustering = ["source", "sentiment_label"]
}

# Customers table in CRM dataset
resource "google_bigquery_table" "customers" {
  dataset_id = google_bigquery_dataset.crm.dataset_id
  table_id   = "customers"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "customer_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "email"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "phone"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "preferences"
      type = "RECORD"
      mode = "NULLABLE"
      fields = [
        {
          name = "language"
          type = "STRING"
          mode = "NULLABLE"
        },
        {
          name = "communication_channel"
          type = "STRING"
          mode = "NULLABLE"
        },
        {
          name = "marketing_consent"
          type = "BOOLEAN"
          mode = "NULLABLE"
        }
      ]
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])
}

# ============================================================================
# SECRET MANAGER SECRETS
# ============================================================================

# Database connection string
resource "google_secret_manager_secret" "db_connection" {
  secret_id = "database-connection-string"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  replication {
    auto {}
  }
}

# API keys storage
resource "google_secret_manager_secret" "api_keys" {
  secret_id = "external-api-keys"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  replication {
    auto {}
  }
}

# Social media API credentials
resource "google_secret_manager_secret" "social_media_credentials" {
  secret_id = "social-media-api-credentials"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  replication {
    auto {}
  }
}

# ============================================================================
# MONITORING AND ALERTING
# ============================================================================

# Log-based metric for error tracking
resource "google_logging_metric" "error_count" {
  name   = "error_count"
  filter = "severity>=ERROR"
  
  metric_descriptor {
    metric_kind = "GAUGE"
    value_type  = "INT64"
    display_name = "Error Count"
  }

  label_extractors = {
    "service" = "EXTRACT(resource.labels.service_name)"
  }
}

# Uptime check for main API endpoint
resource "google_monitoring_uptime_check_config" "api_uptime_check" {
  display_name = "API Uptime Check"
  timeout      = "10s"
  period       = "300s"

  http_check {
    path         = "/health"
    port         = "443"
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "${var.project_id}.run.app"
    }
  }

  content_matchers {
    content = "healthy"
    matcher = "CONTAINS_STRING"
  }
}