/**
 * @fileoverview This file defines the IAM policies for the
 *               Saigon Signals data platform.
 * @description We follow the principle of least privilege, granting
 *              only the necessary permissions to each service account.
 */

resource "google_project_iam_member" "sales_processor_pubsub_subscriber" {
  project = var.gcp_project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_cloudfunctions2_function.sales_processor.service_account}"
}

resource "google_project_iam_member" "sales_processor_bigquery_writer" {
  project = var.gcp_project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_cloudfunctions2_function.sales_processor.service_account}"
}