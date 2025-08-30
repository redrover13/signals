# Dulce de Saigon API Service

The API service provides RESTful endpoints for the Dulce de Saigon F&B data platform. Built with Fastify for high performance and designed specifically for Vietnamese market requirements.

## Overview

This API service serves as the backend for the Dulce de Saigon platform, providing:

- **Health monitoring** and service status
- **Agent orchestration** via Google Cloud Pub/Sub
- **Semantic search** capabilities for repository content
- **Vietnamese-specific** data handling and localization

## Architecture

```
src/
├── main.ts           # Main application entry point
└── routes/
    ├── health.ts     # Health check endpoints
    ├── agents.ts     # Agent orchestration endpoints
    └── search.ts     # Semantic search endpoints
```

## Quick Start

### Prerequisites

- Node.js 18+ or 22+
- PNPM package manager
- Google Cloud Platform access
- Vietnamese locale support

### Running Locally

```bash
# Install dependencies (from root)
pnpm install

# Start the API server
pnpm nx serve api

# Or build and run
pnpm nx build api
node dist/apps/api/main.js
```

The API will be available at `http://localhost:3000`

### Environment Variables

```bash
# Required
PORT=3000                           # Server port (default: 3000)
AGENTS_TOPIC=dulce.agents          # Pub/Sub topic for agent tasks

# Google Cloud (automatically detected if using gcloud auth)
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
GOOGLE_CLOUD_PROJECT=your-project-id
```

## API Endpoints

### Health Check

Monitor service health and readiness.

#### `GET /health`

Returns the current status of the API service.

**Response:**
```json
{
  "status": "ok"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

### Agent Management

Orchestrate AI agents for F&B data processing and analysis.

#### `POST /agents/start`

Starts an agent task via Google Cloud Pub/Sub.

**Request Body:**
```json
{
  "task": "Plan a content calendar for Dulce de Saigon"
}
```

**Response:**
```json
{
  "ok": true,
  "id": "message-id-from-pubsub"
}
```

**Vietnamese Example:**
```bash
curl -X POST http://localhost:3000/agents/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Phân tích xu hướng món ăn Việt Nam mùa Tết"
  }'
```

### Semantic Search

Search through repository content with semantic understanding.

#### `POST /search/semantic-code-search`

Performs intelligent search across repository files, optimized for CI/CD and development queries.

**Request Body:**
```json
{
  "tool": "semantic-code-search",
  "query": "ci-common",
  "repoOwner": "redrover13",
  "repoName": "signals"
}
```

**Response:**
```json
{
  "query": "ci-common",
  "results": [
    {
      "file": "docs/CI_CD_WORKFLOW.md",
      "content": "## Common CI/CD Patterns...",
      "relevance": 25,
      "matches": ["ci-common", "CI", "common"]
    }
  ],
  "totalMatches": 1
}
```

**Vietnamese Search Example:**
```bash
curl -X POST http://localhost:3000/search/semantic-code-search \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "semantic-code-search",
    "query": "vietnamese localization",
    "repoOwner": "redrover13",
    "repoName": "signals"
  }'
```

## Vietnamese Market Features

The API provides specific support for Vietnamese F&B market requirements:

### Currency Handling (VND)

All monetary values should be handled in Vietnamese Dong with proper formatting:

```typescript
// Example Vietnamese currency formatting
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Usage: formatVND(150000) → "₫150.000"
```

### Date & Time Localization

Vietnamese date format (dd/mm/yyyy) and timezone (Asia/Ho_Chi_Minh):

```typescript
// Vietnamese date formatting
const formatVietnameseDate = (date: Date): string => {
  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
```

### Text Processing

Proper UTF-8 handling for Vietnamese characters:

```typescript
// Vietnamese text validation
const vietnameseTextRegex = /^[\p{L}\p{N}\s\-_.,!?]*$/u;
const isValidVietnameseText = (text: string): boolean => {
  return vietnameseTextRegex.test(text);
};
```

## Error Handling

The API uses standard HTTP status codes with Vietnamese-friendly error messages:

### Common Error Responses

```json
{
  "error": "Invalid tool. Expected 'semantic-code-search'",
  "message": "Công cụ không hợp lệ. Yêu cầu 'semantic-code-search'"
}
```

### Error Codes
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Authentication required  
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **500**: Internal Server Error - Server-side error

## Authentication & Authorization

The API integrates with Google Cloud Identity and Access Management:

### Service Account Authentication

```bash
# Authenticate using service account
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Or use gcloud auth
gcloud auth application-default login
```

### Vietnamese Data Privacy Compliance

All authentication follows Vietnamese Personal Data Protection Law:

- Data stored in GCP asia-southeast1 region
- Explicit consent tracking for data collection
- Secure data processing with audit trails

## Performance & Monitoring

### Health Monitoring

The API provides comprehensive health checks:

```bash
# Basic health check
curl http://localhost:3000/health

# Expected response time: < 100ms
# Expected availability: 99.9%
```

### Logging

Structured logging for Vietnamese compliance requirements:

```typescript
// Example structured log entry
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "dulce-api",
  "region": "asia-southeast1",
  "user_id": "DDS-user-123",
  "action": "menu_search",
  "vietnamese_content": true,
  "compliance_flag": "PDPL_compliant"
}
```

## Development

### Local Development

```bash
# Run in development mode with hot reload
pnpm nx serve api

# Run with custom port
PORT=3001 pnpm nx serve api

# Debug mode
DEBUG=* pnpm nx serve api
```

### Testing

```bash
# Run unit tests
pnpm nx test api

# Run with coverage
pnpm nx test api --coverage

# Test Vietnamese text handling
pnpm nx test api --testNamePattern="vietnamese"
```

### Code Quality

```bash
# Lint code
pnpm nx lint api

# Format code
pnpm nx format api

# Type check
pnpm nx type-check api
```

## Deployment

### Docker

```dockerfile
# Build production image
FROM node:18-alpine
COPY dist/apps/api ./
EXPOSE 3000
CMD ["node", "main.js"]
```

### Google Cloud Run

```bash
# Deploy to Cloud Run (asia-southeast1 for Vietnamese compliance)
gcloud run deploy dulce-api \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated
```

### Environment Configuration

Production environment variables:

```bash
NODE_ENV=production
PORT=8080
AGENTS_TOPIC=dulce.agents.prod
GOOGLE_CLOUD_PROJECT=dulce-de-saigon-prod
LOG_LEVEL=info
VIETNAMESE_LOCALE=vi-VN
TIMEZONE=Asia/Ho_Chi_Minh
```

## Security

### Vietnamese Data Protection

- All data encrypted in transit and at rest
- Regular security audits for Vietnamese compliance
- Data residency in asia-southeast1 region
- Secure API key management via Google Secret Manager

### Rate Limiting

```typescript
// Example rate limiting for Vietnamese market
const rateLimits = {
  default: 100, // requests per minute
  vietnamese_content: 50, // more processing required
  agent_tasks: 10 // resource intensive
};
```

## Contributing

1. **Follow Vietnamese context guidelines** in `.kilocode/rules/`
2. **Test with Vietnamese data** including UTF-8 characters
3. **Consider timezone impacts** (Asia/Ho_Chi_Minh)
4. **Validate currency handling** for VND
5. **Ensure data privacy compliance** per Vietnamese law

See the main [Contributing Guide](../../README.md#contributing) for general guidelines.

## Support

- **API Issues**: Open GitHub issue with "api" label
- **Vietnamese Features**: Use "vietnamese-market" label
- **Performance**: Include request/response samples
- **Security**: Contact maintainers privately for security issues

## Related Documentation

- [Vietnamese Localization Guide](../../docs/VIETNAMESE_LOCALIZATION.md)
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
- [Architecture Overview](../../docs/ARCHITECTURE.md)
- [CI/CD Workflow](../../docs/CI_CD_WORKFLOW.md)