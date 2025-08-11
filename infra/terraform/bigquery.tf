/**
 * @fileoverview This file defines the core BigQuery datasets for the
 *               Dulce de Saigon data platform.
 * @description We define a single, primary dataset to house all our analytics
 *              tables and views, ensuring a single source of truth.
 *              The dataset is configured for our primary operational region
 *              to comply with Vietnamese data residency regulations.
 */

resource "google_bigquery_dataset" "dulce" {
  dataset_id                  = "dulce"
  friendly_name               = "Dulce de Saigon"
  description                 = "Primary dataset for the Dulce de Saigon data platform."
  location                    = var.gcp_region
  default_table_expiration_ms = 7776000000 # 90 days
}