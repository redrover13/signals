/**
 * @fileoverview This file defines the variables for the Cloud SQL module.
 * These variables allow customization of the Cloud SQL instance.
 */

variable "gcp_project_id" {
  description = "The Google Cloud project ID where the Cloud SQL instance will be created"
  type        = string
}

variable "region" {
  description = "The GCP region."
  type        = string
  default     = "asia-southeast1"
}

variable "database_name" {
  description = "The name of the database."
  type        = string
}

variable "database_version" {
  description = "The database version to use."
  type        = string
  default     = "POSTGRES_13"
}

variable "tier" {
  description = "The tier of the database."
  type        = string
  default     = "db-f1-micro"
}

variable "disk_size" {
  description = "The disk size of the database in GB."
  type        = number
  default     = 10
}

variable "disk_type" {
  description = "The disk type of the database."
  type        = string
  default     = "PD_SSD"
}

variable "user_name" {
  description = "The name of the database user."
  type        = string
}

variable "user_password" {
  description = "The password of the database user."
  type        = string
  sensitive   = true
}

variable "authorized_networks" {
  description = "A list of authorized networks."
  type        = list(string)
  default     = []
}
