/**
 * @fileoverview This file defines the Cloud Run service resource.
 * It creates a Cloud Run service with the specified configuration.
 */

resource "google_cloud_run_service" "service" {
  name     = var.service_name
  location = var.region

  template {
    spec {
      containers {
        image = var.image
        ports {
          container_port = var.port
        }
        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }
        dynamic "env" {
          for_each = var.environment_variables
          content {
            name  = env.key
            value = env.value
          }
        }
      }
      container_concurrency = var.concurrency
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image,
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "service_policy" {
  location = google_cloud_run_service.service.location
  project  = var.gcp_project_id
  service  = google_cloud_run_service.service.name

  policy_data = jsonencode({
    bindings = [
      {
        role = "roles/run.invoker"
        members = [
          "allUsers",
        ]
      }
    ]
  })
}