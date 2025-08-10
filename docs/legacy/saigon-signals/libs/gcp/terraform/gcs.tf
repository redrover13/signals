/**
 * @fileoverview This file defines the Google Cloud Storage buckets for the
 *               Saigon Signals data platform.
 * @description We define two primary buckets:
 *              1. Raw Zone: For immutable, untransformed data.
 *              2. Processed Zone: For cleansed, structured, and queryable data.
 *
 *              All buckets are configured with uniform-level access, versioning,
 *              and a 90-day data retention policy for compliance.
 */

resource "google_storage_bucket" "raw_bucket" {
  name          = "${var.gcp_project_id}-raw-data"
  location      = var.gcp_region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90 # days
    }
  }
}

resource "google_storage_bucket" "processed_bucket" {
  name          = "${var.gcp_project_id}-processed-data"
  location      = var.gcp_region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90 # days
    }
  }
}