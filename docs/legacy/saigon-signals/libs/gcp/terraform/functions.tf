/**
 * @fileoverview This file defines the Cloud Functions for the
 *               Saigon Signals data platform.
 * @description These functions are triggered by events in our data
 *              platform, such as messages on a Pub/Sub topic.
 */

data "archive_file" "sales_processor_source" {
  type        = "zip"
  source_dir  = "${path.module}/functions/sales-processor"
  output_path = "${path.module}/functions/sales-processor.zip"
}

resource "google_storage_bucket_object" "sales_processor_source" {
  name   = "source/sales-processor.zip#${data.archive_file.sales_processor_source.output_md5}"
  bucket = google_storage_bucket.raw_bucket.name
  source = data.archive_file.sales_processor_source.output_path
}

resource "google_cloudfunctions2_function" "sales_processor" {
  name     = "saigon-signals-sales-processor"
  location = var.gcp_region

  build_config {
    runtime     = "nodejs20"
    entry_point = "processSalesData"
    source {
      storage_source {
        bucket = google_storage_bucket.raw_bucket.name
        object = google_storage_bucket_object.sales_processor_source.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    min_instance_count = 0
    available_memory   = "256Mi"
    timeout_seconds    = 60
    ingress_settings   = "ALLOW_ALL"
  }

  event_trigger {
    trigger_region = var.gcp_region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.sales_ingestion_topic.id
  }
}