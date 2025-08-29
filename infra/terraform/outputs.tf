output "terraform_state_bucket" {
  description = "The name of the Terraform state bucket"
  value       = data.google_storage_bucket.terraform_state.name
}

output "github_actions_service_account" {
  description = "The email of the GitHub Actions service account (if created)"
  value       = var.create_github_sa ? google_service_account.github_actions[0].email : null
}

output "enabled_apis" {
  description = "List of enabled APIs"
  value       = [for api in google_project_service.required_apis : api.service]
}