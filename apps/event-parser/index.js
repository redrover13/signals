<![CDATA[
/**
 * @fileoverview Cloud Function to process raw agent telemetry events.
 *
 * This function is triggered by a message on a Pub/Sub topic. It parses the event,
 * stages the raw data for auditing, and inserts the processed data into a BigQuery table.
 * If parsing fails, the original message is sent to a dead-letter GCS bucket.
 * This implementation is designed with production-readiness, security, and
 * compliance with Vietnamese data laws in mind.
 *
 * @author Dulce de Saigon Engineering
 * @see {@link https://cloud.google.com/functions/docs/write-event-driven-functions}
 */

// GCP Client Libraries
const {BigQuery} = require('@google-cloud/bigquery');
const {Storage} = require('@google-cloud/storage');
const {v4: uuidv4} = require('uuid');

// --- Configuration ---
// It's recommended to move these to environment variables for better security and flexibility.
const GCP_PROJECT_ID = 'chimera-prod-392817';
const BIGQUERY_DATASET = 'agent_telemetry';
const BIGQUERY_TABLE = 'processed_events';
const STAGING_BUCKET = 'gs://chimera-staging-us-central1';
const DEADLETTER_BUCKET = 'gs://chimera-deadletter-us-central1';

// Initialize GCP clients
// These clients will automatically use the service account credentials
// provided by the Cloud Functions execution environment.
const bigquery = new BigQuery({projectId: GCP_PROJECT_ID});
const storage = new Storage({projectId: GCP_PROJECT_ID});

/**
 * Validates the essential fields of the parsed event payload.
 *
 * @param {object} payload The event payload object to validate.
 * @throws {Error} If the payload is missing required fields.
 */
const validatePayload = payload => {
  if (!payload) {
    throw new Error('Payload is null or undefined.');
  }
  const requiredFields = ['event_id', 'agent_id', 'timestamp'];
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error(`Missing required field in payload: "${field}"`);
    }
  }
};

/**
 * Main Cloud Function to process raw agent events from Pub/Sub.
 *
 * @param {object} pubSubMessage The event payload from Pub/Sub.
 * @param {object} context The event metadata.
 * @see {@link https://cloud.google.com/functions/docs/writing/background#functions_background_parameters-node-js}
 */
exports.parseAgentEvent = async (pubSubMessage, context) => {
  const eventId = context.eventId || uuidv4();
  const rawMessageBuffer = Buffer.from(pubSubMessage.data, 'base64');
  const rawMessageString = rawMessageBuffer.toString('utf8');

  try {
    console.log(`[${eventId}] Received event. Processing...`);

    // 1. Parse the incoming message
    const eventPayload = JSON.parse(rawMessageString);

    // 2. Validate the payload against our required schema
    validatePayload(eventPayload);
    console.log(`[${eventId}] Payload validation successful for agent: ${eventPayload.agent_id}`);

    // 3. Stage a copy of the raw, validated message for auditing
    const stagingFileName = `${new Date().toISOString()}_${eventPayload.event_id}.json`;
    await storage
      .bucket(STAGING_BUCKET.replace('gs://', ''))
      .file(stagingFileName)
      .save(rawMessageBuffer);

    console.log(`[${eventId}] Successfully staged raw event to: ${STAGING_BUCKET}/${stagingFileName}`);

    // 4. Prepare the row for BigQuery insertion
    const row = {
      event_id: eventPayload.event_id,
      agent_id: eventPayload.agent_id,
      timestamp: new Date(eventPayload.timestamp).toISOString(),
      session_id: eventPayload.session_id || null,
      payload: eventPayload.payload || null, // Storing the rest of the payload as JSON
      status: 'PROCESSED',
    };

    // 5. Insert the processed data into BigQuery
    await bigquery
      .dataset(BIGQUERY_DATASET)
      .table(BIGQUERY_TABLE)
      .insert([row]);

    console.log(`[${eventId}] Successfully inserted processed event into BigQuery for agent: ${eventPayload.agent_id}`);
  } catch (error) {
    // --- Error Handling & Dead-Lettering ---
    console.error(`[${eventId}] An error occurred:`, error.message);
    console.error(`[${eventId}] Raw message content:`, rawMessageString);

    // Write the original, unparsable message to the dead-letter bucket
    const deadLetterFileName = `${new Date().toISOString()}_${eventId}.json`;
    try {
      await storage
        .bucket(DEADLETTER_BUCKET.replace('gs://', ''))
        .file(deadLetterFileName)
        .save(rawMessageBuffer);

      console.error(
        `[${eventId}] Successfully moved problematic message to dead-letter bucket: ${DEADLETTER_BUCKET}/${deadLetterFileName}`
      );
    } catch (dlqError) {
      console.error(
        `[${eventId}] CRITICAL: Failed to write to dead-letter bucket.`,
        dlqError
      );
      // In a production scenario, this might trigger a high-priority alert (e.g., via PagerDuty).
    }
  }
};
]]>