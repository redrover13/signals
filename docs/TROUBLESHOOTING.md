# Dulce de Saigon Troubleshooting Guide

## Overview

This guide provides solutions to common issues that may arise when working with the Dulce de Saigon platform. It covers development, deployment, and runtime issues.

## Development Issues

### Environment Setup Problems

#### Node.js Version Issues
**Problem**: "engine not compatible" error when running pnpm install
**Solution**: 
1. Check your Node.js version: `node --version`
2. Install the correct version using nvm:
   ```bash
   nvm install 18
   nvm use 18
   ```
3. Or install the correct version using your package manager

#### PNPM Installation Issues
**Problem**: PNPM not found or version mismatch
**Solution**:
1. Install PNPM globally: `npm install -g pnpm`
2. Check version: `pnpm --version`
3. Ensure version 8.x is installed

#### Google Cloud SDK Issues
**Problem**: Authentication errors or commands not found
**Solution**:
1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Initialize: `gcloud init`
3. Authenticate: `gcloud auth login`
4. Set project: `gcloud config set project YOUR_PROJECT_ID`

### Dependency Issues

#### Missing Dependencies
**Problem**: Module not found errors
**Solution**:
1. Run `pnpm install` to install all dependencies
2. Check package.json for missing dependencies
3. Add missing dependencies: `pnpm add package-name`

#### Version Conflicts
**Problem**: Dependency version conflicts
**Solution**:
1. Check pnpm-lock.yaml for conflicts
2. Update dependencies: `pnpm update package-name`
3. Clear cache if needed: `pnpm store prune`

### Nx Monorepo Issues

#### Nx Command Not Found
**Problem**: "nx: command not found" error
**Solution**:
1. Install Nx globally: `npm install -g nx`
2. Or use npx: `npx nx serve api`

#### Affected Commands Not Working
**Problem**: Nx affected commands not detecting changes
**Solution**:
1. Check git status: `git status`
2. Ensure changes are committed or staged
3. Run with base and head: `nx affected --target=build --base=main --head=HEAD`

#### Build Failures
**Problem**: Build errors in specific projects
**Solution**:
1. Check project configuration in project.json
2. Verify TypeScript configuration in tsconfig.json
3. Check for circular dependencies: `nx graph`

## API Service Issues

### Startup Failures

#### Port Already In Use
**Problem**: "listen EADDRINUSE" error
**Solution**:
1. Check which process is using the port: `lsof -i :3000`
2. Kill the process: `kill -9 PID`
3. Or change the port in .env: `PORT=3001`

#### Environment Variable Issues
**Problem**: "Missing required environment variable" error
**Solution**:
1. Check .env file for missing variables
2. Ensure all required variables are set
3. Verify variable names match expected values

### Endpoint Issues

#### 404 Errors
**Problem**: Endpoints returning 404
**Solution**:
1. Check route registration in main.ts
2. Verify route prefixes in project.json
3. Ensure routes are properly exported

#### 500 Errors
**Problem**: Endpoints returning 500
**Solution**:
1. Check logs for error details
2. Verify database connections
3. Check for unhandled exceptions in route handlers

### Pub/Sub Issues

#### Publishing Failures
**Problem**: Events not being published to Pub/Sub
**Solution**:
1. Check Pub/Sub topic name in environment variables
2. Verify service account permissions
3. Check network connectivity to Google Cloud

#### Subscription Issues
**Problem**: Ingest worker not receiving messages
**Solution**:
1. Check Pub/Sub subscription configuration
2. Verify subscription is active
3. Check for message acknowledgment issues

## Agents Service Issues

### Agent Execution Failures

#### Tool Not Found
**Problem**: "Tool not found" error when running agents
**Solution**:
1. Check agent configuration for tool registration
2. Verify tool implementation exists
3. Check tool name spelling and case

#### Vertex AI Integration Issues
**Problem**: AI insights not being generated
**Solution**:
1. Check Vertex AI API key and permissions
2. Verify model name and region
3. Check for quota exceeded errors

### Performance Issues

#### Slow Agent Execution
**Problem**: Agents taking too long to complete tasks
**Solution**:
1. Check for inefficient database queries
2. Optimize tool implementations
3. Increase agent timeout settings

## Database Issues

### BigQuery Connection Issues

#### Authentication Failures
**Problem**: "Unauthorized" errors when accessing BigQuery
**Solution**:
1. Check service account credentials
2. Verify BigQuery API is enabled
3. Check dataset and table permissions

#### Query Performance Issues
**Problem**: Slow query execution
**Solution**:
1. Optimize query with partitioning
2. Use clustering for large tables
3. Check for inefficient joins or subqueries

### Data Consistency Issues

#### Missing Data
**Problem**: Events or agent runs not appearing in tables
**Solution**:
1. Check Pub/Sub message processing
2. Verify table schemas match expected data
3. Check for data validation errors

## Deployment Issues

### Cloud Run Deployment Failures

#### Build Failures
**Problem**: Container build failing during deployment
**Solution**:
1. Check Dockerfile for syntax errors
2. Verify all dependencies are included
3. Check build context and file paths

#### Health Check Failures
**Problem**: Service not passing health checks
**Solution**:
1. Check health check endpoint implementation
2. Verify all required services are available
3. Check environment variable configuration

### Terraform Issues

#### Apply Failures
**Problem**: Terraform apply failing
**Solution**:
1. Check error message for specific resource
2. Verify required APIs are enabled
3. Check for resource quota limits

#### State Issues
**Problem**: Terraform state conflicts
**Solution**:
1. Check state file permissions
2. Use terraform refresh to sync state
3. Resolve conflicts manually if needed

## Security Issues

### Authentication Failures

#### Workload Identity Federation Issues
**Problem**: CI/CD authentication failing
**Solution**:
1. Check GitHub repository binding
2. Verify workload identity pool configuration
3. Check service account permissions

#### API Key Issues
**Problem**: API key authentication failing
**Solution**:
1. Check API key in Secret Manager
2. Verify key has correct permissions
3. Check for key expiration

### Authorization Issues

#### Permission Denied Errors
**Problem**: "Permission denied" when accessing resources
**Solution**:
1. Check IAM roles and permissions
2. Verify service account assignments
3. Check for organization policy restrictions

## Vietnamese Localization Issues

### Language Display Issues

#### Text Not Translated
**Problem**: English text appearing in Vietnamese UI
**Solution**:
1. Check translation files for missing keys
2. Verify language detection logic
3. Check for hardcoded English strings

#### Cultural Adaptation Issues
**Problem**: Inappropriate cultural references
**Solution**:
1. Review content with Vietnamese cultural consultants
2. Update culturally specific content
3. Verify date and currency formats

## Monitoring and Logging Issues

### Missing Logs

#### Logs Not Appearing
**Problem**: Expected logs not showing in Cloud Logging
**Solution**:
1. Check log level configuration
2. Verify logging library is properly initialized
3. Check for log filtering rules

#### Log Format Issues
**Problem**: Unstructured or incomplete logs
**Solution**:
1. Check logging configuration
2. Verify structured logging implementation
3. Check for log truncation issues

## Performance Issues

### High Latency

#### API Response Time Issues
**Problem**: Slow API responses
**Solution**:
1. Check for database query bottlenecks
2. Optimize network calls
3. Implement caching where appropriate

#### Resource Utilization Issues
**Problem**: High CPU or memory usage
**Solution**:
1. Check for memory leaks
2. Optimize resource-intensive operations
3. Scale Cloud Run instances

## Network Issues

### Connectivity Problems

#### Intermittent Connection Loss
**Problem**: Intermittent connection failures
**Solution**:
1. Check network stability
2. Implement retry logic with exponential backoff
3. Check for firewall or network policy restrictions

#### DNS Resolution Issues
**Problem**: Hostname resolution failures
**Solution**:
1. Check DNS configuration
2. Verify domain name spelling
3. Check for network connectivity issues

## Cost Management Issues

### Unexpected Charges

#### High Billing
**Problem**: Unexpected high costs
**Solution**:
1. Check billing alerts and budgets
2. Review resource usage patterns
3. Optimize resource allocation

#### Quota Exceeded
**Problem**: Service quota exceeded errors
**Solution**:
1. Request quota increase
2. Optimize resource usage
3. Implement rate limiting

## Conclusion

This troubleshooting guide covers the most common issues that may arise when working with the Dulce de Saigon platform. For issues not covered in this guide, check the detailed logs and consult the relevant documentation. If you're still experiencing problems, consider reaching out to the development team or relevant support channels.

Regular maintenance and monitoring can help prevent many of these issues from occurring in the first place. Make sure to keep dependencies updated, monitor resource usage, and review logs regularly for potential problems.