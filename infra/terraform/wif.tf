# Workload Identity Federation stub for Cloud Build
resource "google_iam_workload_identity_pool" "ci_pool" {
  workload_identity_pool_id = "dulce-ci-pool"
  display_name              = "Dulce CI Pool"
}

resource "google_iam_workload_identity_pool_provider" "ci_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.ci_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub Actions Provider"
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
