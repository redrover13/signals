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

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const BIGQUERY_DATASET = process.env.BIGQUERY_DATASET;
const BIGQUERY_TABLE = process.env.BIGQUERY_TABLE;
const STAGING_BUCKET = process.env.STAGING_BUCKET;
const DEADLETTER_BUCKET = process.env.DEADLETTER_BUCKET;

const bigquery = new BigQuery({projectId: GCP_PROJECT_ID});
const storage = new Storage({projectId: GCP_PROJECT_ID});

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

exports.parseAgentEvent = async (pubSubMessage, context) => {
  const eventId = context.eventId || uuidv4();
  const rawMessageBuffer = Buffer.from(pubSubMessage.data, 'base64');
  const rawMessageString = rawMessageBuffer.toString('utf8');

  try {
    const eventPayload = JSON.parse(rawMessageString);

    validatePayload(eventPayload);

    const stagingFileName = `${new Date().toISOString()}_${eventPayload.event_id}.json`;
    await storage
      .bucket(STAGING_BUCKET.replace('gs://', ''))
      .file(stagingFileName)
      .save(rawMessageBuffer);

    const row = {
      event_id: eventPayload.event_id,
      agent_id: eventPayload.agent_id,
      timestamp: new Date(eventPayload.timestamp).toISOString(),
      session_id: eventPayload.session_id || null,
      payload: eventPayload.payload || null,
      status: 'PROCESSED',
    };

    await bigquery
      .dataset(BIGQUERY_DATASET)
      .table(BIGQUERY_TABLE)
      .insert([row]);

  } catch (error) {
    const deadLetterFileName = `${new Date().toISOString()}_${eventId}.json`;
    try {
      await storage
        .bucket(DEADLETTER_BUCKET.replace('gs://', ''))
        .file(deadLetterFileName)
        .save(rawMessageBuffer);
    } catch (dlqError) {
      // In a production scenario, this might trigger a high-priority alert (e.g., via PagerDuty).
    }
  }
};
]]>