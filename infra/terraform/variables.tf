/**
 * @fileoverview This file defines the core input variables for the Terraform
 *               configuration for the entire Dulce de Saigon platform.
 * @description Best practice is to manage sensitive variables through a
 *              `.tfvars` file or environment variables, not by hardcoding
 *              them here.
 */

variable "gcp_project_id" {
  description = "The ID of the Google Cloud project."
  type        = string
}

variable "gcp_region" {
  description = "The GCP region to deploy resources in. For compliance with Vietnamese data residency laws, this should be asia-southeast1."
  type        = string
  default     = "asia-southeast1"
}

variable "environment" {
  description = "The environment to deploy to (dev, staging, prod)."
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "The environment must be one of 'dev', 'staging', or 'prod'."
  }
}

// Variables for Terraform backend configuration
variable "terraform_state_bucket" {
  description = "The name of the GCS bucket to store the Terraform state. If empty, local backend will be used."
  type        = string
  default     = ""
}

variable "terraform_state_prefix" {
  description = "The prefix (path) within the GCS bucket to store the Terraform state."
  type        = string
  default     = "terraform/state"
}