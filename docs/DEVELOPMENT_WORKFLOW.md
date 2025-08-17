# Dulce de Saigon Development Workflow

## Overview

This document outlines the development workflow for the Dulce de Saigon platform, including setup, coding standards, testing, and deployment processes.

## Development Environment Setup

### Prerequisites

1. **Node.js** (version 18, 20, or 22)
2. **PNPM** (version 8.x)
3. **Google Cloud SDK**
4. **Git**
5. **Docker** (for containerization)
6. **Terraform** (for infrastructure)

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/redrover13/signals.git
   cd signals
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

## Project Structure

The project follows an Nx monorepo structure:

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

docs/           # Documentation
```

## Coding Standards

### TypeScript Style Guide

The project follows Google's TypeScript style guide with some modifications:

1. **File Naming**
   - Use kebab-case for file names
   - Use .ts extension for TypeScript files

2. **Code Organization**
   - Organize code into logical modules
   - Use barrel exports (index.ts files) for public APIs
   - Keep functions small and focused

3. **Documentation**
   - Use JSDoc for all public APIs
   - Include examples for complex functions
   - Document edge cases and error conditions

### Git Workflow

1. **Branching Strategy**
   - Use feature branches for all changes
   - Branch from main for new features
   - Use descriptive branch names (e.g., feature/user-authentication)

2. **Commit Messages**
   - Follow conventional commit format
   - Use present tense ("Add feature" not "Added feature")
   - Include issue references when applicable

3. **Pull Requests**
   - Require at least one review for all changes
   - Include a description of changes
   - Link to relevant issues or documentation

## Development Process

### 1. Feature Development

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Implement the feature following coding standards

3. Write tests for new functionality

4. Update documentation as needed

5. Run linting and formatting:
   ```bash
   nx lint
   nx format
   ```

### 2. Testing

The project includes multiple types of tests:

1. **Unit Tests**
   - Located in `*.spec.ts` files
   - Test individual functions and components
   - Run with: `nx test project-name`

2. **Integration Tests**
   - Test interactions between components
   - Run with: `nx test project-name --watch=false`

3. **End-to-End Tests**
   - Test complete user workflows
   - Located in `apps/*/e2e` directories
   - Run with: `nx e2e project-name-e2e`

### 3. Code Review

1. Push changes to remote branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request on GitHub

3. Address review feedback

4. Merge after approval

### 4. Continuous Integration

The CI pipeline runs automatically on all pull requests and main branch pushes:

1. **Security Scanning**
   - Secret scanning with Secretlint
   - Dependency vulnerability checks

2. **Testing**
   - Unit tests on Node 18, 20, and 22
   - Integration tests
   - End-to-end tests

3. **Building**
   - Nx affected commands build only changed projects
   - Docker image building

4. **Deployment**
   - Gradual deployment (10% → 50% → 100%)
   - Automated rollback on failure

## Nx Commands

### Common Nx Commands

1. **Serve Applications**
   ```bash
   nx serve api
   nx serve web
   nx serve agents
   ```

2. **Build Applications**
   ```bash
   nx build api
   nx build web
   nx build agents
   ```

3. **Run Tests**
   ```bash
   nx test api
   nx test web
   nx test agents
   nx test gcp
   nx test agents-lib
   ```

4. **Run Linting**
   ```bash
   nx lint api
   nx lint web
   nx lint agents
   nx lint gcp
   nx lint agents-lib
   ```

5. **Run Affected Commands**
   ```bash
   nx affected --target=build
   nx affected --target=test
   nx affected --target=lint
   ```

### Project-Specific Commands

#### API Service
```bash
# Serve with hot reload
nx serve api

# Build for production
nx build api

# Run tests
nx test api

# Run linting
nx lint api
```

#### Web Application
```bash
# Serve with hot reload
nx serve web

# Build for production
nx build web

# Run tests
nx test web

# Run linting
nx lint web

# Run end-to-end tests
nx e2e web-e2e
```

#### Agents Service
```bash
# Serve with hot reload
nx serve agents

# Build for production
nx build agents

# Run tests
nx test agents

# Run linting
nx lint agents
```

## Debugging

### Local Debugging

1. **API Service**
   ```bash
   nx serve api
   # Use browser or API client to test endpoints
   ```

2. **Web Application**
   ```bash
   nx serve web
   # Open browser to http://localhost:4200
   ```

3. **Agents Service**
   ```bash
   nx serve agents
   # Use API to trigger agent tasks
   ```

### Debugging Tools

1. **VS Code Debugging**
   - Use built-in debugging configurations
   - Set breakpoints in source code
   - Inspect variables and call stacks

2. **Logging**
   - Use structured logging throughout the application
   - Include correlation IDs for request tracing
   - Log at appropriate levels (debug, info, warn, error)

3. **Cloud Debugging**
   - Use Google Cloud Logging for production debugging
   - Use Cloud Monitoring for performance analysis
   - Use Cloud Trace for request tracing

## Deployment Process

### Development Deployment

1. **Local Testing**
   ```bash
   nx serve api
   nx serve web
   nx serve agents
   ```

2. **Staging Deployment**
   - Deploy to staging environment
   - Run integration tests
   - Validate functionality

### Production Deployment

1. **CI/CD Pipeline**
   - Automated deployment via GitHub Actions
   - Gradual rollout (10% → 50% → 100%)
   - Automated rollback on failure

2. **Manual Deployment**
   ```bash
   # Build container
   gcloud builds submit --tag gcr.io/PROJECT_ID/SERVICE_NAME
   
   # Deploy to Cloud Run
   gcloud run deploy SERVICE_NAME \
     --image gcr.io/PROJECT_ID/SERVICE_NAME \
     --platform managed \
     --region asia-southeast1
   ```

## Monitoring and Maintenance

### Health Checks

1. **API Health**
   ```bash
   GET /health
   ```

2. **Service Health**
   - Monitor Cloud Run service status
   - Check Pub/Sub subscription backlog
   - Monitor BigQuery job performance

### Performance Monitoring

1. **Cloud Monitoring**
   - Custom metrics for business KPIs
   - System health dashboards
   - Automated alerting

2. **Cloud Logging**
   - Centralized log aggregation
   - Log retention policies
   - Automated log analysis

### Maintenance Tasks

1. **Regular Updates**
   - Dependency updates
   - Security patches
   - Performance optimizations

2. **Data Management**
   - BigQuery table partitioning
   - Log retention policies
   - Backup verification

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check service account permissions
   - Verify Workload Identity Federation setup
   - Validate environment variables

2. **Deployment Failures**
   - Check Cloud Build logs
   - Verify container image exists
   - Check Cloud Run service configuration

3. **Performance Issues**
   - Check Cloud Monitoring dashboards
   - Analyze Cloud Trace traces
   - Review BigQuery query performance

### Support Resources

1. **Documentation**
   - README.md for project overview
   - Component-specific documentation in docs/
   - Architecture diagrams in docs/DIAGRAMS.md

2. **Community Support**
   - GitHub Issues for bug reports
   - Stack Overflow for usage questions
   - Slack/Discord for real-time help

3. **Google Cloud Support**
   - Cloud Console for resource management
   - Cloud Support for enterprise customers
   - Documentation and best practices

## Conclusion

This development workflow ensures consistent, high-quality contributions to the Dulce de Saigon platform. By following these guidelines, developers can efficiently build, test, and deploy features while maintaining the security and compliance standards required for the Vietnamese F&B market.