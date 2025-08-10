# Saigon Signals

> Enterprise-grade Nx monorepo for Dulce de Saigon's data-driven F&B platform in Vietnam 🇻🇳

## 🚀 Overview

This repository contains the complete infrastructure and applications for Saigon Signals, a real-time data analytics and automation platform designed specifically for the Vietnamese F&B market.

## 🏗️ Architecture

- **Framework**: Nx Monorepo with PNPM workspace
- **Language**: TypeScript (Google Style Guide)
- **Cloud**: Google Cloud Platform (asia-southeast1)
- **CI/CD**: GitHub Actions with Workload Identity Federation
- **Security**: Multi-layer scanning (TruffleHog, Secretlint, GitGuardian)

## 📦 Projects

```
apps/
├── agents/      # AI-powered business intelligence agents
├── api/         # RESTful API backend
└── web/         # Customer-facing web application

libs/
└── agents/      # Shared agent utilities and tools
```

## 🔧 Setup

### Prerequisites

- Node.js 18, 20, or 22
- PNPM 8.x
- Google Cloud SDK
- Git

### Installation

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

## 🚦 CI/CD Pipeline

Our automated pipeline includes:

1. **Security Scanning**: Automated secret detection on every commit
2. **Multi-version Testing**: Tests on Node 18, 20, and 22
3. **Smart Builds**: Nx affected commands build only changed projects
4. **Gradual Deployment**: 10% → 50% → 100% traffic migration
5. **Regional Deployment**: Optimized for Vietnam (asia-southeast1)

## 🔐 Security

- Workload Identity Federation for keyless GCP authentication
- Pre-commit hooks with secret scanning
- Encrypted secrets management
- Vietnamese data privacy law compliance

## 📝 Documentation

- [Agents Workflow Guide](docs/AGENTS_WORKFLOW_GUIDE.md)
- [Deployment Checklist](docs/DEPLOY_CHECKLIST.md)
- [WIF Setup Guide](docs/WIF_SETUP_GUIDE.md)
- [Critical Improvements](docs/CRITICAL_IMPROVEMENTS.md)

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

## 📄 License

Proprietary - Dulce de Saigon © 2024

---

## Pipeline Simulation

This project includes automated testing and deployment pipelines. Every commit triggers the full CI/CD workflow.