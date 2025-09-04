# 📘 Signals Monorepo Best Practices

## 1. Project Purpose

The Signals monorepo is a comprehensive data platform for the Vietnamese F&B market (Dulce de Saigon). It ingests data from multiple sources (GA4, CRM, social media, CMS), processes it through BigQuery and dbt transformations, and leverages AI agents orchestrated by Google Gemini to provide actionable insights through a Next.js frontend. The system emphasizes Vietnamese localization, regulatory compliance, and enterprise-grade security.

## 2. Project Structure

### Core Architecture

- **`apps/`** - Deployable applications (cloud functions, frontend, agents, event parsers)
- **`libs/`** - Reusable libraries organized by domain (agents, data-models, gcp, mcp, utils)
- **`infra/`** - Infrastructure as Code (Terraform modules, Cloud Workflows)
- **`.github/`** - CI/CD workflows, scripts, and automation tools
- **`.kilocode/`** - AI coding standards and governance rules

### Key Directories

- **`apps/cloud-functions/`** - Serverless APIs for data ingestion (social, CRM, CMS, reviews)
- **`apps/frontend-agents/`** - Next.js user interface
- **`libs/agents/`** - AI agent implementations (BQ, Looker, CRM, content, reviews)
- **`libs/gcp/`** - Google Cloud Platform integrations and utilities
- **`libs/mcp/`** - Model Context Protocol implementations
- **`infra/terraform/`** - Infrastructure modules (BigQuery, functions, Vertex AI, Looker)

### NX Project Organization

```typescript
// ✅ Good: Proper library structure
libs / gcp / src / lib / bigquery / bigquery.service.ts;
bigquery.types.ts;
storage / storage.service.ts;
index.ts; // Barrel export

// ❌ Bad: Mixing concerns
libs / utils / src / bigquery - helper.ts; // Should be in gcp lib
react - components.ts; // Should be in UI lib
```

## 3. Test Strategy

### Framework & Organization

- **Primary**: Jest with TypeScript support via `ts-jest`
- **Structure**: Co-located `*.spec.ts` files alongside source code
- **Configuration**: NX-managed Jest projects with shared configuration

### Testing Patterns

#### Unit Tests

```typescript
// ✅ Good: Proper unit test structure
describe('MCPService', () => {
  let service: MCPService;
  let mockBigQueryClient: jest.Mocked<BigQuery>;

  beforeEach(() => {
    mockBigQueryClient = createMockBigQueryClient();
    service = new MCPService(mockBigQueryClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process data successfully', async () => {
    // Arrange
    const testData = { id: '1', name: 'test' };
    mockBigQueryClient.query.mockResolvedValue([testData]);

    // Act
    const result = await service.processData('test-query');

    // Assert
    expect(result).toEqual(testData);
    expect(mockBigQueryClient.query).toHaveBeenCalledWith('test-query');
  });
});
```

#### Integration Tests

```typescript
// ✅ Good: Integration test with proper setup
describe('BigQuery Integration', () => {
  let bigQueryService: BigQueryService;

  beforeAll(async () => {
    // Use test project and dataset
    bigQueryService = new BigQueryService({
      projectId: 'test-project',
      datasetId: 'test_dataset',
    });
  });

  it('should create and query table', async () => {
    const tableName = `test_table_${Date.now()}`;

    await bigQueryService.createTable(tableName, schema);
    const result = await bigQueryService.query(`SELECT * FROM ${tableName}`);

    expect(result).toBeDefined();
  });
});
```

### Test Quality Guidelines

- **Arrange-Act-Assert**: Structure tests clearly
- **Descriptive Names**: Test names should describe the behavior
- **Mock External Dependencies**: Always mock GCP services, APIs, databases
- **Test Edge Cases**: Include error scenarios and boundary conditions
- **Cleanup**: Properly clean up resources in tests

## 4. Code Style

### TypeScript Standards

#### Type Safety

```typescript
// ✅ Good: Explicit types and proper error handling
interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly preferences: UserPreferences;
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const user = await userService.findById(userId);
    return user ? mapToUserProfile(user) : null;
  } catch (error) {
    logger.error('Failed to get user profile', { userId, error });
    throw new UserServiceError('Unable to retrieve user profile', { cause: error });
  }
}

// ❌ Bad: Any types and poor error handling
async function getUserProfile(userId: any): Promise<any> {
  const user = await userService.findById(userId);
  return user;
}
```

#### Async/Await Patterns

```typescript
// ✅ Good: Proper async patterns with error handling
async function processOrderBatch(orders: Order[]): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];

  // Process in batches to avoid overwhelming services
  for (const batch of chunk(orders, 10)) {
    const batchResults = await Promise.allSettled(batch.map((order) => processOrder(order)));

    results.push(...batchResults.map(mapSettledResult));
  }

  return results;
}

// ❌ Bad: Sequential processing without error handling
async function processOrderBatch(orders: Order[]): Promise<any[]> {
  const results = [];
  for (const order of orders) {
    results.push(await processOrder(order));
  }
  return results;
}
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`, `data-models.spec.ts`)
- **Classes**: PascalCase (`MCPService`, `BigQueryClient`)
- **Functions/Variables**: camelCase (`getUserData`, `isInitialized`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`)
- **Interfaces**: PascalCase with descriptive names (`UserProfile`, `DatabaseConfig`)
- **Types**: PascalCase (`OrderStatus`, `PaymentMethod`)

### Error Handling Patterns

```typescript
// ✅ Good: Custom error classes with context
export class BigQueryError extends Error {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'BigQueryError';
  }
}

// Usage
try {
  const result = await bigQuery.query(sql);
  return result;
} catch (error) {
  throw new BigQueryError(
    'Failed to execute query',
    sql,
    error instanceof Error ? error : new Error(String(error)),
  );
}
```

### Code Organization

```typescript
// ✅ Good: Barrel exports with clear structure
// libs/gcp/src/index.ts
export * from './lib/bigquery';
export * from './lib/storage';
export * from './lib/secret-manager';
export { GCPConfig } from './lib/config';

// libs/gcp/src/lib/bigquery/index.ts
export { BigQueryService } from './bigquery.service';
export { BigQueryError } from './bigquery.error';
export type { BigQueryConfig, QueryResult } from './bigquery.types';
```

## 5. Common Patterns

### Singleton Services

```typescript
// ✅ Good: Thread-safe singleton with proper typing
export class MCPService {
  private static instance: MCPService | null = null;
  private readonly clients = new Map<string, MCPClient>();

  private constructor(private readonly config: MCPConfig) {}

  public static getInstance(config?: MCPConfig): MCPService {
    if (!MCPService.instance) {
      if (!config) {
        throw new Error('MCPService requires config for first initialization');
      }
      MCPService.instance = new MCPService(config);
    }
    return MCPService.instance;
  }

  async initialize(): Promise<void> {
    // Initialization logic
  }

  async shutdown(): Promise<void> {
    await Promise.all([...this.clients.values()].map((client) => client.close()));
    this.clients.clear();
  }
}
```

### GCP Service Integration

```typescript
// ✅ Good: Proper GCP service wrapper with retry logic
export class BigQueryService {
  private readonly client: BigQuery;
  private readonly retryConfig: RetryConfig;

  constructor(config: BigQueryConfig) {
    this.client = new BigQuery({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
    });
    this.retryConfig = config.retryConfig ?? DEFAULT_RETRY_CONFIG;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.withRetry(async () => {
      const [rows] = await this.client.query({
        query: sql,
        params,
        location: 'asia-southeast1', // Vietnamese data residency
      });
      return rows as T[];
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.retryConfig.maxAttempts || !this.isRetryableError(error)) {
          break;
        }

        await this.delay(this.retryConfig.baseDelay * Math.pow(2, attempt - 1));
      }
    }

    throw new BigQueryError('Operation failed after retries', undefined, lastError);
  }
}
```

### Configuration Management

```typescript
// ✅ Good: Type-safe configuration with validation
import { z } from 'zod';

const ConfigSchema = z.object({
  gcp: z.object({
    projectId: z.string().min(1),
    region: z.string().default('asia-southeast1'),
    credentials: z.string().optional(),
  }),
  database: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    name: z.string(),
  }),
  features: z.object({
    enableAnalytics: z.boolean().default(true),
    maxRetries: z.number().int().positive().default(3),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(): AppConfig {
  const rawConfig = {
    gcp: {
      projectId: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION,
      credentials: process.env.GCP_CREDENTIALS,
    },
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432'),
      name: process.env.DB_NAME,
    },
    features: {
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      maxRetries: parseInt(process.env.MAX_RETRIES ?? '3'),
    },
  };

  return ConfigSchema.parse(rawConfig);
}
```

## 6. Do's and Don'ts

### ✅ Do's

- Use NX generators (`nx g`) for creating new projects and components
- Respect NX project boundaries and dependency constraints
- Tag AI-generated code with `// AI-GENERATED` comments
- Use TypeScript path mapping for clean imports
- Implement proper error boundaries in React components
- Use environment-specific configuration files
- Follow semantic versioning for releases
- Write idempotent operations where possible
- Use proper TypeScript generics for reusable components
- Implement comprehensive logging for debugging
- **Use explicit return types for public APIs**
- **Implement proper input validation with Zod schemas**
- **Use readonly properties for immutable data**
- **Prefer composition over inheritance**
- **Use dependency injection for testability**

### ❌ Don'ts

- Don't bypass NX module boundaries
- Don't commit secrets or sensitive data to version control
- Don't use `any` type without justification
- Don't create circular dependencies between libraries
- Don't ignore TypeScript compiler warnings
- Don't hardcode configuration values
- Don't skip error handling in async operations
- Don't use deprecated APIs without migration plans
- Don't mix CommonJS and ES modules
- Don't ignore accessibility requirements in frontend code
- **Don't use `console.log` in production code - use structured logging**
- **Don't mutate props or state directly**
- **Don't ignore promise rejections**
- **Don't use `@ts-ignore` without explanation**
- **Don't create God objects or functions**

## 7. Tools & Dependencies

### Core Technologies

- **Runtime**: Node.js 20+ with ES modules
- **Package Manager**: pnpm with workspace support
- **Monorepo**: NX with caching and affected builds
- **Language**: TypeScript with strict configuration
- **Testing**: Jest with TypeScript support
- **Linting**: ESLint with NX and TypeScript rules
- **Formatting**: Prettier with consistent configuration

### Cloud & Infrastructure

- **Platform**: Google Cloud Platform
- **IaC**: Terraform with modular structure
- **CI/CD**: GitHub Actions with Workload Identity Federation
- **Orchestration**: Google Cloud Workflows
- **Security**: Google Secret Manager, IAM with least privilege

### AI & Data

- **AI Platform**: Google Vertex AI and Gemini
- **Data Warehouse**: BigQuery with dbt transformations
- **Messaging**: Google Cloud Pub/Sub
- **Analytics**: Google Analytics 4 integration

### Development Workflow

```bash
# Setup
pnpm install
pnpm hooks:install

# Development
pnpm nx serve <app-name>
pnpm nx test <project-name>
pnpm nx lint <project-name>

# Build and deploy
pnpm nx build <project-name>
pnpm nx affected --target=test
pnpm nx affected --target=build
```

### Linting Configuration

The project uses ESLint with NX integration to enforce code quality and consistency:

- **Base Configuration**: Configured in `.eslintrc.json` with TypeScript and JavaScript rules
- **Project-Specific Rules**: Each project can add custom rules in their own ESLint config
- **Enforcement**:
  - Pre-commit hooks via lint-staged
  - CI pipeline validation
  - NX commands: `pnpm nx lint <project-name>` or `pnpm nx affected --target=lint`

Key rules enforced include:

- TypeScript type safety (no-explicit-any, explicit-return-types)
- Unused variables detection
- Module boundary enforcement via NX
- React best practices (in React projects)
- Console usage limitations

## 8. Other Notes

### LLM Code Generation Guidelines

- Always review and understand AI-generated code before committing
- Use the project's established patterns and conventions
- Ensure proper error handling and type safety
- Follow the existing architectural patterns (singleton, dependency injection)
- Maintain consistency with existing code style and naming conventions
- Add appropriate tests for generated functionality
- Consider Vietnamese localization requirements for user-facing features
- **Include proper JSDoc comments for public APIs**
- **Use the project's custom error classes**
- **Follow the established logging patterns**
- **Implement proper input validation**

### Performance Optimization

```typescript
// ✅ Good: Efficient data processing with streaming
async function processLargeDataset(datasetId: string): Promise<void> {
  const stream = bigQuery.createQueryStream({
    query: `SELECT * FROM \`${datasetId}\``,
    location: 'asia-southeast1',
  });

  const processor = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      // Process chunk
      const processed = processChunk(chunk);
      callback(null, processed);
    },
  });

  return pipeline(stream, processor, createWriteStream('output.json'));
}

// ❌ Bad: Loading entire dataset into memory
async function processLargeDataset(datasetId: string): Promise<void> {
  const [rows] = await bigQuery.query(`SELECT * FROM \`${datasetId}\``);
  const processed = rows.map(processChunk);
  await writeFile('output.json', JSON.stringify(processed));
}
```

### Special Considerations

- **Vietnamese Compliance**: Ensure all user-facing content supports Vietnamese localization
- **Data Privacy**: Follow Vietnamese data protection regulations (see `.kilocode/rules/vietnamese-compliance.md`)
- **Performance**: Optimize for BigQuery query performance and cost
- **Security**: Implement proper authentication and authorization for all endpoints
- **Monitoring**: Use structured logging for observability in production
- **Idempotency**: Design operations to be safely retryable
- **Caching**: Leverage NX caching for build performance
- **Dependencies**: Keep dependencies up-to-date and scan for vulnerabilities

### Edge Cases & Constraints

- Handle BigQuery quota limits gracefully
- Implement proper backpressure for Pub/Sub consumers
- Consider time zone handling for Vietnamese market (ICT/UTC+7)
- Plan for multi-region deployment scenarios
- Handle network partitions and service degradation
- Implement proper circuit breaker patterns for external services
- Account for Vietnamese holidays and business hours in scheduling
- Handle currency formatting for Vietnamese Dong (VND)

## Document Owner

This document is owned by `garretnelson368@gmail.com`.
