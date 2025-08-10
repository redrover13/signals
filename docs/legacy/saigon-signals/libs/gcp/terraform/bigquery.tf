/**
 * @fileoverview This file defines the BigQuery datasets for the
 *               Saigon Signals data platform.
 * @description We define two primary datasets:
 *              1. Staging Zone: For intermediate, partially-processed data.
 *              2. Production Zone: For clean, reliable, analytics-ready data.
 *
 *              Both datasets are configured with a default 90-day table
 *              expiration to manage costs and data retention.
 */

resource "google_bigquery_dataset" "staging_dataset" {
  dataset_id                  = "saigon_signals_staging"
  friendly_name               = "Saigon Signals Staging"
  description                 = "Dataset for staging and intermediate data processing."
  location                    = var.gcp_region
  default_table_expiration_ms = 7776000000 # 90 days
}

resource "google_bigquery_dataset" "production_dataset" {
  dataset_id                  = "saigon_signals_production"
  friendly_name               = "Saigon Signals Production"
  description                 = "Dataset for production-ready, curated data."
  location                    = var.gcp_region
  default_table_expiration_ms = 7776000000 # 90 days
}