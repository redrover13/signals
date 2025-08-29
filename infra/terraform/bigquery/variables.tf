variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "asia-southeast1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "data_owner_email" {
  description = "Email of the data owner who will have full access to datasets"
  type        = string
}

variable "organization_domain" {
  description = "Organization domain for reader access"
  type        = string
  default     = "dulcedesaigon.com"
}

variable "enable_data_transfer" {
  description = "Enable BigQuery Data Transfer Service"
  type        = bool
  default     = false
}