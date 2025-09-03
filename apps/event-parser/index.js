/**
 * @fileoverview Cloud Function to process raw agent telemetry events.
 *
 * This function is triggered by a message on a Pub/Sub topic. It parses the event,
 * stages the raw data for auditing, and inserts the processed data into a BigQuery table.
 * If parsing fails, the original message is sent to a dead-letter GCS bucket.
 * This implementation is designed with production-readiness, security, and
 * compliance with Vietnamese data laws in mind.
 *
 * Enhanced with OpenTelemetry instrumentation for comprehensive observability.
 *
 * @author Dulce de Saigon Engineering
 * @see {@link https://cloud.google.com/functions/docs/write-event-driven-functions}
 */

// GCP Client Libraries
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// OpenTelemetry imports
import { 
  initializeOpenTelemetry,
  withSpan,
  logEvent,
  instrument
} from '@dulce/utils/monitoring';

// Initialize OpenTelemetry for Cloud Function
initializeOpenTelemetry({
  serviceName: 'dulce-de-saigon-event-parser',
  serviceVersion: '1.0.0',
  gcpProjectId: process.env.GCP_PROJECT_ID,
  enableAutoInstrumentation: true,
  enableCustomExporter: true,
  enableBigQueryLogs: true,
}).catch(console.error);

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const BIGQUERY_DATASET = process.env.BIGQUERY_DATASET;
const BIGQUERY_TABLE = process.env.BIGQUERY_TABLE;
const STAGING_BUCKET = process.env.STAGING_BUCKET;
const DEADLETTER_BUCKET = process.env.DEADLETTER_BUCKET;

const bigquery = new BigQuery({projectId: GCP_PROJECT_ID});
const storage = new Storage({projectId: GCP_PROJECT_ID});

const validatePayload = instrument('validate-payload', (payload) => {
  if (!payload) {
    throw new Error('Payload is null or undefined.');
  }
  const requiredFields = ['event_id', 'agent_id', 'timestamp'];
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error(`Missing required field in payload: "${field}"`);
    }
  }
}, {
  attributes: {
    'component': 'event-parser',
    'operation': 'validation',
  }
});

export const parseAgentEvent = async (pubSubMessage, context) => {
  return withSpan('parse-agent-event', async (span) => {
    const eventId = context.eventId || uuidv4();
    const rawMessageBuffer = Buffer.from(pubSubMessage.data, 'base64');
    const rawMessageString = rawMessageBuffer.toString('utf8');

    span.setAttributes({
      'event.id': eventId,
      'event.size_bytes': rawMessageBuffer.length,
      'gcp.project_id': GCP_PROJECT_ID,
      'component': 'event-parser',
    });

    await logEvent('event_processing_started', {
      eventId,
      messageSize: rawMessageBuffer.length,
    });

    try {
      // Parse and validate event payload
      const eventPayload = await withSpan('parse-json', async (parseSpan) => {
        try {
          const parsed = JSON.parse(rawMessageString);
          parseSpan.setAttributes({
            'parsing.success': true,
            'event.agent_id': parsed.agent_id,
            'event.event_id': parsed.event_id,
          });
          return parsed;
        } catch (error) {
          parseSpan.setAttributes({
            'parsing.success': false,
            'parsing.error': error.message,
          });
          throw error;
        }
      });

      validatePayload(eventPayload);

      // Stage raw data in GCS
      const stagingFileName = await withSpan('stage-to-gcs', async (stageSpan) => {
        const fileName = `${new Date().toISOString()}_${eventPayload.event_id}.json`;
        
        stageSpan.setAttributes({
          'gcs.bucket': STAGING_BUCKET.replace('gs://', ''),
          'gcs.file_name': fileName,
          'staging.agent_id': eventPayload.agent_id,
        });

        await storage
          .bucket(STAGING_BUCKET.replace('gs://', ''))
          .file(fileName)
          .save(rawMessageBuffer);

        await logEvent('raw_data_staged', {
          fileName,
          bucket: STAGING_BUCKET,
          agentId: eventPayload.agent_id,
        });

        return fileName;
      });

      // Insert processed data into BigQuery
      await withSpan('insert-to-bigquery', async (bqSpan) => {
        const row = {
          event_id: eventPayload.event_id,
          agent_id: eventPayload.agent_id,
          timestamp: new Date(eventPayload.timestamp).toISOString(),
          session_id: eventPayload.session_id || null,
          payload: eventPayload.payload || null,
          status: 'PROCESSED',
        };

        bqSpan.setAttributes({
          'bigquery.dataset': BIGQUERY_DATASET,
          'bigquery.table': BIGQUERY_TABLE,
          'bigquery.row_count': 1,
          'processing.status': 'PROCESSED',
        });

        await bigquery
          .dataset(BIGQUERY_DATASET)
          .table(BIGQUERY_TABLE)
          .insert([row]);

        await logEvent('event_processed_successfully', {
          eventId: eventPayload.event_id,
          agentId: eventPayload.agent_id,
          stagingFile: stagingFileName,
          status: 'PROCESSED',
        });
      });

      span.setAttributes({
        'processing.success': true,
        'processing.status': 'PROCESSED',
      });

    } catch (_error) {
      // Handle processing errors
      await withSpan('handle-processing-error', async (errorSpan) => {
        const deadLetterFileName = `${new Date().toISOString()}_${eventId}.json`;
        
        errorSpan.setAttributes({
          'error.type': _error.constructor.name,
          'error.message': _error.message,
          'deadletter.file_name': deadLetterFileName,
          'processing.success': false,
        });

        await logEvent('event_processing_failed', {
          eventId,
          error: _error.message,
          deadLetterFile: deadLetterFileName,
        }, 'error');

        try {
          await storage
            .bucket(DEADLETTER_BUCKET.replace('gs://', ''))
            .file(deadLetterFileName)
            .save(rawMessageBuffer);

          await logEvent('message_sent_to_deadletter', {
            eventId,
            deadLetterFile: deadLetterFileName,
            bucket: DEADLETTER_BUCKET,
          }, 'warn');

          errorSpan.setAttributes({
            'deadletter.success': true,
          });

        } catch (_dlqError) {
          errorSpan.setAttributes({
            'deadletter.success': false,
            'deadletter.error': _dlqError.message,
          });

          await logEvent('deadletter_failed', {
            eventId,
            originalError: _error.message,
            deadletterError: _dlqError.message,
          }, 'error');

          // In a production scenario, this might trigger a high-priority alert (e.g., via PagerDuty).
        }
      });

      span.setAttributes({
        'processing.success': false,
        'processing.error': _error.message,
      });
    }
  });
};
