variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "saigon-signals"
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "asia-southeast1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "data_owner_email" {
  description = "Email address of the data owner for BigQuery access"
  type        = string
  default     = "admin@saigon-signals.com"
}

variable "organization_domain" {
  description = "Organization domain for BigQuery access"
  type        = string
  default     = "saigon-signals.com"
}

variable "create_github_sa" {
  description = "Whether to create a service account for GitHub Actions"
  type        = bool
  default     = false
}

variable "table_expiration_days" {
  description = "Default table expiration in days for BigQuery tables"
  type        = number
  default     = 90
  
  validation {
    condition     = var.table_expiration_days >= 1 && var.table_expiration_days <= 365
    error_message = "Table expiration must be between 1 and 365 days."
  }
}

variable "enable_monitoring" {
  description = "Enable monitoring and alerting resources"
  type        = bool
  default     = true
}

variable "enable_vpc_connector" {
  description = "Enable VPC connector for serverless services"
  type        = bool
  default     = false
}

variable "labels" {
  description = "Additional labels to apply to all resources"
  type        = map(string)
  default     = {}
}