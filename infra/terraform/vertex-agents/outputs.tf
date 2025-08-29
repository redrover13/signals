output "vertex_agents_service_account" {
  description = "The email of the Vertex AI agents service account"
  value       = data.google_service_account.vertex_agents_sa.email
}

output "agent_artifacts_bucket" {
  description = "The name of the agent artifacts bucket"
  value       = google_storage_bucket.agent_artifacts.name
}

output "gemini_orchestrator_url" {
  description = "The URL of the Gemini orchestrator function"
  value       = google_cloudfunctions2_function.gemini_orchestrator.service_config[0].uri
}

output "bq_agent_url" {
  description = "The URL of the BQ agent function"
  value       = google_cloudfunctions2_function.bq_agent.service_config[0].uri
}

output "looker_agent_url" {
  description = "The URL of the Looker agent function"
  value       = google_cloudfunctions2_function.looker_agent.service_config[0].uri
}

output "crm_agent_url" {
  description = "The URL of the CRM agent function"
  value       = google_cloudfunctions2_function.crm_agent.service_config[0].uri
}

output "content_agent_url" {
  description = "The URL of the content agent function"
  value       = google_cloudfunctions2_function.content_agent.service_config[0].uri
}

output "reviews_agent_url" {
  description = "The URL of the reviews agent function"
  value       = google_cloudfunctions2_function.reviews_agent.service_config[0].uri
}

output "orchestration_topic" {
  description = "The name of the agent orchestration Pub/Sub topic"
  value       = google_pubsub_topic.agent_orchestration.name
}