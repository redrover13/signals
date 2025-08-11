terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

resource "google_service_account_iam_member" "agent_runner_secret_accessor" {
  service_account_id = google_service_account.agent_runner.name
  role               = "roles/secretmanager.secretAccessor"
  member             = "serviceAccount:${google_service_account.agent_runner.email}"
}

resource "google_project_iam_member" "agent_runner_vertex_user" {
  project = "324928471234" # Or a variable for the AI project
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}
