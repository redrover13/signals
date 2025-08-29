import { CloudEvent, getEventData } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import { VertexAIClient } from '@nx-monorepo/adk';

interface StorageObjectData {
  bucket: string;
  name: string;
  contentType: string;
  size: string;
  timeCreated: string;
  updated: string;
}

interface ProcessingConfig {
  projectId: string;
  region: string;
  documentsBucket: string;
  chunksBucket: string;
  searchEngineId: string;
  datastoreId: string;
}

/**
 * Cloud Function that processes documents for RAG
 * Triggered by Cloud Storage object creation events
 */
export async function processDocument(cloudEvent: CloudEvent): Promise<void> {
  console.log('RAG Document Processor started');
  console.log('Event:', JSON.stringify(cloudEvent, null, 2));

  try {
    // Get the storage event data
    const data = getEventData(cloudEvent) as StorageObjectData;
    
    if (!data) {
      throw new Error('No event data found');
    }

    const { bucket, name: fileName, contentType } = data;
    
    console.log(`Processing file: ${fileName} from bucket: ${bucket}`);
    console.log(`Content type: ${contentType}`);

    // Get configuration from environment variables
    const config: ProcessingConfig = {
      projectId: process.env.PROJECT_ID!,
      region: process.env.REGION!,
      documentsBucket: process.env.DOCUMENTS_BUCKET!,
      chunksBucket: process.env.CHUNKS_BUCKET!,
      searchEngineId: process.env.SEARCH_ENGINE_ID!,
      datastoreId: process.env.DATASTORE_ID!
    };

    // Validate configuration
    for (const [key, value] of Object.entries(config)) {
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    // Initialize clients
    const storage = new Storage();
    const vertexAI = new VertexAIClient({
      projectId: config.projectId,
      location: config.region
    });

    // Download the file from Cloud Storage
    const file = storage.bucket(bucket).file(fileName);
    const [fileBuffer] = await file.download();
    
    console.log(`Downloaded file: ${fileName}, size: ${fileBuffer.length} bytes`);

    // Extract text content from the file
    const textContent = await vertexAI.extractTextFromFile(
      fileBuffer,
      contentType || 'text/plain',
      fileName
    );

    console.log(`Extracted text content: ${textContent.length} characters`);

    // Prepare metadata
    const metadata = {
      documentId: fileName.replace(/[^a-zA-Z0-9_-]/g, '_'),
      originalFileName: fileName,
      contentType,
      uploadTime: new Date().toISOString(),
      bucket,
      fileSize: fileBuffer.length
    };

    // Process the document for RAG
    const chunks = await vertexAI.processDocumentForRAG(
      textContent,
      metadata,
      config.datastoreId,
      {
        chunkSize: 1000,
        overlap: 200,
        generateEmbeddings: true
      }
    );

    console.log(`Generated ${chunks.length} chunks`);

    // Save chunks to the chunks bucket as JSON
    const chunksData = {
      metadata,
      chunks: chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: chunk.embedding
      })),
      processedAt: new Date().toISOString()
    };

    const chunksFileName = `${metadata.documentId}_chunks.json`;
    const chunksFile = storage.bucket(config.chunksBucket).file(chunksFileName);
    
    await chunksFile.save(JSON.stringify(chunksData, null, 2), {
      metadata: {
        contentType: 'application/json'
      }
    });

    console.log(`Saved chunks to: ${chunksFileName}`);

    // Log processing summary
    console.log('Document processing completed successfully');
    console.log(`- Original file: ${fileName}`);
    console.log(`- Text length: ${textContent.length} characters`);
    console.log(`- Chunks created: ${chunks.length}`);
    console.log(`- Chunks saved to: ${chunksFileName}`);

  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

/**
 * Health check endpoint for the function
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString()
  };
}