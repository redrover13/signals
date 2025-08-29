# ============================================================================
# SERVICE ACCOUNT OUTPUTS
# ============================================================================

output "api_service_account_email" {
  description = "Email address of the API service account"
  value       = google_service_account.api_service_account.email
}

output "vertex_agents_service_account_email" {
  description = "Email address of the Vertex AI agents service account"
  value       = google_service_account.vertex_agents_sa.email
}

output "data_processing_service_account_email" {
  description = "Email address of the data processing service account"
  value       = google_service_account.data_processing_sa.email
}

output "github_actions_service_account_email" {
  description = "Email address of the GitHub Actions service account"
  value       = var.create_github_sa ? google_service_account.github_actions_sa[0].email : null
}

# ============================================================================
# STORAGE BUCKET OUTPUTS
# ============================================================================

output "app_data_bucket_name" {
  description = "Name of the application data storage bucket"
  value       = google_storage_bucket.app_data.name
}

output "build_artifacts_bucket_name" {
  description = "Name of the build artifacts storage bucket"
  value       = google_storage_bucket.build_artifacts.name
}

output "data_backup_bucket_name" {
  description = "Name of the data backup storage bucket"
  value       = google_storage_bucket.data_backup.name
}

output "terraform_state_bucket_name" {
  description = "Name of the Terraform state storage bucket"
  value       = data.google_storage_bucket.terraform_state.name
}

# ============================================================================
# PUB/SUB OUTPUTS
# ============================================================================

output "main_events_topic_name" {
  description = "Name of the main events Pub/Sub topic"
  value       = google_pubsub_topic.main_events.name
}

output "agent_orchestration_topic_name" {
  description = "Name of the agent orchestration Pub/Sub topic"
  value       = google_pubsub_topic.agent_orchestration.name
}

output "data_processing_topic_name" {
  description = "Name of the data processing Pub/Sub topic"
  value       = google_pubsub_topic.data_processing.name
}

output "dead_letter_topic_name" {
  description = "Name of the dead letter queue Pub/Sub topic"
  value       = google_pubsub_topic.dead_letter.name
}

output "main_events_subscription_name" {
  description = "Name of the main events Pub/Sub subscription"
  value       = google_pubsub_subscription.main_events_sub.name
}

output "agent_orchestration_subscription_name" {
  description = "Name of the agent orchestration Pub/Sub subscription"
  value       = google_pubsub_subscription.agent_orchestration_sub.name
}

output "data_processing_subscription_name" {
  description = "Name of the data processing Pub/Sub subscription"
  value       = google_pubsub_subscription.data_processing_sub.name
}

# ============================================================================
# BIGQUERY OUTPUTS
# ============================================================================

output "analytics_dataset_id" {
  description = "ID of the analytics BigQuery dataset"
  value       = google_bigquery_dataset.analytics.dataset_id
}

output "social_media_dataset_id" {
  description = "ID of the social media BigQuery dataset"
  value       = google_bigquery_dataset.social_media.dataset_id
}

output "crm_dataset_id" {
  description = "ID of the CRM BigQuery dataset"
  value       = google_bigquery_dataset.crm.dataset_id
}

output "reviews_dataset_id" {
  description = "ID of the reviews BigQuery dataset"
  value       = google_bigquery_dataset.reviews.dataset_id
}

output "events_table_id" {
  description = "ID of the events BigQuery table"
  value       = google_bigquery_table.events.table_id
}

output "users_table_id" {
  description = "ID of the users BigQuery table"
  value       = google_bigquery_table.users.table_id
}

output "social_posts_table_id" {
  description = "ID of the social posts BigQuery table"
  value       = google_bigquery_table.social_posts.table_id
}

output "customer_reviews_table_id" {
  description = "ID of the customer reviews BigQuery table"
  value       = google_bigquery_table.customer_reviews.table_id
}

output "customers_table_id" {
  description = "ID of the customers BigQuery table"
  value       = google_bigquery_table.customers.table_id
}

# ============================================================================
# SECRET MANAGER OUTPUTS
# ============================================================================

output "db_connection_secret_id" {
  description = "ID of the database connection Secret Manager secret"
  value       = google_secret_manager_secret.db_connection.secret_id
}

output "api_keys_secret_id" {
  description = "ID of the API keys Secret Manager secret"
  value       = google_secret_manager_secret.api_keys.secret_id
}

output "social_media_credentials_secret_id" {
  description = "ID of the social media credentials Secret Manager secret"
  value       = google_secret_manager_secret.social_media_credentials.secret_id
}

# ============================================================================
# MONITORING OUTPUTS
# ============================================================================

output "error_count_metric_name" {
  description = "Name of the error count logging metric"
  value       = google_logging_metric.error_count.name
}

output "api_uptime_check_id" {
  description = "ID of the API uptime check"
  value       = google_monitoring_uptime_check_config.api_uptime_check.uptime_check_id
}

# ============================================================================
# PROJECT INFORMATION OUTPUTS
# ============================================================================

output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "environment" {
  description = "The environment name"
  value       = var.environment
}