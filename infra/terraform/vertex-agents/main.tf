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
    prefix = "vertex-agents"
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

resource "google_project_service" "storage" {
  service = "storage.googleapis.com"
  
  disable_dependent_services = true
}

resource "google_project_service" "secretmanager" {
  service = "secretmanager.googleapis.com"
  
  disable_dependent_services = true
}

# Reference existing service account for Vertex AI agents
data "google_service_account" "vertex_agents_sa" {
  account_id = "vertex-agents"
}

# Additional permissions for the existing service account (if needed)
resource "google_project_iam_member" "vertex_sa_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${data.google_service_account.vertex_agents_sa.email}"
}

resource "google_project_iam_member" "vertex_sa_secretmanager" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${data.google_service_account.vertex_agents_sa.email}"
}

# Cloud Storage bucket for agent artifacts
resource "google_storage_bucket" "agent_artifacts" {
  name     = "${var.project_id}-agent-artifacts"
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

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# New: Dedicated Vertex AI Endpoint for Gemini Orchestration
resource "google_vertex_ai_endpoint" "gemini_endpoint" {
  name         = "gemini-orchestrator-endpoint"
  location     = var.region
  display_name = "Gemini Orchestrator Endpoint"

  network = "projects/${var.project_id}/global/networks/default"  # Optional: Attach to VPC if needed

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  depends_on = [google_storage_bucket.agent_artifacts]
}

# Vertex AI Model Registry for custom models (if needed)
resource "google_vertex_ai_model" "gemini_orchestrator" {
  count = var.enable_custom_models ? 1 : 0
  
  display_name = "gemini-orchestrator"
  description  = "Custom Gemini orchestrator model for agent coordination"
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
  
  # This would typically reference a trained model artifact
  # artifact_uri = "gs://${google_storage_bucket.agent_artifacts.name}/models/gemini-orchestrator"
}

# Vertex AI Endpoint for model serving
resource "google_vertex_ai_endpoint" "agent_endpoint" {
  count = var.enable_custom_models ? 1 : 0
  
  display_name = "agent-endpoint"
  description  = "Endpoint for serving AI agents"
  location     = var.region
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Cloud Functions for agent orchestration
resource "google_cloudfunctions2_function" "gemini_orchestrator" {
  name     = "gemini-orchestrator"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = "saigon-signals-build-artifacts"
        object = "gemini-orchestrator-source.zip"
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
      VERTEX_AI_LOCATION = var.region
      GEMINI_ENDPOINT_ID = google_vertex_ai_endpoint.gemini_endpoint.name  # New: Reference the Gemini endpoint
    }
    
    service_account_email = data.google_service_account.vertex_agents_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# BQ Agent Cloud Function
resource "google_cloudfunctions2_function" "bq_agent" {
  name     = "bq-agent"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = "saigon-signals-build-artifacts"
        object = "bq-agent-source.zip"
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
    }
    
    service_account_email = data.google_service_account.vertex_agents_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Looker Agent Cloud Function
resource "google_cloudfunctions2_function" "looker_agent" {
  name     = "looker-agent"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = "saigon-signals-build-artifacts"
        object = "looker-agent-source.zip"
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
    }
    
    service_account_email = data.google_service_account.vertex_agents_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# CRM Agent Cloud Function
resource "google_cloudfunctions2_function" "crm_agent" {
  name     = "crm-agent"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = "saigon-signals-build-artifacts"
        object = "crm-agent-source.zip"
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
    }
    
    service_account_email = data.google_service_account.vertex_agents_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Content Agent Cloud Function
resource "google_cloudfunctions2_function" "content_agent" {
  name     = "content-agent"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = "saigon-signals-build-artifacts"
        object = "content-agent-source.zip"
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
    }
    
    service_account_email = data.google_service_account.vertex_agents_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Reviews Agent Cloud Function
resource "google_cloudfunctions2_function" "reviews_agent" {
  name     = "reviews-agent"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = "saigon-signals-build-artifacts"
        object = "reviews-agent-source.zip"
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
    }
    
    service_account_email = data.google_service_account.vertex_agents_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Pub/Sub topics for agent communication
resource "google_pubsub_topic" "agent_orchestration" {
  name = "agent-orchestration"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_pubsub_subscription" "agent_orchestration_sub" {
  name  = "agent-orchestration-sub"
  topic = google_pubsub_topic.agent_orchestration.name

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

# Cloud Scheduler for periodic agent tasks
resource "google_cloud_scheduler_job" "daily_analytics" {
  name     = "daily-analytics-job"
  schedule = "0 2 * * *" # Daily at 2 AM
  time_zone = "UTC"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.gemini_orchestrator.service_config[0].uri
    
    body = base64encode(jsonencode({
      task = "daily_analytics"
      timestamp = "{{.timestamp}}"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = data.google_service_account.vertex_agents_sa.email
    }
  }
}
