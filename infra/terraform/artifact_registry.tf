# /infra/terraform/artifact_registry.tf

/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

# ------------------------------------------------------------------------------
# Archivematica GCP - Terraform - Cloud Build & Artifact Registry
# ------------------------------------------------------------------------------

# Enable the Artifact Registry API
resource "google_project_service" "artifactregistry" {
  project                    = var.gcp_project_id
  service                    = "artifactregistry.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = true
}

# Enable the Container Scanning API
resource "google_project_service" "containerscanning" {
  project                    = var.gcp_project_id
  service                    = "containerscanning.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = true
}

# Create the Artifact Registry repository for Docker images.
# This repository is configured in the `asia-southeast1` region to comply
# with Vietnamese data residency requirements.
resource "google_artifact_registry_repository" "docker_repository" {
  project       = var.gcp_project_id
  location      = "asia-southeast1"
  repository_id = "dulce-de-saigon-images"
  description   = "Docker repository for Dulce de Saigon images"
  format        = "DOCKER"

  depends_on = [
    google_project_service.artifactregistry,
  ]
}

# Grant the Cloud Build service account permissions to interact with the repository.
# This allows Cloud Build to push images and read scan results.
resource "google_artifact_registry_repository_iam_member" "cloud_build_iam" {
  project    = google_artifact_registry_repository.docker_repository.project
  location   = google_artifact_registry_repository.docker_repository.location
  repository = google_artifact_registry_repository.docker_repository.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}