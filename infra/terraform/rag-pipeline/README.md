# RAG Data Ingestion Pipeline

This document explains how to set up and use the Retrieval-Augmented Generation (RAG) data ingestion pipeline for the Dulce de Saigon F&B Data Platform.

## Overview

The RAG pipeline automates the process of:
1. **Loading** documents from Cloud Storage
2. **Chunking** documents into manageable pieces
3. **Embedding** chunks using Vertex AI
4. **Storing** embeddings in Vertex AI Search for retrieval

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Documents     │    │  Cloud Function  │    │   Vertex AI     │
│  (Cloud Storage)│───▶│  (Processing)    │───▶│    Search       │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Pub/Sub       │    │   Embeddings     │    │   Search API    │
│  (Triggers)     │    │  (Vertex AI)     │    │  (Queries)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

Before setting up the RAG pipeline, ensure you have:

1. **Google Cloud Project** with billing enabled
2. **Terraform** installed (version >= 1.0)
3. **gcloud CLI** configured with appropriate permissions
4. **Node.js** (version >= 20) for local development

### Required Google Cloud APIs

The following APIs will be automatically enabled by Terraform:
- Vertex AI API (`aiplatform.googleapis.com`)
- Discovery Engine API (`discoveryengine.googleapis.com`)
- Cloud Storage API (`storage.googleapis.com`)
- Cloud Functions API (`cloudfunctions.googleapis.com`)
- Cloud Build API (`cloudbuild.googleapis.com`)

## Quick Start

### 1. Deploy Infrastructure

```bash
# Navigate to the RAG pipeline terraform directory
cd infra/terraform/rag-pipeline

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit the variables file with your project details
nano terraform.tfvars

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the infrastructure
terraform apply
```

### 2. Build and Deploy Cloud Function

```bash
# Navigate to the function directory
cd apps/cloud-functions/rag-processor

# Install dependencies
npm install

# Build the function
npm run build

# Create deployment package
zip -r rag-processor-source.zip . -x "node_modules/*" "*.git*"

# Upload to the source bucket (replace PROJECT_ID with your project)
gsutil cp rag-processor-source.zip gs://PROJECT_ID-rag-function-source/
```

### 3. Test the Pipeline

```bash
# Upload a test document to trigger processing
echo "This is a test document for the RAG pipeline. It contains important information about the Dulce de Saigon F&B platform." > test-document.txt

# Upload to the documents bucket (replace PROJECT_ID with your project)
gsutil cp test-document.txt gs://PROJECT_ID-rag-documents/

# Check function logs
gcloud functions logs read rag-document-processor-prod --region=asia-southeast1
```

## Configuration

### Terraform Variables

Edit `infra/terraform/rag-pipeline/terraform.tfvars`:

```hcl
project_id  = "your-gcp-project-id"
region      = "asia-southeast1"
environment = "prod"

# Document processing configuration
chunk_size              = 1000    # Size of each document chunk
chunk_overlap           = 200     # Overlap between chunks
embedding_model         = "textembedding-gecko@003"
max_concurrent_processing = 10
```

### Environment Variables

The Cloud Function uses these environment variables (automatically set by Terraform):

- `PROJECT_ID`: Your GCP project ID
- `REGION`: GCP region for resources
- `DOCUMENTS_BUCKET`: Bucket name for source documents
- `CHUNKS_BUCKET`: Bucket name for processed chunks
- `SEARCH_ENGINE_ID`: Vertex AI Search engine ID
- `DATASTORE_ID`: Vertex AI Search datastore ID

## Usage

### Uploading Documents

Upload documents to the configured storage bucket to automatically trigger processing:

```bash
# Upload a single document
gsutil cp my-document.pdf gs://PROJECT_ID-rag-documents/

# Upload multiple documents
gsutil -m cp documents/* gs://PROJECT_ID-rag-documents/

# Upload with metadata
gsutil -h "x-goog-meta-department:marketing" cp document.txt gs://PROJECT_ID-rag-documents/
```

### Supported File Types

The pipeline currently supports:
- **Text files** (`.txt`, `.md`)
- **JSON files** (`.json`)
- **Markdown files** (`.md`, `.markdown`)

Additional file types can be added by extending the `extractTextFromFile` method in the Vertex AI client.

### Searching Documents

Use the Vertex AI client to search indexed documents:

```typescript
import { VertexAIClient } from '@nx-monorepo/adk';

const client = new VertexAIClient({
  projectId: 'your-project-id',
  location: 'asia-southeast1'
});

const results = await client.searchDocuments('your-search-engine-id', {
  query: 'Vietnamese food preferences',
  maxResults: 10
});

console.log('Search results:', results);
```

## Monitoring and Troubleshooting

### Monitoring

1. **Cloud Function Logs**:
   ```bash
   gcloud functions logs read rag-document-processor-prod --region=asia-southeast1
   ```

2. **Storage Bucket Events**:
   ```bash
   gcloud logging read 'resource.type="gcs_bucket"' --limit=50
   ```

3. **Pub/Sub Messages**:
   ```bash
   gcloud logging read 'resource.type="pubsub_topic"' --limit=50
   ```

### Common Issues

#### Function Timeout
**Problem**: Large documents cause function timeout  
**Solution**: Increase timeout in Terraform or split large documents

#### Out of Memory
**Problem**: Function runs out of memory processing large files  
**Solution**: Increase memory allocation in `main.tf`:

```hcl
service_config {
  available_memory = "2Gi"  # Increase from 1Gi
  timeout_seconds  = 540
}
```

#### Missing Permissions
**Problem**: Function can't access resources  
**Solution**: Check service account permissions in IAM

### Debugging

Enable debug logging by setting environment variables:

```bash
# For local testing
export DEBUG=rag-pipeline:*
export LOG_LEVEL=debug
```

## API Reference

### VertexAIClient Methods

#### `generateEmbeddings(texts: string[]): Promise<EmbeddingResponse>`
Generate embeddings for an array of text strings.

#### `chunkDocument(content: string, metadata: object, chunkSize?: number, overlap?: number): DocumentChunk[]`
Split a document into overlapping chunks.

#### `processDocumentForRAG(content: string, metadata: object, dataStoreId: string, options?: object): Promise<DocumentChunk[]>`
Complete pipeline: chunk document, generate embeddings, and index.

#### `searchDocuments(searchEngineId: string, options: RAGSearchOptions): Promise<SearchResult[]>`
Search indexed documents using Vertex AI Search.

### Data Structures

#### DocumentChunk
```typescript
interface DocumentChunk {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}
```

#### SearchResult
```typescript
interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}
```

## Cost Optimization

### Free Tier Usage

The pipeline is designed to maximize GCP free tier usage:

- **Cloud Functions**: 2M invocations/month free
- **Cloud Storage**: 5GB free storage
- **Vertex AI**: Limited free embeddings

### Cost Monitoring

Monitor costs using:

```bash
# Check current month costs
gcloud billing budgets list

# Set up budget alerts
gcloud billing budgets create --billing-account=BILLING_ACCOUNT_ID \
  --display-name="RAG Pipeline Budget" \
  --budget-amount=100
```

## Security

### Service Account Permissions

The pipeline uses least-privilege access:
- **Storage**: Read documents, write chunks
- **Vertex AI**: Generate embeddings, manage search
- **Pub/Sub**: Receive processing messages

### Data Privacy

For Vietnamese market compliance:
- Documents are processed in `asia-southeast1` region
- No data leaves the specified region
- Audit logs are enabled for all operations

## Advanced Configuration

### Custom Embedding Models

To use different embedding models:

```hcl
# In terraform.tfvars
embedding_model = "textembedding-gecko-multilingual@001"
```

### Batch Processing

For large document sets, consider:
1. Using Cloud Dataflow for batch processing
2. Implementing document prioritization
3. Adding retry mechanisms

### Integration with Existing Systems

The pipeline integrates with:
- **BigQuery**: For analytics on processed documents
- **Looker**: For RAG usage dashboards
- **Cloud Monitoring**: For system health alerts

## Next Steps

1. **Add more file type support** (PDF, DOCX, etc.)
2. **Implement vector similarity search**
3. **Add document versioning**
4. **Create RAG-powered chatbot**
5. **Add multi-language support**

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Cloud Function logs
3. Create an issue in the repository
4. Contact the Dulce de Saigon engineering team

## License

MIT License - see [LICENSE](../../LICENSE) file for details.