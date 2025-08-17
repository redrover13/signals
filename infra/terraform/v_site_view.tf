# BigQuery typed view for site.view events
resource "google_bigquery_table" "v_site_view" {
  dataset_id = google_bigquery_dataset.dulce.dataset_id
  table_id   = "v_site_view"
  view {
    query          = <<EOT
CREATE OR REPLACE VIEW `${var.gcp_project_id}.dulce.v_site_view` AS
SELECT
  ts,
  JSON_VALUE(payload, '$.page') AS page,
  JSON_VALUE(payload, '$.utm.s') AS utm_source
FROM `${var.gcp_project_id}.dulce.events`
WHERE type = 'site.view';
EOT
    use_legacy_sql = false
  }
}