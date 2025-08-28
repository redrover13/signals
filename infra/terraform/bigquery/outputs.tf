output "analytics_dataset_id" {
  description = "The ID of the analytics dataset"
  value       = google_bigquery_dataset.analytics.dataset_id
}

output "social_media_dataset_id" {
  description = "The ID of the social media dataset"
  value       = google_bigquery_dataset.social_media.dataset_id
}

output "crm_dataset_id" {
  description = "The ID of the CRM dataset"
  value       = google_bigquery_dataset.crm.dataset_id
}

output "reviews_dataset_id" {
  description = "The ID of the reviews dataset"
  value       = google_bigquery_dataset.reviews.dataset_id
}

output "social_posts_table_id" {
  description = "The ID of the social posts table"
  value       = google_bigquery_table.social_posts.table_id
}

output "customer_reviews_table_id" {
  description = "The ID of the customer reviews table"
  value       = google_bigquery_table.customer_reviews.table_id
}

output "customers_table_id" {
  description = "The ID of the customers table"
  value       = google_bigquery_table.customers.table_id
}