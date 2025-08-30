# Signals

This repository contains the source code for the Signals project, a platform for...

## NX Monorepo

This project is built as an NX monorepo, which provides several benefits:

- **Caching**: Intelligent caching of build, test, and lint results
- **Dependency Management**: Clear visualization and management of project dependencies
- **Code Sharing**: Easy sharing of code between applications
- **Consistency**: Consistent tools and configurations across projects

### Project Structure

The monorepo is organized into the following directories:

- `apps/`: Contains application projects that are deployable
- `libs/`: Contains library projects that are shared between applications
- `tools/`: Contains utility scripts and tools for managing the monorepo
- `infra/`: Contains infrastructure-related code (Terraform, etc.)
- `docs/`: Contains documentation

### Documentation

For more information about the NX configuration, see:

- [NX Configuration Guide](./docs/nx/configuration-guide.md)
- [Dependency Management](./docs/nx/dependency-management.md)
- [TypeScript and Linting Standards](./docs/nx/typescript-linting-standards.md)

### Optimization Tools

The monorepo includes several tools for optimization:

```bash
# Update project configurations with best practices
npx ts-node tools/scripts/update-project-configs.ts

# Check for TypeScript issues
npx ts-node tools/scripts/check-typescript-issues.ts

# Analyze dependencies for issues
npx ts-node tools/scripts/analyze-dependencies.ts

# Run all optimization tools
./tools/scripts/run-nx-optimization.sh
```

## RAG Pipeline Infrastructure

The Signals platform includes a production-ready RAG (Retrieval-Augmented Generation) pipeline deployed on Google Cloud Platform. This infrastructure enables AI-powered document processing and retrieval capabilities.

### Key Components

- **Cloud Storage**: Document storage and processed chunk storage
- **BigQuery**: Data warehouse for searchable document chunks
- **Cloud Functions**: Serverless document processing
- **Pub/Sub**: Event-driven messaging system
- **IAM**: Secure service account management

### Infrastructure Status

✅ **Successfully Deployed**: All GCP resources are active and operational
- Documents Bucket: `saigon-signals-rag-documents`
- Chunks Bucket: `saigon-signals-rag-chunks`
- BigQuery Dataset: `rag_dataset.document_chunks`
- Cloud Function: `rag-document-processor`
- Pub/Sub Topic: `rag-document-processing`

### Documentation

For detailed information about the RAG pipeline:

- [RAG Pipeline Deployment Guide](./docs/RAG_PIPELINE_DEPLOYMENT.md)
- [Infrastructure Architecture](./docs/ARCHITECTURE.md)
- [Deployment Procedures](./docs/DEPLOYMENT.md)

### Usage

Upload documents to the designated Cloud Storage bucket to trigger automatic processing and chunking for AI retrieval.
