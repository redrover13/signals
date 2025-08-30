terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_cloud_run_service" "grafana" {
  name     = "grafana-service"
  location = var.region

  template {
    spec {
      containers {
        image = "grafana/grafana:10.4.0"

        env {
          name  = "GF_SECURITY_ADMIN_PASSWORD"
          value = data.google_secret_manager_secret_version.grafana_admin_password.secret_data
        }

        env {
          name  = "GF_SECURITY_ADMIN_USER"
          value = "admin"
        }

        env {
          name  = "GF_USERS_ALLOW_SIGN_UP"
          value = "false"
        }

        env {
          name  = "GF_INSTALL_PLUGINS"
          value = "grafana-bigquery-datasource"
        }

        env {
          name  = "GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS"
          value = "grafana-bigquery-datasource"
        }

        ports {
          container_port = 3000
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }

      service_account_name = google_service_account.grafana_sa.email
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

resource "google_service_account" "grafana_sa" {
  account_id   = "grafana-service-account"
  display_name = "Grafana Service Account"
}

resource "google_project_iam_member" "grafana_sa_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.grafana_sa.email}"
}

resource "google_project_iam_member" "grafana_sa_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.grafana_sa.email}"
}

data "google_secret_manager_secret_version" "grafana_admin_password" {
  secret  = "grafana-admin-password"
  project = var.project_id
}

resource "google_cloud_run_service_iam_member" "grafana_invoker" {
  service  = google_cloud_run_service.grafana.name
  location = google_cloud_run_service.grafana.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
