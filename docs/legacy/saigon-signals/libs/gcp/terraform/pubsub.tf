/**
 * @fileoverview This file defines the Pub/Sub topics for the
 *               Saigon Signals data platform.
 * @description Pub/Sub topics are used for asynchronous, real-time
 *              data ingestion from our various data sources.
 */

resource "google_pubsub_topic" "sales_ingestion_topic" {
  name = "saigon-signals-sales-ingestion"
}