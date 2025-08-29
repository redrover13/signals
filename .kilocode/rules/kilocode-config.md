# Kilocode.ai Configuration for Signals Monorepo

This directory contains configuration files and rules for Kilocode.ai, tailored for the Signals monorepo's NX and GCP agent system. These rules help enforce coding standards, architectural patterns, and best practices.

## How to Add/Modify Rules

1.  **Understand the Rule**: Clearly define the coding standard or pattern you want to enforce.
2.  **Create a New File**: Create a new Markdown file (e.g., `my-new-rule.md`) in this directory.
3.  **Define the Rule**: Use Kilocode's syntax to define the rule. Refer to Kilocode's official documentation for detailed syntax and examples.
4.  **Test the Rule**: Ensure your new rule works as expected by running Kilocode against relevant code.
5.  **Document**: Provide clear documentation within the rule file, explaining its purpose, rationale, and examples.

## Example Rule Structure (Conceptual)

```markdown
---
id: no-direct-bigquery-access-from-frontend
name: No Direct BigQuery Access from Frontend
description: Ensures that frontend applications do not directly access BigQuery.
severity: error
category: security
---

# Rule: No Direct BigQuery Access from Frontend

## Rationale

Direct access to BigQuery from frontend applications can lead to security vulnerabilities, expose sensitive credentials, and bypass backend access controls. All BigQuery interactions should be mediated through secure backend APIs.

## Non-Compliant Example

```typescript
// apps/frontend-agents/src/data/bigquery.ts
import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery();
// ... direct BigQuery operations ...
```

## Compliant Example

```typescript
// apps/frontend-agents/src/data/api.ts
import { apiClient } from '@signals/api-clients';

async function fetchData() {
  const data = await apiClient.get('/data/bigquery');
  return data;
}
```

## Remediation

Refactor direct BigQuery access to go through a dedicated backend API (e.g., a Cloud Function) that handles authentication, authorization, and data retrieval securely.
```

## Document Owner

This document is owned by `garretnelson368@gmail.com`.
