/**
 * @fileoverview Legacy Event Parser Cloud Function for Dulce de Saigon
 * 
 * This Cloud Function processes legacy Pub/Sub events and forwards them to BigQuery
 * for analytics. It ensures proper data handling according to Vietnamese data privacy
 * laws and Dulce de Saigon's data governance policies.
 * 
 * @author Dulce de Saigon Engineering Team
 * @version 1.0.0
 */

const {PubSub} = require('@google-cloud/pubsub');
const {BigQuery} = require('@google-cloud/bigquery');

// Initialize clients with proper error handling
let pubSubClient;
let bigQueryClient;

try {
  pubSubClient = new PubSub({
    projectId: process.env.GCP_PROJECT_ID,
    // Ensure we're using the asia-southeast1 region for Vietnamese data compliance
    apiEndpoint: 'asia-southeast1-pubsub.googleapis.com'
  });
  
  bigQueryClient = new BigQuery({
    projectId: process.env.GCP_PROJECT_ID,
    // Ensure we're using the asia-southeast1 region for Vietnamese data compliance
    location: 'asia-southeast1'
  });
} catch (error) {
  console.error('Error initializing clients:', error);
  // Don't throw here, let the function handle the error when called
}

/**
 * Validates the event data according to Dulce de Saigon's data standards
 * 
 * @param {Object} data - The event data to validate
 * @returns {Object} - Object containing validation result and any error messages
 */
function validateEventData(data) {
  if (!data) {
    return { valid: false, error: 'Event data is missing' };
  }

  // Required fields validation
  const requiredFields = ['eventId', 'timestamp', 'source', 'type'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return { 
      valid: false, 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    };
  }

  // Timestamp validation (must be in ICT timezone - UTC+7)
  try {
    const timestamp = new Date(data.timestamp);
    if (isNaN(timestamp.getTime())) {
      return { valid: false, error: 'Invalid timestamp format' };
    }
    
    // Check if timestamp includes timezone information
    if (!data.timestamp.includes('+07:00') && !data.timestamp.includes('+0700')) {
      return { 
        valid: false, 
        error: 'Timestamp must include ICT timezone (UTC+7) information' 
      };
    }
  } catch (error) {
    return { valid: false, error: `Timestamp validation error: ${error.message}` };
  }

  // Validate event type is from allowed list
  const allowedEventTypes = ['order_placed', 'order_updated', 'inventory_updated', 'menu_updated'];
  if (!allowedEventTypes.includes(data.type)) {
    return { 
      valid: false, 
      error: `Invalid event type. Must be one of: ${allowedEventTypes.join(', ')}` 
    };
  }

  // Validate Vietnamese currency format if present
  if (data.amount) {
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return { 
        valid: false, 
        error: 'Amount must be a positive number in VND' 
      };
    }
    
    // Check if amount exceeds maximum allowed value (1 billion VND)
    if (data.amount > 1000000000) {
      return { 
        valid: false, 
        error: 'Amount exceeds maximum allowed value (1 billion VND)' 
      };
    }
  }

  // Validate Vietnamese phone number format if present
  if (data.phoneNumber) {
    const vietnamesePhoneRegex = /^(\+84|84|0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    if (!vietnamesePhoneRegex.test(data.phoneNumber)) {
      return { 
        valid: false, 
        error: 'Invalid Vietnamese phone number format' 
      };
    }
  }

  return { valid: true };
}

/**
 * Anonymizes sensitive data according to Vietnamese data privacy laws
 * 
 * @param {Object} data - The event data to anonymize
 * @returns {Object} - Anonymized data
 */
function anonymizeSensitiveData(data) {
  const anonymizedData = {...data};
  
  // Anonymize personal information if present
  if (anonymizedData.customerName) {
    // Keep only first name initial and last name
    const nameParts = anonymizedData.customerName.split(' ');
    if (nameParts.length > 1) {
      const firstNameInitial = nameParts[0].charAt(0);
      const lastName = nameParts[nameParts.length - 1];
      anonymizedData.customerName = `${firstNameInitial}. ${lastName}`;
    }
  }
  
  // Anonymize phone number if present
  if (anonymizedData.phoneNumber) {
    // Keep only last 4 digits
    anonymizedData.phoneNumber = anonymizedData.phoneNumber.replace(/^(.*)(\d{4})$/, '********$2');
  }
  
  // Anonymize address if present
  if (anonymizedData.address) {
    // Keep only district and city
    const addressParts = anonymizedData.address.split(',');
    if (addressParts.length > 2) {
      anonymizedData.address = addressParts.slice(-2).join(',');
    }
  }
  
  // Remove any health-related information (sensitive data)
  if (anonymizedData.healthInfo) {
    delete anonymizedData.healthInfo;
  }
  
  // Remove any dietary restrictions (sensitive data)
  if (anonymizedData.dietaryRestrictions) {
    delete anonymizedData.dietaryRestrictions;
  }
  
  return anonymizedData;
}

/**
 * Processes a Pub/Sub event and forwards it to BigQuery
 * 
 * @param {Object} pubsubMessage - The Pub/Sub message to process
 * @returns {Promise<void>}
 */
async function processEvent(pubsubMessage) {
  // Decode and parse the Pub/Sub message
  let eventData;
  try {
    const message = Buffer.from(pubsubMessage.data, 'base64').toString();
    eventData = JSON.parse(message);
    console.log('Received event:', eventData.eventId);
  } catch (error) {
    console.error('Error decoding message:', error);
    throw new Error('Invalid message format');
  }
  
  // Validate the event data
  const validation = validateEventData(eventData);
  if (!validation.valid) {
    console.error('Validation error:', validation.error);
    throw new Error(`Validation error: ${validation.error}`);
  }
  
  // Anonymize sensitive data for analytics
  const anonymizedData = anonymizeSensitiveData(eventData);
  
  // Determine the target BigQuery table based on event type
  const datasetId = process.env.BIGQUERY_DATASET || 'dulce_analytics';
  let tableId;
  
  switch (eventData.type) {
    case 'order_placed':
    case 'order_updated':
      tableId = 'orders';
      break;
    case 'inventory_updated':
      tableId = 'inventory';
      break;
    case 'menu_updated':
      tableId = 'menu';
      break;
    default:
      tableId = 'events';
  }
  
  // Add metadata for audit trail
  anonymizedData.processedAt = new Date().toISOString();
  anonymizedData.processorId = process.env.FUNCTION_NAME || 'legacy-event-parser';
  
  // Insert data into BigQuery
  try {
    await bigQueryClient
      .dataset(datasetId)
      .table(tableId)
      .insert([anonymizedData]);
    
    console.log(`Event ${eventData.eventId} successfully processed and stored in ${datasetId}.${tableId}`);
  } catch (error) {
    console.error('Error inserting data into BigQuery:', error);
    throw new Error(`BigQuery insertion error: ${error.message}`);
  }
}

/**
 * Cloud Function entry point
 * 
 * @param {Object} pubsubMessage - The Pub/Sub message that triggered the function
 * @param {Object} context - The event context
 * @returns {Promise<void>}
 */
exports.legacyEventParser = async (pubsubMessage, context) => {
  // Validate clients are initialized
  if (!pubSubClient || !bigQueryClient) {
    console.error('Clients not properly initialized');
    throw new Error('Service initialization failed');
  }
  
  try {
    await processEvent(pubsubMessage);
  } catch (error) {
    console.error('Error processing event:', error);
    
    // Forward error events to a dead-letter topic for later processing
    if (process.env.ERROR_TOPIC) {
      try {
        const errorMessage = {
          originalMessage: pubsubMessage,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        await pubSubClient
          .topic(process.env.ERROR_TOPIC)
          .publish(Buffer.from(JSON.stringify(errorMessage)));
        
        console.log('Error event forwarded to dead-letter topic');
      } catch (pubsubError) {
        console.error('Failed to publish to error topic:', pubsubError);
      }
    }
    
    // Re-throw the error to signal failure to Cloud Functions
    throw error;
  }
};