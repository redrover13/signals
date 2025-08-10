# Enable the Secret Manager API
resource "google_project_service" "secretmanager" {
  project                    = var.project_id
  service                    = "secretmanager.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = true
}

# Create the secret for the Dulce API Key
resource "google_secret_manager_secret" "dulce_api_key" {
  project = var.project_id
  secret_id = "DULCE_API_KEY"

  replication {
    auto {}
  }

  # Ensure the API is enabled before creating the secret
  depends_on = [google_project_service.secretmanager]
}

# Add an initial version to the secret
resource "google_secret_manager_secret_version" "dulce_api_key_initial_version" {
  secret      = google_secret_manager_secret.dulce_api_key.id
  secret_data = "insecure-dev-key-replace-me-in-gcp-console"
}

# Grant the agents service account access to the secret
resource "google_secret_manager_secret_iam_member" "dulce_api_key_accessor" {
  project   = google_secret_manager_secret.dulce_api_key.project
  secret_id = google_secret_manager_secret.dulce_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.agents_sa.email}"
}