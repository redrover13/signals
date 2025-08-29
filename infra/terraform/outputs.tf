# ============================================================================
# CORE INFRASTRUCTURE OUTPUTS
# ============================================================================

# Service Account Outputs
output "api_service_account_email" {
  description = "Email address of the API service account"
  value       = module.core_infrastructure.api_service_account_email
}

output "vertex_agents_service_account_email" {
  description = "Email address of the Vertex AI agents service account"
  value       = module.core_infrastructure.vertex_agents_service_account_email
}

output "data_processing_service_account_email" {
  description = "Email address of the data processing service account"
  value       = module.core_infrastructure.data_processing_service_account_email
}

output "github_actions_service_account_email" {
  description = "Email address of the GitHub Actions service account"
  value       = module.core_infrastructure.github_actions_service_account_email
}

# Storage Outputs
output "app_data_bucket_name" {
  description = "Name of the application data storage bucket"
  value       = module.core_infrastructure.app_data_bucket_name
}

output "build_artifacts_bucket_name" {
  description = "Name of the build artifacts storage bucket"
  value       = module.core_infrastructure.build_artifacts_bucket_name
}

output "data_backup_bucket_name" {
  description = "Name of the data backup storage bucket"
  value       = module.core_infrastructure.data_backup_bucket_name
}

# Pub/Sub Outputs
output "main_events_topic_name" {
  description = "Name of the main events Pub/Sub topic"
  value       = module.core_infrastructure.main_events_topic_name
}

output "agent_orchestration_topic_name" {
  description = "Name of the agent orchestration Pub/Sub topic"
  value       = module.core_infrastructure.agent_orchestration_topic_name
}

output "data_processing_topic_name" {
  description = "Name of the data processing Pub/Sub topic"
  value       = module.core_infrastructure.data_processing_topic_name
}

# BigQuery Outputs
output "analytics_dataset_id" {
  description = "ID of the analytics BigQuery dataset"
  value       = module.core_infrastructure.analytics_dataset_id
}

output "social_media_dataset_id" {
  description = "ID of the social media BigQuery dataset"
  value       = module.core_infrastructure.social_media_dataset_id
}

output "crm_dataset_id" {
  description = "ID of the CRM BigQuery dataset"
  value       = module.core_infrastructure.crm_dataset_id
}

output "reviews_dataset_id" {
  description = "ID of the reviews BigQuery dataset"
  value       = module.core_infrastructure.reviews_dataset_id
}

# Project Information
output "project_id" {
  description = "The GCP project ID"
  value       = module.core_infrastructure.project_id
}

output "region" {
  description = "The GCP region"
  value       = module.core_infrastructure.region
}

output "environment" {
  description = "The environment name"
  value       = module.core_infrastructure.environment
}

# ============================================================================
# LEGACY OUTPUTS (for backwards compatibility)
# ============================================================================

output "terraform_state_bucket" {
  description = "The name of the Terraform state bucket"
  value       = module.core_infrastructure.terraform_state_bucket_name
}

# Deprecated outputs (for backwards compatibility)
output "github_actions_service_account" {
  description = "The email of the GitHub Actions service account (deprecated - use github_actions_service_account_email)"
  value       = module.core_infrastructure.github_actions_service_account_email
}