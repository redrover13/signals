# Dulce de Saigon - F&B Data Platform

> Enterprise-grade Nx monorepo for Dulce de Saigon's data-driven F&B platform in Vietnam 🇻🇳

## 🚀 Overview

This repository contains the complete infrastructure and applications for Dulce de Saigon, a real-time data analytics and automation platform designed specifically for the Vietnamese F&B market.

### Key Features

- **Real-time Analytics**: Track customer behavior, sales, and inventory in real-time
- **AI-Powered Insights**: Leverage Vertex AI for business intelligence and automation
- **Multi-channel Integration**: Connect with POS systems, delivery platforms, and social media
- **Compliance-Ready**: Built with Vietnamese data privacy laws in mind
- **Cost-Optimized**: Maximizes Google Cloud free-tier resources

## 🏗️ Architecture

### Core Components

- **Framework**: Nx Monorepo with PNPM workspace
- **Language**: TypeScript (Google Style Guide)
- **Cloud**: Google Cloud Platform (asia-southeast1)
- **CI/CD**: GitHub Actions with Workload Identity Federation
- **Security**: Multi-layer scanning (TruffleHog, Secretlint, GitGuardian)

### System Architecture

```mermaid
flowchart TD
    A[Web Client] -->|API Calls| B[API Service]
    B -->|Pub/Sub| C[PUB/SUB TOPICS]
    C --> D[INGEST WORKER]
    D --> E[BIGQUERY]
    C --> F[AGENTS WORKER]
    F --> E
    G[CLOUD STORAGE] --> H[BACKUP]
    I[EXTERNAL SYSTEMS] --> B
    J[VERTEX AI] --> F
    
    subgraph GCP
        B
        C
        D
        E
        F
        G
        H
    end
    
    subgraph CLIENTS
        A
        I
    end
    
    subgraph AI
        J
    end
```

### Data Flow

1. **Web Client** sends events to the **API Service**
2. **API Service** publishes events to **Pub/Sub Topics**
3. **Ingest Worker** consumes events and writes to **BigQuery**
4. **Agents Worker** processes complex tasks using **Vertex AI**
5. **External Systems** can also send data through the API
6. **Cloud Storage** provides backup and file storage

## 📦 Project Structure

```
apps/
├── agents/      # AI-powered business intelligence agents
├── api/         # RESTful API backend
└── web/         # Customer-facing web application

libs/
├── agents/      # Shared agent utilities and tools
└── gcp/         # Google Cloud Platform integrations

infra/
└── terraform/  # Infrastructure as Code

docs/
├── AGENTS_WORKFLOW_GUIDE.md
├── DEPLOY_CHECKLIST.md
├── WIF_SETUP_GUIDE.md
└── CRITICAL_IMPROVEMENTS.md
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18, 20, or 22
- PNPM 8.x
- Google Cloud SDK
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/redrover13/signals.git
cd signals

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
nx serve api
```

### Environment Variables

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
GCP_PROJECT_ID=your-gcp-project-id
BQ_DATASET=dulce
PUBSUB_TOPIC=dulce.events
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dulce
LOG_LEVEL=info
```

## 🚦 CI/CD Pipeline

Our automated pipeline includes:

1. **Security Scanning**: Automated secret detection on every commit
2. **Multi-version Testing**: Tests on Node 18, 20, and 22
3. **Smart Builds**: Nx affected commands build only changed projects
4. **Gradual Deployment**: 10% → 50% → 100% traffic migration
5. **Regional Deployment**: Optimized for Vietnam (asia-southeast1)

## 🔐 Security & Compliance

### Security Features

- **Workload Identity Federation** for keyless GCP authentication
- **Pre-commit hooks** with secret scanning
- **Encrypted secrets management** using Google Secret Manager
- **Least privilege principle** for all service accounts

### Vietnamese Compliance

- **Data Localization**: All customer data stored in Vietnam region
- **Privacy Protection**: Compliant with Vietnamese data privacy laws
- **Audit Trails**: Complete logging for all data access

## 📝 Documentation

- [Agents Workflow Guide](docs/AGENTS_WORKFLOW_GUIDE.md) - Detailed guide on agent development
- [Deployment Checklist](docs/DEPLOY_CHECKLIST.md) - Step-by-step deployment instructions
- [WIF Setup Guide](docs/WIF_SETUP_GUIDE.md) - Workload Identity Federation setup
- [Critical Improvements](docs/CRITICAL_IMPROVEMENTS.md) - Important updates and fixes

## 🧪 Testing

```bash
# Run all tests
nx run-many --target=test

# Run tests for affected projects
nx affected:test

# Run e2e tests
nx e2e web-e2e
```

## 🚀 Deployment

Deployments are automated via GitHub Actions when pushing to main:

```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

The pipeline will:
1. Run security scans
2. Execute tests
3. Build affected projects
4. Deploy to Google Cloud Run

## 📊 Monitoring

- **Logs**: Google Cloud Logging
- **Metrics**: Google Cloud Monitoring
- **Alerts**: Configured for critical issues

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass
4. Submit a pull request

## 🌏 Vietnamese Localization

This platform is designed specifically for the Vietnamese F&B market with:

- **Local Currency Support**: VND integration
- **Vietnamese Language UI**: Full localization
- **Cultural Adaptation**: Menu planning and marketing aligned with Vietnamese preferences
- **Regional Compliance**: Adherence to Vietnamese business regulations

## 📄 License

Proprietary - Dulce de Saigon © 2024

---

## Pipeline Simulation

This project includes automated testing and deployment pipelines. Every commit triggers the full CI/CD workflow.