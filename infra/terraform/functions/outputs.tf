output "function_source_bucket" {
  description = "The name of the Cloud Storage bucket for function source code"
  value       = data.google_storage_bucket.function_source.name
}

output "service_account_email" {
  description = "The email of the service account used by Cloud Functions"
  value       = data.google_service_account.function_sa.email
}

output "social_api_url" {
  description = "The URL of the Social API Cloud Function"
  value       = google_cloudfunctions2_function.social_api.service_config[0].uri
}

output "crm_api_url" {
  description = "The URL of the CRM API Cloud Function"
  value       = google_cloudfunctions2_function.crm_api.service_config[0].uri
}

output "cms_api_url" {
  description = "The URL of the CMS API Cloud Function"
  value       = google_cloudfunctions2_function.cms_api.service_config[0].uri
}

output "reviews_api_url" {
  description = "The URL of the Reviews API Cloud Function"
  value       = google_cloudfunctions2_function.reviews_api.service_config[0].uri
}

output "frontend_url" {
  description = "The URL of the frontend Cloud Run service"
  value       = google_cloud_run_v2_service.frontend_agents.uri
}