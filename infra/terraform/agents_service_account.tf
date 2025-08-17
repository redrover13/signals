# Service account for agents Cloud Run service
resource "google_service_account" "agents_sa" {
  account_id   = "dulce-agents-sa"
  display_name = "Service Account for Dulce de Saigon Agents"
}

# Service account for the legacy event parser Cloud Function
resource "google_service_account" "agent_runner" {
  account_id   = "sa-agent-runner"
  display_name = "Service Account for Agent Runner"
}