# Signals Architecture

## Overview

Signals is a platform for...

## RAG Pipeline Architecture

The RAG (Retrieval-Augmented Generation) pipeline provides AI-powered document processing and retrieval capabilities using Google Cloud Platform services.

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │  Cloud Function │    │   BigQuery      │
│   Upload        │───▶│  Processor      │───▶│   Data Store    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Cloud Storage   │    │   Pub/Sub       │    │   AI Model      │
│ (Documents)     │    │   Events        │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

#### 1. Document Ingestion
- **Cloud Storage Bucket**: `saigon-signals-rag-documents`
- **Purpose**: Stores uploaded documents for processing
- **Features**:
  - Automatic lifecycle management (30-day retention)
  - Uniform bucket-level access control
  - Event triggers for processing

#### 2. Document Processing
- **Cloud Function**: `rag-document-processor`
- **Runtime**: Node.js 18 with ES modules
- **Capabilities**:
  - Document parsing and text extraction
  - Intelligent chunking algorithms
  - Metadata extraction and enrichment
  - Error handling and retry logic

#### 3. Data Storage
- **BigQuery Dataset**: `rag_dataset`
- **Table**: `document_chunks`
- **Schema**:
  ```sql
  CREATE TABLE rag_dataset.document_chunks (
    document_id STRING,
    chunk_id INT64,
    content STRING,
    metadata JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  )
  CLUSTER BY document_id
  ```
- **Features**:
  - Optimized for analytical queries
  - Clustered by document_id for efficient retrieval
  - JSON metadata support for flexible attributes

#### 4. Event Messaging
- **Pub/Sub Topic**: `rag-document-processing`
- **Purpose**: Decouples processing components
- **Features**:
  - 24-hour message retention
  - Dead letter queue for failed messages
  - Scalable message throughput

#### 5. Chunk Storage
- **Cloud Storage Bucket**: `saigon-signals-rag-chunks`
- **Purpose**: Stores processed document chunks as JSON
- **Features**:
  - Optimized for retrieval operations
  - Versioning for data integrity
  - Cost-effective long-term storage

### Security Architecture

#### IAM & Access Control
- **Service Account**: `rag-pipeline-sa@saigon-signals.iam.gserviceaccount.com`
- **Permissions**:
  - `roles/storage.admin` - Bucket management
  - `roles/bigquery.user` - Data operations
  - `roles/bigquery.dataEditor` - Table modifications
  - `roles/cloudfunctions.admin` - Function management
  - `roles/pubsub.publisher` - Event publishing

#### Data Security
- **Encryption**: All data encrypted at rest and in transit
- **Access Logging**: Comprehensive audit trails
- **Network Security**: Private VPC configuration
- **Compliance**: GDPR and Vietnamese data privacy compliant

### Performance & Scalability

#### Auto-scaling
- **Cloud Functions**: Scales automatically based on load
- **BigQuery**: Serverless scaling for analytical workloads
- **Pub/Sub**: Handles variable message throughput

#### Performance Optimizations
- **BigQuery Clustering**: Optimized query performance
- **Storage Classes**: Cost-effective storage tiers
- **Caching**: Intelligent caching strategies

### Monitoring & Observability

#### Logging
- **Cloud Logging**: Centralized log aggregation
- **Structured Logging**: JSON-formatted logs for analysis
- **Log Retention**: Configurable retention policies

#### Metrics
- **Cloud Monitoring**: Real-time performance metrics
- **Custom Metrics**: Application-specific KPIs
- **Alerting**: Proactive issue detection

#### Tracing
- **Cloud Trace**: Request tracing and latency analysis
- **Distributed Tracing**: End-to-end request visibility

### Deployment Architecture

#### Infrastructure as Code
- **Terraform**: Declarative infrastructure management
- **Version Control**: Git-based configuration management
- **CI/CD**: Automated deployment pipelines

#### Environment Management
- **Development**: Isolated development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### Integration Points

#### External Systems
- **Vertex AI**: AI model integration for enhanced processing
- **Document AI**: Advanced document understanding
- **Translation AI**: Multi-language document support

#### Internal Systems
- **API Gateway**: Secure API access
- **Authentication**: User identity management
- **Authorization**: Fine-grained access control

### Cost Optimization

#### Resource Optimization
- **Storage Lifecycle**: Automatic data tiering
- **Query Optimization**: Efficient BigQuery usage
- **Compute Optimization**: Right-sizing Cloud Functions

#### Cost Monitoring
- **Budget Alerts**: Proactive cost management
- **Usage Analytics**: Detailed cost analysis
- **Optimization Recommendations**: GCP cost optimization suggestions

### Future Enhancements

#### Planned Features
- **Real-time Processing**: Streaming document processing
- **Advanced Chunking**: Semantic chunking algorithms
- **Multi-modal Support**: Image and video processing
- **Federated Learning**: Distributed model training

#### Scalability Improvements
- **Global Distribution**: Multi-region deployment
- **Edge Computing**: Reduced latency through edge deployment
- **Advanced Caching**: Intelligent caching layers
