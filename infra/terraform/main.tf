terraform {
  required_version = ">= 1.0"
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
    "cloudresourcemanager.googleapis.com"
  ])
  
  service = each.value
  disable_dependent_services = true
}

# Reference existing Terraform state bucket
data "google_storage_bucket" "terraform_state" {
  name = "saigon-signals-terraform-state"
}

# Ensure proper permissions on the state bucket
resource "google_storage_bucket_iam_member" "terraform_state_admin" {
  bucket = data.google_storage_bucket.terraform_state.name
  role   = "roles/storage.admin"
  member = "serviceAccount:${var.terraform_service_account}"
}

# Create a service account for GitHub Actions (if not using WIF)
resource "google_service_account" "github_actions" {
  count = var.create_github_sa ? 1 : 0
  
  account_id   = "github-actions-sa"
  display_name = "GitHub Actions Service Account"
  description  = "Service account for GitHub Actions CI/CD"
}

# Grant necessary permissions to GitHub Actions service account
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
    "roles/cloudbuild.builds.editor"
  ]) : toset([])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_actions[0].email}"
}