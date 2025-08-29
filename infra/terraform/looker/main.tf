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
    prefix = "looker"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "looker" {
  service = "looker.googleapis.com"
  
  disable_dependent_services = true
}

# Service account for Looker integration
resource "google_service_account" "looker_sa" {
  account_id   = "looker-integration-sa"
  display_name = "Looker Integration Service Account"
  description  = "Service account for Looker integration with BigQuery and other services"
}

# Grant necessary permissions to the service account
resource "google_project_iam_member" "looker_sa_bigquery_data_viewer" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.looker_sa.email}"
}

resource "google_project_iam_member" "looker_sa_bigquery_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.looker_sa.email}"
}

resource "google_project_iam_member" "looker_sa_storage_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.looker_sa.email}"
}

# Reference existing storage bucket for Looker exports
data "google_storage_bucket" "looker_exports" {
  name = "saigon-signals-data-exports"
}

# Secret Manager secrets for Looker API credentials
resource "google_secret_manager_secret" "looker_client_id" {
  secret_id = "looker-client-id"
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "looker_client_secret" {
  secret_id = "looker-client-secret"
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "looker_base_url" {
  secret_id = "looker-base-url"
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  replication {
    auto {}
  }
}

# Grant access to secrets for the service account
resource "google_secret_manager_secret_iam_member" "looker_client_id_access" {
  secret_id = google_secret_manager_secret.looker_client_id.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.looker_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "looker_client_secret_access" {
  secret_id = google_secret_manager_secret.looker_client_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.looker_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "looker_base_url_access" {
  secret_id = google_secret_manager_secret.looker_base_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.looker_sa.email}"
}

# Cloud Function for Looker integration
resource "google_cloudfunctions2_function" "looker_integration" {
  name     = "looker-integration"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = "saigon-signals-build-artifacts"
        object = "looker-integration-source.zip"
      }
    }
  }

  service_config {
    max_instance_count = 5
    min_instance_count = 0
    available_memory   = "512M"
    timeout_seconds    = 300
    
    environment_variables = {
      NODE_ENV = var.environment
      GCP_PROJECT_ID = var.project_id
      LOOKER_EXPORTS_BUCKET = data.google_storage_bucket.looker_exports.name
    }
    
    service_account_email = google_service_account.looker_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Cloud Scheduler for automated Looker reports
resource "google_cloud_scheduler_job" "daily_looker_reports" {
  name     = "daily-looker-reports"
  schedule = "0 6 * * *" # Daily at 6 AM
  time_zone = "UTC"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.looker_integration.service_config[0].uri
    
    body = base64encode(jsonencode({
      action = "generate_daily_reports"
      timestamp = "{{.timestamp}}"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = google_service_account.looker_sa.email
    }
  }
}

resource "google_cloud_scheduler_job" "weekly_looker_reports" {
  name     = "weekly-looker-reports"
  schedule = "0 8 * * 1" # Weekly on Monday at 8 AM
  time_zone = "UTC"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.looker_integration.service_config[0].uri
    
    body = base64encode(jsonencode({
      action = "generate_weekly_reports"
      timestamp = "{{.timestamp}}"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = google_service_account.looker_sa.email
    }
  }
}

# Pub/Sub topic for Looker events
resource "google_pubsub_topic" "looker_events" {
  name = "looker-events"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_pubsub_subscription" "looker_events_sub" {
  name  = "looker-events-sub"
  topic = google_pubsub_topic.looker_events.name

  ack_deadline_seconds = 300
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# BigQuery views for Looker (examples)
resource "google_bigquery_table" "social_media_summary_view" {
  dataset_id = "analytics"
  table_id   = "social_media_summary"

  view {
    query = <<EOF
SELECT 
  platform,
  DATE(created_at) as date,
  COUNT(*) as post_count,
  AVG(engagement_metrics.likes) as avg_likes,
  AVG(engagement_metrics.shares) as avg_shares,
  AVG(engagement_metrics.comments) as avg_comments
FROM `${var.project_id}.social_media.posts`
WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY platform, DATE(created_at)
ORDER BY date DESC, platform
EOF
    use_legacy_sql = false
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_bigquery_table" "customer_insights_view" {
  dataset_id = "analytics"
  table_id   = "customer_insights"

  view {
    query = <<EOF
SELECT 
  c.customer_id,
  c.preferences.language as preferred_language,
  c.preferences.communication_channel,
  COUNT(r.review_id) as review_count,
  AVG(r.rating) as avg_rating,
  AVG(r.sentiment_score) as avg_sentiment
FROM `${var.project_id}.crm.customers` c
LEFT JOIN `${var.project_id}.reviews.customer_reviews` r 
  ON c.customer_id = r.customer_id
GROUP BY 
  c.customer_id, 
  c.preferences.language, 
  c.preferences.communication_channel
HAVING review_count > 0
ORDER BY avg_rating DESC, review_count DESC
EOF
    use_legacy_sql = false
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}