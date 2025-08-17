/**
 * @fileoverview This file defines the variables for the Cloud Run module.
 * These variables allow customization of the Cloud Run service.
 */

variable "gcp_project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "region" {
  description = "The GCP region."
  type        = string
  default     = "asia-southeast1"
}

variable "service_name" {
  description = "The name of the Cloud Run service."
  type        = string
}

variable "image" {
  description = "The container image to deploy."
  type        = string
}

variable "port" {
  description = "The port on which the application listens."
  type        = number
  default     = 8080
}

variable "cpu" {
  description = "The CPU allocation for the Cloud Run service."
  type        = string
  default     = "1000m"
}

variable "memory" {
  description = "The memory allocation for the Cloud Run service."
  type        = string
  default     = "512Mi"
}

variable "concurrency" {
  description = "The maximum number of concurrent requests per container instance."
  type        = number
  default     = 80
}

variable "max_instances" {
  description = "The maximum number of container instances."
  type        = number
  default     = 100
}

variable "min_instances" {
  description = "The minimum number of container instances."
  type        = number
  default     = 0
}

variable "environment_variables" {
  description = "Environment variables to pass to the Cloud Run service."
  type        = map(string)
  default     = {}
}
