# Signals Monorepo

This repository contains the source code for the Signals project, a platform for...

## Overview

The Signals project is a comprehensive F&B data platform designed specifically for the Vietnamese market. It includes a high-performance API, an intelligent agent service, and a user-friendly web application.

## Project Structure

The monorepo is organized into the following directories:

- `apps/`: Contains application projects that are deployable.
  - `api`: Provides RESTful endpoints for the platform.
  - `agents`: Orchestrates AI-powered tasks for restaurant operations, customer service, and data analysis.
  - `frontend-agents`: A Next.js-based web application for interacting with the platform.
  - `looker-dashboards`: A library for creating Looker dashboards.
- `libs/`: Contains library projects that are shared between applications.
  - `adk`: The Agent Development Kit, providing tools for building agents.
  - `ui/components`: A library of shared UI components.
- `tools/`: Contains utility scripts and tools for managing the monorepo.
- `infra/`: Contains infrastructure-related code (Terraform, etc.).
- `docs/`: Contains documentation.

## Environment Setup

### Prerequisites

- Node.js 18+ or 22+
- PNPM package manager
- Google Cloud Platform account with Vertex AI enabled
- Vietnamese fonts installed on system
- Modern web browser with UTF-8 support

### Installation

```bash
# Install dependencies (from root)
pnpm install
```

### Configuration

Create a `.env` file in the root of the project and add the following environment variables:

```bash
# Required
PORT=3000
AGENTS_TOPIC=dulce.agents

# Google Cloud (automatically detected if using gcloud auth)
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Next.js
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_LOCALE=vi-VN
NEXT_PUBLIC_CURRENCY=VND
NEXT_PUBLIC_TIMEZONE=Asia/Ho_Chi_Minh
NEXT_PUBLIC_GA_ID=GA4-MEASUREMENT-ID
NEXT_PUBLIC_VIETNAMESE_ANALYTICS=true
```

## Development

### Running the applications

```bash
# Start the API server
pnpm nx serve api

# Start the agents service
pnpm nx serve agents

# Start the frontend application
pnpm nx serve frontend-agents
```

### Running tests

```bash
# Run all tests
pnpm nx test

# Run tests for a specific application
pnpm nx test api
```

## Deployment

### Building the applications

```bash
# Build all applications
pnpm nx build

# Build a specific application
pnpm nx build api
```

### Deploying to Google Cloud

```bash
# Deploy the API to Cloud Run
gcloud run deploy dulce-api \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated

# Deploy the agents service to Cloud Run
gcloud run deploy dulce-agents \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated

# Deploy the frontend application to Vercel
vercel
```

## Documentation

For more detailed information, please refer to the documentation in the `docs/` directory:

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [CI/CD Workflow](./docs/CI_CD_WORKFLOW.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [RAG Pipeline Deployment Guide](./docs/RAG_PIPELINE_DEPLOYMENT.md)
- [Vietnamese Localization Guide](./docs/VIETNAMESE_LOCALIZATION.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
