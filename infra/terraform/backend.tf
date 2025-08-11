/**
 * @fileoverview This file configures the Terraform backend for state management.
 * @description The backend is configured to use a local file for state storage.
 *              In a production environment, this should be changed to a remote
 *              backend like Google Cloud Storage.
 */

terraform {
  backend "gcs" {
    bucket = var.terraform_state_bucket
    prefix = var.terraform_state_prefix
  }
}