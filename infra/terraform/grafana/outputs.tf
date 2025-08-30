output "grafana_service_url" {
  description = "The URL of the deployed Grafana service"
  value       = google_cloud_run_service.grafana.status[0].url
}

output "grafana_service_account_email" {
  description = "The email of the Grafana service account"
  value       = google_service_account.grafana_sa.email
}
