/**
 * @fileoverview This file defines the input variables for the Terraform
 *               configuration.
 * @description Best practice is to manage sensitive variables through a
 *              `.tfvars` file or environment variables, not by hardcoding
 *              them here.
 */

variable "gcp_project_id" {
  description = "The ID of the Google Cloud project."
  type        = string
}

variable "gcp_region" {
  description = "The primary Google Cloud region for resource deployment (e.g., 'asia-southeast1')."
  type        = string
  default     = "asia-southeast1" # Ho Chi Minh City
}