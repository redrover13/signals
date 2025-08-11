/**
 * @fileoverview This file defines the outputs for the Cloud Run module.
 * These outputs allow other modules or the root module to access
 * information about the created Cloud Run service.
 */

output "service_name" {
  description = "The name of the Cloud Run service."
  value       = google_cloud_run_service.service.name
}

output "service_url" {
  description = "The URL of the Cloud Run service."
  value       = google_cloud_run_service.service.status[0].url
}