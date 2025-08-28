variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "saigon-signals"
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

variable "terraform_service_account" {
  description = "Service account email for Terraform operations"
  type        = string
  default     = "github-actions@saigon-signals.iam.gserviceaccount.com"
}

variable "create_github_sa" {
  description = "Create a service account for GitHub Actions (set to false if using existing)"
  type        = bool
  default     = false
}