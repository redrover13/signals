variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for deployment"
  type        = string
  default     = "us-central1"
}
