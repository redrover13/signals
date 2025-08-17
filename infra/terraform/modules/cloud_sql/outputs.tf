/**
 * @fileoverview This file defines the outputs for the Cloud SQL module.
 * These outputs allow other modules or the root module to access
 * information about the created Cloud SQL instance and database.
 */

output "instance_connection_name" {
  description = "The connection name of the Cloud SQL instance."
  value       = google_sql_database_instance.instance.connection_name
}

output "database_name" {
  description = "The name of the database."
  value       = google_sql_database.database.name
}

output "user_name" {
  description = "The name of the database user."
  value       = google_sql_user.user.name
}