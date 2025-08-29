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
    prefix = "dulce-core"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "pubsub.googleapis.com",
    "bigquery.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "aiplatform.googleapis.com"
  ])
  
  service = each.value
  disable_dependent_services = true
}

# Pub/Sub topics for the agent bus
resource "google_pubsub_topic" "events" {
  name = "dulce.events"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "analytics-events"
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_pubsub_topic" "agents" {
  name = "dulce.agents"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "agent-tasks"
  }

  depends_on = [google_project_service.required_apis]
}

# BigQuery dataset for dulce data
resource "google_bigquery_dataset" "dulce" {
  dataset_id                  = "dulce"
  friendly_name              = "Dulce de Saigon Data Platform"
  description                = "Core dataset for analytics events and agent runs"
  location                   = var.bq_location

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    project     = "dulce-de-saigon"
  }

  depends_on = [google_project_service.required_apis]
}

# Events table for analytics data
resource "google_bigquery_table" "events" {
  dataset_id = google_bigquery_dataset.dulce.dataset_id
  table_id   = "events"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "ts"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "payload"
      type = "JSON"
      mode = "NULLABLE"
    }
  ])
}

# Agent runs table for observability
resource "google_bigquery_table" "agent_runs" {
  dataset_id = google_bigquery_dataset.dulce.dataset_id
  table_id   = "agent_runs"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "agent_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "task"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "status"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "result"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "started_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "completed_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    },
    {
      name = "error_message"
      type = "STRING"
      mode = "NULLABLE"
    }
  ])
}

# Subscription for the agent runner
resource "google_pubsub_subscription" "agents_subscription" {
  name  = "dulce-agents-sub"
  topic = google_pubsub_topic.agents.name

  # Configure for agent processing
  ack_deadline_seconds = 300  # 5 minutes for agent processing
  message_retention_duration = "86400s"  # 24 hours

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "agent-runner"
  }

  depends_on = [google_pubsub_topic.agents]
}

# Service account for agent runner
resource "google_service_account" "agent_runner" {
  account_id   = "agent-runner"
  display_name = "Agent Runner Service Account"
  description  = "Service account for the agent runner Cloud Run service"
}

# IAM permissions for agent runner
resource "google_project_iam_member" "agent_runner_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "agent_runner_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "agent_runner_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}

# Cloud Run service for agent runner
resource "google_cloud_run_v2_service" "agent_runner" {
  name     = "agent-runner"
  location = var.region

  template {
    containers {
      image = "gcr.io/${var.project_id}/agent-runner:latest"
      
      ports {
        container_port = 3001
      }
      
      env {
        name  = "NODE_ENV"
        value = var.environment
      }
      
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      
      env {
        name  = "GCP_LOCATION"
        value = var.region
      }
      
      env {
        name  = "AGENTS_TOPIC"
        value = google_pubsub_topic.agents.name
      }
      
      resources {
        limits = {
          cpu    = "1000m"
          memory = "1Gi"
        }
      }
    }
    
    service_account = google_service_account.agent_runner.email
    
    scaling {
      min_instance_count = 1  # Keep at least one instance running
      max_instance_count = 10
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    service     = "agent-runner"
  }
}