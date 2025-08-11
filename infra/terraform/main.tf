terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

resource "google_bigquery_dataset" "dulce" {
  dataset_id                  = "dulce_${var.environment}"
  friendly_name               = "Dulce de Saigon (${var.environment})"
  description                 = "Primary dataset for the Dulce de Saigon data platform (${var.environment})."
  location                    = var.gcp_region
  default_table_expiration_ms = 7776000000 # 90 days
}