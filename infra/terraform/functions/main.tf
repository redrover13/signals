terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  
  backend "gcs" {
    bucket = "saigon-signals-terraform-state"
    prefix = "functions"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Reference existing storage bucket for function source code
data "google_storage_bucket" "function_source" {
  name = "saigon-signals-build-artifacts"
}

# Reference existing service account for Cloud Functions
data "google_service_account" "function_sa" {
  account_id = "dulce-api-sa"
}

# Additional permissions for the existing service account (if needed)
resource "google_project_iam_member" "function_sa_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${data.google_service_account.function_sa.email}"
}

resource "google_project_iam_member" "function_sa_secretmanager" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${data.google_service_account.function_sa.email}"
}

# Social API Cloud Function
resource "google_cloudfunctions2_function" "social_api" {
  name     = "social-api"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = data.google_storage_bucket.function_source.name
        object = "social-api-source.zip"
      }
    }
  }

  service_config {
    max_instance_count = 10
    min_instance_count = 0
    available_memory   = "256M"
    timeout_seconds    = 60
    
    environment_variables = {
      NODE_ENV = var.environment
      GCP_PROJECT_ID = var.project_id
    }
    
    service_account_email = data.google_service_account.function_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# CRM API Cloud Function
resource "google_cloudfunctions2_function" "crm_api" {
  name     = "crm-api"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = data.google_storage_bucket.function_source.name
        object = "crm-api-source.zip"
      }
    }
  }

  service_config {
    max_instance_count = 10
    min_instance_count = 0
    available_memory   = "256M"
    timeout_seconds    = 60
    
    environment_variables = {
      NODE_ENV = var.environment
      GCP_PROJECT_ID = var.project_id
    }
    
    service_account_email = data.google_service_account.function_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# CMS API Cloud Function
resource "google_cloudfunctions2_function" "cms_api" {
  name     = "cms-api"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = data.google_storage_bucket.function_source.name
        object = "cms-api-source.zip"
      }
    }
  }

  service_config {
    max_instance_count = 10
    min_instance_count = 0
    available_memory   = "256M"
    timeout_seconds    = 60
    
    environment_variables = {
      NODE_ENV = var.environment
      GCP_PROJECT_ID = var.project_id
    }
    
    service_account_email = data.google_service_account.function_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Reviews API Cloud Function
resource "google_cloudfunctions2_function" "reviews_api" {
  name     = "reviews-api"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    
    source {
      storage_source {
        bucket = data.google_storage_bucket.function_source.name
        object = "reviews-api-source.zip"
      }
    }
  }

  service_config {
    max_instance_count = 10
    min_instance_count = 0
    available_memory   = "256M"
    timeout_seconds    = 60
    
    environment_variables = {
      NODE_ENV = var.environment
      GCP_PROJECT_ID = var.project_id
    }
    
    service_account_email = data.google_service_account.function_sa.email
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Cloud Run service for frontend
resource "google_cloud_run_v2_service" "frontend_agents" {
  name     = "frontend-agents"
  location = var.region

  template {
    containers {
      image = "gcr.io/${var.project_id}/frontend-agents:latest"
      
      ports {
        container_port = 8080
      }
      
      env {
        name  = "NODE_ENV"
        value = var.environment
      }
      
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      
      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }
    }
    
    service_account = data.google_service_account.function_sa.email
    
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# IAM policy to allow public access to Cloud Run service
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_v2_service.frontend_agents.name
  location = google_cloud_run_v2_service.frontend_agents.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Function invoker permissions for HTTP triggers
resource "google_cloudfunctions2_function_iam_member" "social_api_invoker" {
  project        = var.project_id
  location       = google_cloudfunctions2_function.social_api.location
  cloud_function = google_cloudfunctions2_function.social_api.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

resource "google_cloudfunctions2_function_iam_member" "crm_api_invoker" {
  project        = var.project_id
  location       = google_cloudfunctions2_function.crm_api.location
  cloud_function = google_cloudfunctions2_function.crm_api.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

resource "google_cloudfunctions2_function_iam_member" "cms_api_invoker" {
  project        = var.project_id
  location       = google_cloudfunctions2_function.cms_api.location
  cloud_function = google_cloudfunctions2_function.cms_api.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

resource "google_cloudfunctions2_function_iam_member" "reviews_api_invoker" {
  project        = var.project_id
  location       = google_cloudfunctions2_function.reviews_api.location
  cloud_function = google_cloudfunctions2_function.reviews_api.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}